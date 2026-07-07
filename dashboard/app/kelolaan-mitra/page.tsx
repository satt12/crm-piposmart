"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function KelolaanMitraPage() {
  const [data, setData] = useState<any[]>([]);
  const [listMitraMaster, setListMitraMaster] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 🌟 STATE USER DROPDOWN FILTER UNTUK ADMIN
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // 🌟 STATE USER LOGIN & SESSION (Aman dari Eror Hydration SSR)
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // 🌟 State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  const listBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  const getTargetMonthString = () => {
    return new Date().toISOString().substring(0, 7); 
  };

  // 📅 State Filter Tanggal (Harian) & Bulan (Bulanan)
  const [tanggalFilter, setTanggalFilter] = useState(getTodayString());
  const [bulanFilter, setBulanFilter] = useState(getTargetMonthString());

  const getNamaBulanLokal = (tglStr: string) => {
    if (!tglStr) return listBulan[new Date().getMonth()];
    const [_, month] = tglStr.split("-");
    return listBulan[Number(month) - 1];
  };

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

  const initialFormState = () => ({
    tanggalInput: getTodayString(),
    namaMitra: "",
    picNasabah: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    brandUtama: "",
    kodeOwnerUtama: "",
    kategoriMitra: "Referral",
    paketLangganan: "Bisnis 12 Bulan",
    statusLangganan: "Berlangganan",
    buktiFu: "",
    statusInput: "Done",
    nominal_komisi: "",
    status_komisi: "Pending"
  });

  const [formInput, setFormInput] = useState(initialFormState);

  // AMAN SSR: Membaca session login di client-side setelah mounted
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
        const namaBersih = panggilan.toLowerCase();
        setUserRole(namaBersih === "satria" || namaBersih === "boby" ? "Admin" : "Sales");
      }

      setFormInput(prev => ({ ...prev, picNasabah: panggilan }));
      setIsSessionReady(true);
    }
  }, []);

  // 🔒 SINKRONISASI MODAL AUTOMATIC LOCK
  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const currentPic = dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria");
        setFormInput(prev => ({ 
          ...prev, 
          tanggalInput: getTodayString(),
          picNasabah: currentPic 
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  const fetchMitra = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/kelolaan-mitra`);
      if (response.ok) {
        const result = await response.json();
        setData(result || []);
      }
    } catch (error) {
      console.error("Gagal memuat data kelolaan mitra:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListMitraMaster = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/list-mitra`);
      if (response.ok) {
        const result = await response.json();
        setListMitraMaster(result || []); 
      }
    } catch (error) {
      console.error("Gagal sinkronisasi data list-mitra master:", error);
    }
  };

  useEffect(() => {
    fetchMitra();
    fetchListMitraMaster();
  }, []);

  // 📊 LIVE DISTRIBUSI DAFTAR PIC UNIK DARI DATABASE KELOLAAN MITRA
  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.picNasabah || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => ({
      ...prev,
      [name]: name === "nominal_komisi" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleMitraSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNamaOwner = e.target.value; 
    const matchMitra: any = listMitraMaster.find(
      (m: any) => (m.owner || m.ownerMitra || "").toLowerCase().trim() === selectedNamaOwner.toLowerCase().trim()
    );

    setFormInput((prev) => ({
      ...prev,
      namaMitra: selectedNamaOwner,
      brandUtama: matchMitra ? (matchMitra.brand || matchMitra.namaBrand || "") : "",
      kodeOwnerUtama: matchMitra ? (matchMitra.kodeOwner || "") : ""
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const payload = {
        ...formInput,
        picNasabah: dapatkanNamaPanggilan(formInput.picNasabah),
        nominal_komisi: Number(formInput.nominal_komisi) || 0
      };

      const url = isEditMode && selectedRecord
        ? `${baseUrl}/api/kelolaan-mitra/update/${selectedRecord.id || selectedRecord.ID}`
        : `${baseUrl}/api/kelolaan-mitra/create`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditMode ? "Data Kelolaan Mitra Berhasil Diperbarui!" : "Sakti! Data Kelolaan Mitra Berhasil Disimpan Permanen!");
        setIsModalOpen(false);
        setTanggalFilter(formInput.tanggalInput);
        setBulanFilter(formInput.tanggalInput.substring(0, 7));
        resetForm();
        fetchMitra();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !confirm("Apakah Anda yakin ingin menghapus data kelolaan mitra ini secara permanen?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/kelolaan-mitra/delete/${selectedRecord.id || selectedRecord.ID}`, {
        method: "DELETE"
      });
      if (response.ok) {
        alert("Data Kelolaan Mitra Berhasil Dihapus!");
        setIsModalOpen(false);
        resetForm();
        fetchMitra();
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
      tanggalInput: selectedRecord.tanggalInput ? selectedRecord.tanggalInput.substring(0, 10) : getTodayString(),
      namaMitra: selectedRecord.namaMitra || "",
      picNasabah: dapatkanNamaPanggilan(selectedRecord.picNasabah || loggedInUser),
      brandUtama: selectedRecord.brandUtama || "",
      kodeOwnerUtama: selectedRecord.kodeOwnerUtama || "",
      kategoriMitra: selectedRecord.kategoriMitra || "Referral",
      paketLangganan: selectedRecord.paketLangganan || "Bisnis 12 Bulan",
      statusLangganan: selectedRecord.statusLangganan || "Berlangganan",
      buktiFu: selectedRecord.buktiFu || "",
      statusInput: selectedRecord.statusInput || "Done",
      nominal_komisi: selectedRecord.nominal_komisi !== undefined ? selectedRecord.nominal_komisi : "",
      status_komisi: selectedRecord.status_komisi || "Pending"
    });
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const getStatusLanggananStyle = (status: string) => {
    switch (status) {
      case "Berlangganan": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Follow Up": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Top Up": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Payment": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr || !tglStr.includes("-")) return tglStr;
    const [year, month, day] = tglStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatBulanIndo = (blnStr: string) => {
    if (!blnStr || !blnStr.includes("-")) return blnStr;
    const [year, month] = blnStr.split("-");
    const namaBulan = new Date(Number(year), Number(month) - 1).toLocaleString("id-ID", { month: "long" });
    return `${namaBulan} ${year}`;
  };

  const formatRupiah = (val: any) => {
    return `Rp ${(Number(val) || 0).toLocaleString("id-ID")}`;
  };

  // 🔍 LOGIKA FILTER UTAMA HAK AKSES PER PIC SALES & ADMIN MULTI-USER
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.picNasabah || "");
    
    const matchesSearch = 
      item.namaMitra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandUtama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUserAdmin = userRole.toLowerCase() === "admin";
    
    // 🔒 PROSES FILTER AKSES KETAT PER ROLE PIC
    let matchesRoleAkses: boolean;
    if (isUserAdmin) {
      matchesRoleAkses = picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase();
    } else {
      const kunciPicDb = itemPicPanggilan.toLowerCase().substring(0, 4);
      const kunciPicLogin = loggedInUser.toLowerCase().substring(0, 4);
      matchesRoleAkses = kunciPicDb === kunciPicLogin || itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();
    }

    const itemDateStr = item.tanggalInput ? item.tanggalInput.substring(0, 10) : "";
    let matchesTanggal = false;

    if (modeFilter === "harian") {
      matchesTanggal = itemDateStr === tanggalFilter || itemDateStr.includes(tanggalFilter);
    } else {
      matchesTanggal = item.tanggalInput ? item.tanggalInput.substring(0, 7) === bulanFilter : false; 
    }

    return matchesSearch && matchesTanggal && matchesRoleAkses;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#F5F5F7] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">Data Kelolaan Mitra</h1>
          <p className="text-xs text-[#86868B] mt-0.5 font-medium">Monitoring integrasi referral nasabah PT PIPOSMART DIGITAL INDONESIA.</p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {isSessionReady ? loggedInUser : "Loading..."} ({userRole})</span>
            {isSessionReady && userRole.toLowerCase() === "admin" && (
              <span className="ml-2 text-[10px] bg-blue-50 text-[#007AFF] border border-blue-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/kelolaan-mitra/export"}
            className="px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm cursor-pointer"
          >
            📥 Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#0062CC] transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Record Kelolaan Baru
          </button>
        </div>
      </div>

      {/* FILTER SEARCH PANEL (TABS STATUS FILTER ALL DAN SISANYA SUDAH DIHAPUS RESMI) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E8ED] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau Nama PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* 👤 DROPDOWN FILTER PIC SALES UNTUK ADMIN */}
          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#007AFF] uppercase whitespace-nowrap">👤 PIC Sales:</span>
              <select
                value={picFilterAdmin} onChange={(e) => setPicFilterAdmin(e.target.value)}
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
          <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap px-1">
            {modeFilter === "harian" ? "Rekapan Tanggal:" : "Rekapan Bulan:"}
          </span>
          <input 
            type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? tanggalFilter : bulanFilter}
            onChange={(e) => modeFilter === "harian" ? setTanggalFilter(e.target.value) : setBulanFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase"
          />
        </div>
      </div>

      {/* CARDS GRID CONTAINER */}
      {loading || !isSessionReady ? (
        <div className="text-center py-24 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke enkripsi crm...</div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center py-28 px-4 text-center min-h-[350px]">
          <span className="text-4xl mb-4 select-none">📬</span>
          <p className="text-[#8E8E93] font-bold text-sm tracking-tight max-w-md leading-relaxed">
            Belum ada record follow up untuk {modeFilter === "harian" ? `tanggal ${tanggalFilter}` : `bulan ${bulanFilter}`}
            {userRole.toLowerCase() === "admin" && picFilterAdmin !== "Semua" ? ` untuk PIC ${picFilterAdmin}` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item: any, index: number) => (
            <div 
              key={index} onClick={() => handleOpenRowDetail(item)}
              className="bg-white rounded-2xl border border-[#E8E8ED] hover:border-[#AEAEB2] p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-[#007AFF]" />
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md font-bold uppercase">No. {index + 1}</span>
                    <h3 className="text-base font-black text-gray-900 tracking-tight mt-2 truncate">{item.brandUtama || "Tanpa Brand"}</h3>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider shrink-0 ${getStatusLanggananStyle(item.statusLangganan)}`}>
                    {item.statusLangganan}
                  </span>
                </div>
                <div className="mt-4 bg-[#F5F5F7] border border-gray-100 p-3 rounded-2xl space-y-1.5 text-xs font-semibold text-gray-500">
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="truncate">Mitra Utama: <span className="text-gray-800 font-bold">{item.namaMitra}</span></span>
                    <span>ID: <span className="text-gray-700 font-mono">[{item.kodeOwnerUtama || "-"}]</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">PIC:</span>
                    <span className="text-[10px] font-extrabold text-[#007AFF] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                      👤 {dapatkanNamaPanggilan(item.picNasabah)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50/30 border border-amber-200/50 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-amber-800 block uppercase font-bold tracking-wider">Insentif Komisi</span>
                  <span className="text-sm font-black text-amber-900 mt-0.5 block">{formatRupiah(item.nominal_komisi)}</span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${item.status_komisi === "Selesai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                  {item.status_komisi === "Selesai" ? "💰 Cair" : "⏳ Pending"}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">Paket Langganan</span>
                  <span className="text-gray-700 font-black mt-0.5">{item.paketLangganan}</span>
                </div>
                <span className="text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">{item.kategoriMitra || "Referral"}</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-bold">
                🗓️ Log Date: {formatTanggalIndo(item.tanggalInput?.substring(0, 10))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-gray-800">{selectedRecord && !isEditMode ? "📋 Rincian Kelolaan Kemitraan" : isEditMode ? "✏️ Edit Hubungan Kemitraan" : "➕ Record Kelolaan Kemitraan Baru"}</h2>
                <p className="text-[11px] text-gray-400 font-medium">Manajemen data kemitraan operasional terpadu.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-[#515154]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Tanggal Input</label>
                  <input 
                    type="date" name="tanggalInput" value={selectedRecord && !isEditMode ? selectedRecord.tanggalInput?.substring(0, 10) : formInput.tanggalInput} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-white disabled:bg-gray-100/70 focus:outline-none uppercase cursor-pointer" required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">CRM PIC Nasabah</label>
                  <input type="text" name="picNasabah" value={formInput.picNasabah} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="bg-gray-50/50 border p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Blok Parameter Kelolaan Mitra Utama</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Nama Mitra Utama</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={selectedRecord.namaMitra} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-gray-100/70 text-gray-800" />
                    ) : (
                      <select name="namaMitra" value={formInput.namaMitra} onChange={handleMitraSelect} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-white text-gray-800 focus:outline-none cursor-pointer" required>
                        <option value="">-- Pilih Mitra --</option>
                        {listMitraMaster.map((m: any, idx) => (
                          <option key={idx} value={m.owner || m.ownerMitra}>{m.owner || m.ownerMitra}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Nama Brand / Badan Usaha</label>
                    <input type="text" name="brandUtama" placeholder="Otomatis mengikuti mitra" value={selectedRecord && !isEditMode ? selectedRecord.brandUtama : formInput.brandUtama} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-gray-100/70 text-gray-800 focus:outline-none" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Kode Owner Mitra</label>
                    <input type="text" name="kodeOwnerUtama" placeholder="Otomatis mengikuti mitra" value={selectedRecord && !isEditMode ? selectedRecord.kodeOwnerUtama : formInput.kodeOwnerUtama} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-gray-100/70 text-gray-800 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Kategori Kemitraan</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.kategoriMitra} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-gray-100/70 text-gray-500" />
                  ) : (
                    <select name="kategoriMitra" value={formInput.kategoriMitra} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-white text-gray-800 focus:outline-none">
                      <option value="Referral">Referral</option>
                      <option value="Corporate Paket Bisnis">Corporate Paket Bisnis</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Paket Langganan</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.paketLangganan} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-gray-100/70 text-gray-500" />
                  ) : (
                    <select name="paketLangganan" value={formInput.paketLangganan} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-white text-gray-800 focus:outline-none">
                      <option value="Bisnis 12 Bulan">Bisnis 12 Bulan</option>
                      <option value="Bisnis 6 Bulan">Bisnis 6 Bulan</option>
                      <option value="Bisnis 1 Bulan">Bisnis 1 Bulan</option>
                      <option value="Basic 1 Bulan">Basic 1 Bulan</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Status Langganan</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.statusLangganan} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-gray-100/70 text-gray-500" />
                  ) : (
                    <select name="statusLangganan" value={formInput.statusLangganan} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold bg-white text-gray-800 focus:outline-none">
                      <option value="Berlangganan">Berlangganan</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Top Up">Top Up</option>
                      <option value="Payment">Payment</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="p-4 border border-dashed border-amber-200 bg-amber-50/20 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Alokasi Fee Insentif Komisi Referral</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-amber-900">Nominal Komisi (Rp)</label>
                    <input type="number" name="nominal_komisi" placeholder="Contoh: 250000" value={selectedRecord && !isEditMode ? selectedRecord.nominal_komisi : formInput.nominal_komisi} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white disabled:bg-gray-100/70 focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-amber-900">Status Pencairan Komisi</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={selectedRecord.status_komisi === "Selesai" ? "💰 Cair" : "⏳ Pending"} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-gray-100/70 text-gray-500" />
                    ) : (
                      <select name="status_komisi" value={formInput.status_komisi} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-white text-gray-800 focus:outline-none">
                        <option value="Pending">⏳ Pending (Ditahan)</option>
                        <option value="Selesai">💰 Selesai (Sudah Cair)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer">✏️ Ubah / Edit</button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 text-xs transition cursor-pointer">🗑️ Hapus</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 text-sm cursor-pointer">Selesai</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold text-sm shadow-md cursor-pointer">Simpan Record</button>
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