"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function ReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");

  // 🌟 STATE USER LOGIN
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  // 🌟 STATE FILTER PIC KHUSUS ADMIN: "Semua" = tampilkan semua PIC
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // Helper untuk membersihkan dan menstandarkan nama panggilan pendek (TOLERAN & SINKRON)
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("boby") || namaKecil.includes("pak boby") || namaKecil.includes("bobbi")) return "Boby";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  const getTargetMonthString = () => new Date().toISOString().substring(0, 7);

  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterMonth, setFilterMonth] = useState(getTargetMonthString());

  const initialFormState = () => ({
    tanggal: getTodayString(),
    pic: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    keterangan: "",
    responCall: 0,
    responChat: 0,
    responMeeting: 0,
    responVisit: 0,
    noResponCount: 0,
  });

  const [formInput, setFormInput] = useState(initialFormState);

  // AMAN SSR: Memuat profil setelah mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPic = localStorage.getItem("user_pic");
      const savedRole = localStorage.getItem("user_role") || localStorage.getItem("userRole");
      
      let panggilan = "Satria";
      if (savedPic) {
        panggilan = dapatkanNamaPanggilan(savedPic);
        setLoggedInUser(panggilan);
      }
      
      if (savedRole) {
        setUserRole(savedRole);
      } else {
        // 🔒 KONSISTENSI UTENTIKASI: Satria & Boby otomatis memegang kekuasaan Admin
        const namaBersih = panggilan.toLowerCase();
        setUserRole(namaBersih === "satria" || namaBersih === "boby" ? "Admin" : "Sales");
      }

      setFormInput(prev => ({ ...prev, pic: panggilan }));
      setIsSessionReady(true);
    }
  }, []);

  // SINKRONISASI FORM: Kunci PIC otomatis saat tambah data baru
  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const currentPic = dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria");
        setFormInput(prev => ({ 
          ...prev, 
          tanggal: getTodayString(),
          pic: currentPic 
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/report`);
      if (response.ok) {
        const result = await response.json();
        setData(result || []);
      }
    } catch (error) {
      console.error("Gagal memuat data report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // 📊 MENGUMPULKAN DAFTAR PIC UNIK SECARA LIVE DARI DATABASE REPORT UNTUK DROPDOWN ADMIN
  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.pic || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => ({
      ...prev,
      [name]: name === "tanggal" || name === "keterangan" || name === "pic"
        ? value 
        : value === "" ? 0 : Number(value),
    }));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (Number(e.target.value) === 0) e.target.select();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formInput,
      pic: dapatkanNamaPanggilan(formInput.pic)
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = isEditMode && selectedRecord
        ? `${baseUrl}/api/report/update/${selectedRecord.id || selectedRecord.ID}`
        : `${baseUrl}/api/report/create`;
      
      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditMode ? "Log report harian berhasil diperbarui!" : "Log aktivitas harian berhasil disimpan permanen!");
        setIsModalOpen(false);
        setFilterDate(formInput.tanggal);
        setFilterMonth(formInput.tanggal.substring(0, 7));
        resetForm();
        fetchReports();
      }
    } catch (error) {
      console.error("Error saving report log:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !window.confirm("Apakah Anda yakin ingin menghapus data log report ini secara permanen?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/report/delete/${selectedRecord.id || selectedRecord.ID}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Data log report berhasil dihapus!");
        setIsModalOpen(false);
        resetForm();
        fetchReports();
      }
    } catch (error) { console.error(error); }
  };

  const handleOpenRowDetail = (item: any) => {
    setSelectedRecord(item);
    setIsEditMode(false); 
    setIsModalOpen(true);
  };

  const handleActivateEditMode = () => {
    if (!selectedRecord) return;
    setIsEditMode(true);
    setFormInput({
      tanggal: selectedRecord.tanggal ? selectedRecord.tanggal.substring(0, 10) : getTodayString(),
      keterangan: selectedRecord.keterangan || "",
      pic: dapatkanNamaPanggilan(selectedRecord.pic || loggedInUser), 
      responCall: selectedRecord.responCall ?? 0,
      responChat: selectedRecord.responChat ?? 0,
      responMeeting: selectedRecord.responMeeting ?? 0,
      responVisit: selectedRecord.responVisit ?? 0,
      noResponCount: selectedRecord.noResponCount ?? selectedRecord.totalNoRespon ?? 0,
    });
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr || !tglStr.includes("-")) return tglStr;
    const [year, month, day] = tglStr.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  };

  const formatBulanIndo = (blnStr: string) => {
    if (!blnStr || !blnStr.includes("-")) return blnStr;
    const [year, month] = blnStr.split("-");
    return `${new Date(Number(year), Number(month) - 1).toLocaleString("id-ID", { month: "long" })} ${year}`;
  };

  // 🔍 🌟 LOGIKA FILTER UTAMA HAK AKSES PER PIC SALES & ADMIN MULTI-USER
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.pic || "");
    const matchesSearch = 
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());

    const isUserAdmin = userRole.toLowerCase() === "admin";
    
    // 🔒 PROSES FILTER AKSES KETAT
    let matchesRoleAkses: boolean;
    if (isUserAdmin) {
      // Jika Admin, dia berhak memfilter data berdasarkan PIC yang dipilih di dropdown
      matchesRoleAkses = picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase();
    } else {
      // Jika Sales, dipaksa hanya melihat miliknya sendiri (Toleransi substring 4 karakter)
      const kunciPicDb = itemPicPanggilan.toLowerCase().substring(0, 4);
      const kunciPicLogin = loggedInUser.toLowerCase().substring(0, 4);
      matchesRoleAkses = kunciPicDb === kunciPicLogin || itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();
    }

    const itemDateStr = item.tanggal ? item.tanggal.substring(0, 10) : "";
    let matchesTanggal = false;
    
    if (modeFilter === "harian") {
      matchesTanggal = itemDateStr === filterDate || itemDateStr.includes(filterDate);
    } else {
      matchesTanggal = item.tanggal ? item.tanggal.substring(0, 7) === filterMonth : false;
    }

    return matchesSearch && matchesRoleAkses && matchesTanggal;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#F5F5F7] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Daily Report Activity</h1>
          <p className="text-xs text-[#86868B] mt-0.5 font-medium">Ringkasan log performa harian operasional PT PIPOSMART DIGITAL INDONESIA.</p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {isSessionReady ? loggedInUser : "Loading..."} ({userRole})</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/report/export`}
            className="px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm transition cursor-pointer"
          >
            📥 Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-bold text-xs hover:bg-blue-600 shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Log Aktivitas Baru
          </button>
        </div>
      </div>

      {/* FILTER CONTROLLER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E8ED] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari kata kunci keterangan..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* 👤 DROPDOWN FILTER PIC SALES — HANYA UNTUK ROLE ADMIN */}
          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#007AFF] uppercase whitespace-nowrap">👤 PIC Sales:</span>
              <select
                value={picFilterAdmin}
                onChange={(e) => setPicFilterAdmin(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="Semua">Semua PIC</option>
                {daftarPicUnik.map((pic) => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5EA]">
            <button type="button" onClick={() => setModeFilter("harian")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "harian" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"}`}>Harian</button>
            <button type="button" onClick={() => setModeFilter("bulanan")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "bulanan" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"}`}>Bulanan</button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-[#E5E5EA] w-full sm:w-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap px-1">{modeFilter === "harian" ? "Pilih Tanggal:" : "Pilih Bulan:"}</span>
          <input 
            type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? filterDate : filterMonth}
            onChange={(e) => modeFilter === "harian" ? setFilterDate(e.target.value) : setFilterMonth(e.target.value)}
            className="bg-white text-xs font-black text-[#1D1D1F] px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none cursor-pointer uppercase"
          />
        </div>
      </div>

      {/* ACTIVITY LIST LAYOUT */}
      {loading || !isSessionReady ? (
        <div className="text-center py-24 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke server report activity...</div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center py-28 px-4 text-center min-h-[350px]">
          <span className="text-4xl mb-4 select-none">📬</span>
          <p className="text-[#8E8E93] font-bold text-sm tracking-tight max-w-md leading-relaxed">
            Belum ada record follow up untuk {modeFilter === "harian" ? `tanggal ${filterDate}` : `bulan ${filterMonth}`}
            {userRole.toLowerCase() === "admin" && picFilterAdmin !== "Semua" ? ` untuk PIC ${picFilterAdmin}` : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item: any, idx: number) => {
            const tRespon = Number(item.responCall ?? 0) + Number(item.responChat ?? 0) + Number(item.responMeeting ?? 0) + Number(item.responVisit ?? 0);
            const tNoRespon = Number(item.noResponCount ?? item.totalNoRespon ?? 0);
            return (
              <div 
                key={idx} onClick={() => handleOpenRowDetail(item)} 
                className="bg-white rounded-2xl border border-[#E8E8ED] p-5 shadow-sm hover:shadow-md transition grid grid-cols-1 lg:grid-cols-12 gap-5 items-center relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute left-0 inset-y-0 w-1 bg-[#007AFF]" />
                <div className="lg:col-span-5 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-md">📅 Laporan Kerja</span>
                    <span className="text-[10px] uppercase font-extrabold text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded-md">👤 {dapatkanNamaPanggilan(item.pic)}</span>
                    <span className="text-xs font-bold text-gray-500">{formatTanggalIndo(item.tanggal)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed pr-2 truncate">{item.keterangan || "Tidak ada rincian aktivitas tambahan kerja."}</p>
                </div>
                <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#F5F5F7] border border-gray-100 p-3 rounded-xl text-center">
                  <div><span className="text-[9px] text-gray-400 font-bold block uppercase">Call</span><span className="text-xs font-black text-gray-800 mt-0.5 block">{item.responCall ?? 0}</span></div>
                  <div><span className="text-[9px] text-gray-400 font-bold block uppercase">Chat</span><span className="text-xs font-black text-gray-800 mt-0.5 block">{item.responChat ?? 0}</span></div>
                  <div><span className="text-[9px] text-gray-400 font-bold block uppercase">Meeting</span><span className="text-xs font-black text-gray-800 mt-0.5 block">{item.responMeeting ?? 0}</span></div>
                  <div><span className="text-[9px] text-gray-400 font-bold block uppercase">Visit</span><span className="text-xs font-black text-gray-800 mt-0.5 block">{item.responVisit ?? 0}</span></div>
                  <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-gray-200/60 pt-2 sm:pt-0">
                    <span className="text-[9px] text-rose-500 font-bold block uppercase">No Respon</span><span className="text-xs font-black text-rose-600 mt-0.5 block">{tNoRespon}</span>
                  </div>
                </div>
                <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                  <div><span className="text-[9px] text-gray-400 font-bold uppercase block">Terrespon</span><span className="text-sm font-black text-emerald-600 block mt-0.5">{tRespon} Nasabah</span></div>
                  <div className="text-right bg-blue-50/50 border border-blue-100/50 px-3.5 py-1.5 rounded-xl min-w-[70px]">
                    <span className="text-[9px] text-[#007AFF] font-extrabold uppercase block">Grand Total</span>
                    <span className="text-base font-black text-[#007AFF] block mt-0.5">{tRespon + tNoRespon}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POP-UP MODAL FORM INPUT DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-md font-bold text-[#1D1D1F]">{selectedRecord && !isEditMode ? "📋 Rincian Log Performa Kerja" : isEditMode ? "✏️ Ubah Log Performa Kerja" : "➕ Tambah Log Aktivitas Harian"}</h2>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Sistem otomatis mengunci PIC berdasarkan akun login aktif.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 text-sm p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Pilih Tanggal Operasional Laporan</label>
                  <input 
                    type="date" name="tanggal" value={selectedRecord && !isEditMode ? selectedRecord.tanggal?.substring(0, 10) : formInput.tanggal} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-3 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7] uppercase cursor-pointer" required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">PIC Laporan</label>
                  <input type="text" name="pic" value={formInput.pic} disabled className="border border-[#E5E5EA] p-3 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-[#007AFF] bg-blue-100/60 px-2.5 py-0.5 rounded-md uppercase">Kategori Nasabah Terrespon</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-blue-900/80">Aktivitas Call (Telepon)</label>
                    <input type="number" name="responCall" value={selectedRecord && !isEditMode ? (selectedRecord.responCall ?? 0) : (formInput.responCall === 0 ? "" : formInput.responCall)} onChange={handleInputChange} onFocus={handleInputFocus} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-blue-900/80">Aktivitas Chat (WhatsApp)</label>
                    <input type="number" name="responChat" value={selectedRecord && !isEditMode ? (selectedRecord.responChat ?? 0) : (formInput.responChat === 0 ? "" : formInput.responChat)} onChange={handleInputChange} onFocus={handleInputFocus} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-blue-900/80">Online Meeting</label>
                    <input type="number" name="responMeeting" value={selectedRecord && !isEditMode ? (selectedRecord.responMeeting ?? 0) : (formInput.responMeeting === 0 ? "" : formInput.responMeeting)} onChange={handleInputChange} onFocus={handleInputFocus} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-blue-900/80">Visit Lapangan</label>
                    <input type="number" name="responVisit" value={selectedRecord && !isEditMode ? (selectedRecord.responVisit ?? 0) : (formInput.responVisit === 0 ? "" : formInput.responVisit)} onChange={handleInputChange} onFocus={handleInputFocus} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-black text-gray-500 bg-gray-200/80 px-2.5 py-0.5 rounded-md uppercase">Kategori Tidak Merrespon</span>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Total Nasabah No Respon</label>
                  <input type="number" name="noResponCount" value={selectedRecord && !isEditMode ? (selectedRecord.noResponCount ?? selectedRecord.totalNoRespon ?? 0) : (formInput.noResponCount === 0 ? "" : formInput.noResponCount)} onChange={handleInputChange} onFocus={handleInputFocus} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-white disabled:bg-[#F5F5F7]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-600">Keterangan / Aktivitas Kerja Tambahan</label>
                <textarea name="keterangan" rows={3} placeholder="Tulis detail aktivitas kerja..." value={selectedRecord && !isEditMode ? selectedRecord.keterangan : formInput.keterangan} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-3 rounded-xl text-sm font-medium text-gray-800 resize-none focus:outline-none bg-white disabled:bg-[#F5F5F7] font-sans" required />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-2">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer">✏️ Ubah / Edit</button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-xs transition cursor-pointer">🗑️ Hapus Log</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold hover:bg-[#0062CC] text-sm shadow-md cursor-pointer">{isEditMode ? "Simpan Perubahan" : "Simpan Report"}</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}