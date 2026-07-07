"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function ListMitraPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [picFilter, setPicFilter] = useState("All");

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
    kategori: "REFERAL (Berlangganan)",
    kategoriSub: "Mitra Referral",
    picNasabah: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    bulanTerdaftar: getNamaBulanLokal(getTodayString()),
    tahun: new Date().getFullYear(),
    kodeOwner: "",
    owner: "",
    brand: "",
    telp: "",
    rekening: "",
    parent_id: "",
    wilayah: "",
    alamat: "",
    totalAkuisisiReferal: 0,
    totalReferral: 0,
  });

  const [formInput, setFormInput] = useState(initialFormState);

  // 🌟 AMAN SSR: Sinkronisasi session login user setelah lifecycle client-side aktif
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
      
      setFormInput(prev => ({ ...prev, picNasabah: panggilan }));
      setIsSessionReady(true);
    }
  }, []);

  // 🌟 RE-LOCK FORM MODAL
  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const savedPic = localStorage.getItem("user_pic") || "Satria";
        setFormInput(prev => ({ 
          ...prev, 
          tanggalInput: getTodayString(),
          bulanTerdaftar: getNamaBulanLokal(getTodayString()),
          tahun: new Date().getFullYear(),
          picNasabah: dapatkanNamaPanggilan(savedPic) 
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  const fetchListMitra = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/list-mitra`);
      if (response.ok) {
        const result = await response.json();
        setData(result || []);
      }
    } catch (error) {
      console.error("Gagal memuat data master list mitra:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListMitra();
  }, []);

  // 📊 MENGUMPULKAN DAFTAR PIC UNIK SECARA LIVE DARI DATABASE MITRA UNTUK DROPDOWN ADMIN
  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.picNasabah || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "tanggalInput" && value !== "") {
        const [year] = value.split("-");
        updated.bulanTerdaftar = getNamaBulanLokal(value);
        updated.tahun = Number(year);
      }
      if (name === "totalReferral" || name === "totalAkuisisiReferal" || name === "tahun") {
        updated[name] = value === "" ? 0 : Number(value);
      }
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formInput,
      picNasabah: dapatkanNamaPanggilan(formInput.picNasabah)
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = isEditMode && selectedRecord
        ? `${baseUrl}/api/list-mitra/update/${selectedRecord.id || selectedRecord.ID}`
        : `${baseUrl}/api/list-mitra/create`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditMode ? "Data Master List Mitra berhasil diperbarui!" : "Sakti! Data Master List Mitra berhasil disimpan permanen!");
        setIsModalOpen(false);
        setTanggalFilter(formInput.tanggalInput); 
        setBulanFilter(formInput.tanggalInput.substring(0, 7));
        resetForm();
        fetchListMitra();
      } else {
        const result = await response.json();
        alert(`Gagal Menyimpan: ${result.message || "Validasi backend menolak data input"}`);
      }
    } catch (error) {
      console.error("Error saving list mitra:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !window.confirm("Apakah Anda yakin ingin menghapus data master mitra ini secara permanen?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const recordId = selectedRecord.id || selectedRecord.ID;
      const response = await fetch(`${baseUrl}/api/list-mitra/delete/${recordId}`, { method: "DELETE" });

      if (response.ok) {
        alert("Data Master List Mitra berhasil dihapus!");
        setIsModalOpen(false);
        resetForm();
        fetchListMitra();
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleOpenRowDetail = (item: any) => {
    setSelectedRecord(item);
    setIsEditMode(false); 
    setFormInput({
      tanggalInput: item.createdAt ? item.createdAt.substring(0, 10) : getTodayString(),
      kategori: item.kategoriMitra || "REFERAL (Berlangganan)",
      kategoriSub: item.kategoriMitraSub || "Mitra Referral",
      picNasabah: dapatkanNamaPanggilan(item.picNasabah || loggedInUser),
      bulanTerdaftar: item.bulanTerdaftar || getNamaBulanLokal(getTodayString()),
      tahun: item.tahun || new Date().getFullYear(),
      kodeOwner: item.kodeOwner || "",
      owner: item.owner || item.ownerMitra || "",
      brand: item.brand || item.namaBrand || "",
      telp: item.telp || "",
      rekening: item.rekening || "",
      wilayah: item.wilayah || "",
      alamat: item.alamat || "",
      totalAkuisisiReferal: item.totalAkuisisiReferal ?? 0,
      totalReferral: item.totalReferral ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleActivateEditMode = () => {
    if (!selectedRecord) return;
    setIsEditMode(true);
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const getKategoriStyle = (kat: string) => {
    if (!kat) return "bg-gray-50 text-gray-600 border-gray-200";
    if (kat.includes("REFERAL")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (kat.includes("AFILIASI")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getSubKategoriStyle = (sub: string) => {
    if (!sub) return "bg-gray-100 text-gray-600 border-gray-200";
    switch (sub) {
      case "Mitra Corporated": return "bg-rose-50 text-rose-600 border-rose-200";
      case "Mitra Referral": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Mitra Partnership": return "bg-sky-50 text-sky-700 border-sky-200";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
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
    return `${listBulan[Number(month) - 1]} ${year}`;
  };

  // 🔍 LOGIKA FILTER UTAMA HAK AKSES PER PIC SALES & ADMIN MULTI-USER
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.picNasabah || "");
    
    const matchesSearch = 
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaBrand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ownerMitra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUserAdmin = userRole.toLowerCase() === "admin";
    
    let matchesRoleAkses: boolean;
    if (isUserAdmin) {
      matchesRoleAkses = picFilter === "All" || itemPicPanggilan.toLowerCase() === picFilter.toLowerCase();
    } else {
      const kunciPicDb = itemPicPanggilan.toLowerCase().substring(0, 4);
      const kunciPicLogin = loggedInUser.toLowerCase().substring(0, 4);
      matchesRoleAkses = kunciPicDb === kunciPicLogin || itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();
    }
    
    const itemDateStr = item.createdAt ? item.createdAt.substring(0, 10) : "";
    
    if (modeFilter === "harian") {
      return matchesSearch && matchesRoleAkses && (itemDateStr === tanggalFilter || itemDateStr.includes(tanggalFilter));
    } else {
      return matchesSearch && matchesRoleAkses && item.createdAt?.substring(0, 7) === bulanFilter;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#F5F5F7] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Direktori Master Mitra</h1>
          <p className="text-xs text-[#86868B] mt-0.5 font-medium">Manajemen ekosistem kemitraan korporasi & pelacakan referral harian.</p>
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
            onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/list-mitra/export"}
            className="px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm transition-all cursor-pointer"
          >
            📥 Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-bold text-xs shadow-md hover:bg-blue-600 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Registrasi Mitra Baru
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E8ED] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* 👤 🌟 SINKRONISASI KIRI: Filter Dropdown PIC diletakkan di sebelah kiri mengikuti tata letak modul Kelolaan */}
          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#007AFF] uppercase whitespace-nowrap">👤 PIC Sales:</span>
              <select
                value={picFilter} onChange={(e) => setPicFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">Semua PIC</option>
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
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-[#E5E5EA]">
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
      </div>

      {/* CARDS DECK LAYOUT */}
      {loading || !isSessionReady ? (
        <div className="text-center py-24 font-bold text-sm text-gray-400 animate-pulse">Sinkronisasi direktori crm...</div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center py-28 px-4 text-center min-h-[350px]">
          <span className="text-4xl mb-4 select-none">📬</span>
          <p className="text-[#8E8E93] font-bold text-sm tracking-tight max-w-md leading-relaxed">
            Belum ada partner master mitra terdaftar untuk filter {modeFilter === "harian" ? `tanggal ${tanggalFilter}` : `bulan ${bulanFilter}`}
            {userRole.toLowerCase() === "admin" && picFilter !== "All" ? ` untuk PIC ${picFilter}` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item: any, idx: number) => (
            <div 
              key={idx} onClick={() => handleOpenRowDetail(item)} 
              className="bg-white rounded-2xl border border-[#E8E8ED] hover:border-[#AEAEB2] shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute left-0 inset-y-0 w-1.5 bg-[#007AFF] opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-gray-100">
                  <div className="flex gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${getKategoriStyle(item.kategoriMitra)}`}>
                      {item.kategoriMitra ? item.kategoriMitra.split(" (")[0] : "-"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getSubKategoriStyle(item.kategoriMitraSub)}`}>
                      {item.kategoriMitraSub || "Mitra Referral"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">ID: {item.kodeOwner || "-"}</span>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-[#007AFF] transition-all duration-200">
                    {item.brand || item.namaBrand || "Tanpa Brand"}
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    Owner: <span className="text-gray-700 font-bold">{item.owner || item.ownerMitra || "-"}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-5 bg-[#F5F5F7] border border-gray-100 p-3.5 rounded-2xl text-xs font-semibold">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">PIC</span>
                    <span className="text-gray-800 font-bold block mt-0.5">👤 {dapatkanNamaPanggilan(item.picNasabah)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Bulan Buku</span>
                    <span className="text-gray-700 block mt-0.5">📅 {item.bulanTerdaftar} {item.tahun}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">No. Telepon</span>
                    <span className="text-blue-500 block mt-0.5 font-mono">💬 {item.telp || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Wilayah</span>
                    <span className="text-gray-700 block mt-0.5 truncate">📍 {item.wilayah || "-"}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs font-medium text-gray-500">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                    <span>💳 Rekening:</span>
                    <span className="font-mono text-gray-800 font-bold uppercase">{item.rekening || "-"}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                    🏠 <span className="font-semibold">{item.alamat || "Alamat operasional fisik belum dilengkapi."}</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 -mx-5 -mb-5 p-4 rounded-b-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block leading-none">Akuisisi</span>
                    <span className="text-sm font-black text-gray-800 mt-0.5 block">{item.totalAkuisisiReferal || 0} Akun</span>
                  </div>
                </div>
                <div className="text-right bg-blue-50/60 border border-blue-100/50 px-3 py-1 rounded-xl">
                  <span className="text-[9px] font-bold text-[#007AFF] uppercase block leading-none">Total Referral</span>
                  <span className="text-sm font-black text-[#007AFF] mt-0.5 block">{item.totalReferral || 0} User</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POP-UP MODAL DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#1D1D1F]">
                  {selectedRecord && !isEditMode ? "📋 Rincian Data Master Database Mitra" : isEditMode ? "✏️ Perbarui Data Master Mitra" : "➕ Registrasi Record Master Mitra Baru"}
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">Sistem otomatis mengunci parameter data PIC berdasarkan akun login aktif.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#86868B] text-lg hover:bg-gray-100 p-1.5 rounded-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-[#515154]">
              <div className="flex flex-col gap-1.5 bg-gray-50 p-4 rounded-2xl border">
                <label className="text-gray-700">Pilih Tanggal Operasional Laporan (History Tracker)</label>
                <input type="date" name="tanggalInput" value={formInput.tanggalInput} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-3 rounded-xl text-sm font-semibold bg-white text-[#1D1D1F] disabled:bg-gray-100 uppercase cursor-pointer focus:outline-none" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50/50 p-4 rounded-2xl border">
                <div className="flex flex-col gap-1.5">
                  <label>Kategori Utama</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={formInput.kategori} disabled className="border p-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 focus:outline-none" />
                  ) : (
                    <select name="kategori" value={formInput.kategori} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-semibold bg-white text-[#1D1D1F] focus:outline-none">
                      <option value="REFERAL (Berlangganan)">REFERAL (Berlangganan)</option>
                      <option value="AFILIASI (Eks. Mesin, Rak, Dll)">AFILIASI (Eks. Mesin, Rak, Dll)</option>
                      <option value="FRANCHISE (Jual Brand)">FRANCHISE (Jual Brand)</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Sub Kategori Kemitraan</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={formInput.kategoriSub} disabled className="border p-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 focus:outline-none" />
                  ) : (
                    <select name="kategoriSub" value={formInput.kategoriSub} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-semibold bg-white text-[#1D1D1F] focus:outline-none">
                      <option value="Mitra Referral">Mitra Referral</option>
                      <option value="Mitra Corporated">Mitra Corporated</option>
                      <option value="Vendor Utama">Vendor Utama</option>
                      <option value="Personal Affiliate">Personal Affiliate</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>PIC</label>
                  <input 
                    type="text" name="picNasabah" value={formInput.picNasabah} disabled 
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50/10 p-3 rounded-xl border border-dashed text-center">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Bulan Terdaftar (Auto)</span>
                  <span className="text-xs font-black text-blue-600">{formInput.bulanTerdaftar}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Tahun Buku (Auto)</span>
                  <span className="text-xs font-black text-blue-600">{formInput.tahun}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label>Kode Owner</label>
                  <input type="text" name="kodeOwner" placeholder="Contoh: 18789" value={formInput.kodeOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Nama Owner / Usaha</label>
                  <input type="text" name="owner" placeholder="Nama owner" value={formInput.owner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
                <div className="grid grid-cols-1 flex flex-col gap-1.5">
                  <label>Brand / Nama Toko</label>
                  <input type="text" name="brand" placeholder="Nama brand laundry" value={formInput.brand} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label>No. Telepon Aktif</label>
                  <input type="text" name="telp" placeholder="0812345..." value={formInput.telp} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Informasi Bank / Rekening</label>
                  <input type="text" name="rekening" placeholder="BCA - 6880345..." value={formInput.rekening} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Wilayah Kerja</label>
                  <input type="text" name="wilayah" placeholder="Kota Batam" value={formInput.wilayah} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium focus:outline-none disabled:bg-gray-100" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-emerald-900">Total Akuisisi Referal</label>
                  <input type="number" name="totalAkuisisiReferal" value={formInput.totalAkuisisiReferal === 0 && !isEditMode ? "" : formInput.totalAkuisisiReferal} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} placeholder="0" className="border p-2.5 rounded-xl text-sm font-medium bg-white text-emerald-700 focus:outline-none disabled:bg-gray-100" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-emerald-900">Total Referral</label>
                  <input type="number" name="totalReferral" value={formInput.totalReferral === 0 && !isEditMode ? "" : formInput.totalReferral} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} placeholder="0" className="border p-2.5 rounded-xl text-sm font-medium bg-white text-emerald-700 focus:outline-none disabled:bg-gray-100" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label>Alamat Lengkap Operasional</label>
                <textarea name="alamat" rows={3} placeholder="Tulis alamat fisik lengkap..." value={formInput.alamat} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] resize-none focus:outline-none disabled:bg-gray-100 font-sans" required />
              </div>

              {/* CONTROLS FOOTER */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-2">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs transition cursor-pointer">✏️ Ubah / Edit</button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer">🗑️ Hapus Master</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold text-sm shadow-md cursor-pointer">{isEditMode ? "Simpan Perubahan" : "Simpan Master Mitra"}</button>
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