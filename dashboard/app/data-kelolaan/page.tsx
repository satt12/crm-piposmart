"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function DataKelolaanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");

  // State User Session (Aman dari eror hydration SSR)
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // 🌟 STATE FILTER PIC KHUSUS ADMIN: "Semua" = tampilkan semua PIC
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  // Helper untuk membersihkan dan menstandarkan nama panggilan pendek (TOLERAN & SINKRON)
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    const kataPertama = namaLengkap.split(" ")[0];
    return kataPertama.charAt(0).toUpperCase() + kataPertama.slice(1);
  };

  // Ekstraksi field dinamis penampung data dari backend
  const cariNilai = (item: any, keywords: string[]): any => {
    if (!item) return undefined;
    const keys = Object.keys(item);
    for (const kw of keywords) {
      const found = keys.find((k) => k.toLowerCase() === kw.toLowerCase());
      if (found && item[found] !== undefined && item[found] !== null && item[found] !== "") return item[found];
    }
    for (const kw of keywords) {
      const found = keys.find((k) => k.toLowerCase().includes(kw.toLowerCase()));
      if (found && item[found] !== undefined && item[found] !== null && item[found] !== "") return item[found];
    }
    return undefined;
  };

  // Normalisasi data dari backend agar seragam di UI
  const normalisasiKelolaan = (item: any) => {
    return {
      id: item.id ?? item.ID,
      tanggalFu: cariNilai(item, ["tanggalInput", "tanggal_input", "tanggalFu", "tanggal_fu", "tanggal", "created_at"]) ?? "",
      bulan: cariNilai(item, ["bulan", "bulanTerdaftar", "bulan_terdaftar"]) ?? "",
      statusAkun: cariNilai(item, ["statusLangganan", "status_langganan", "kategoriMitra", "statusAkun"]) ?? "Follow Up",
      pic: cariNilai(item, ["picNasabah", "pic_nasabah", "pic", "namaPic"]) ?? "",
      namaOwner: cariNilai(item, ["ownerMitra", "owner_mitra", "owner", "namaOwner"]) ?? "",
      brand: cariNilai(item, ["namaBrand", "nama_brand", "brand", "brandUtama"]) ?? "",
      hpOwner: cariNilai(item, ["telp", "hpOwner", "hp_owner"]) ?? "",
      expiredDate: cariNilai(item, ["expiredDate", "expired_date"]) ?? "",
      score: cariNilai(item, ["score", "totalReferral"]) ?? "1",
      callStatus: cariNilai(item, ["callStatus", "statusInput", "status_input"]) ?? "DONE",
      chatStatus: cariNilai(item, ["chatStatus", "status_komisi"]) ?? "DELIVERED",
      sumber: cariNilai(item, ["kategoriMitraSub", "kategori_mitra_sub", "sumber"]) ?? "Mitra",
      noted: cariNilai(item, ["alamat", "buktiFu", "noted"]) ?? "",
    };
  };

  // Helper baca PIC dari item yang sudah dinormalisasi
  const bacaPicDariItem = (item: any): string => {
    const rawPic = item?.pic ?? "";
    if (!rawPic || String(rawPic).trim() === "") return "Satria"; 
    return dapatkanNamaPanggilan(String(rawPic));
  };

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().split("T")[0];
  };

  const getTargetMonthString = () => {
    return new Date().toISOString().substring(0, 7);
  };

  // 📅 State Filter Kalender Utama Harian & Bulanan
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterMonth, setFilterMonth] = useState(getTargetMonthString());

  const initialFormState = () => ({
    tanggalFu: getTodayString(),
    bulan: new Date().toLocaleString("id-ID", { month: "long" }),
    statusAkun: "Follow Up",
    pic: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    namaOwner: "",
    brand: "",
    hpOwner: "",
    expiredDate: "",
    score: "1",
    callStatus: "DONE",
    chatStatus: "DELIVERED",
    sumber: "Mitra",
    noted: "",
  });

  const [formInput, setFormInput] = useState(initialFormState);

  // AMAN SSR: Membaca data login session dari browser setelah mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPic = localStorage.getItem("user_pic");
      const savedRole = localStorage.getItem("user_role");

      let currentPic = "Satria";
      if (savedPic) {
        currentPic = dapatkanNamaPanggilan(savedPic);
        setLoggedInUser(currentPic);
      }

      // 🌟 FIX: Baca role asli hasil login (bukan ditebak dari nama), konsisten dengan halaman Penjualan.
      // Fallback ke "Sales" kalau data role belum tersimpan di localStorage.
      setUserRole(savedRole || "Sales");

      setFormInput(prev => ({ ...prev, pic: currentPic }));
      setIsSessionReady(true);
    }
  }, []);

  // SINKRONISASI MODAL
  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const currentPic = dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria");
        setFormInput(prev => ({
          ...prev,
          tanggalFu: getTodayString(),
          bulan: new Date().toLocaleString("id-ID", { month: "long" }),
          pic: currentPic
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  // 🌟 CONNECTOR FIX: Mengarahkan fetch data kelolaan ke rute API backend yang valid
  const fetchKelolaan = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/kelolaan`); // 🔌 FIX: modul yang benar adalah "Data Kelolaan", bukan "Kelolaan Mitra"
      if (response.ok) {
        const result = await response.json();
        const rawList = result || [];
        const normalized = rawList.map((item: any) => normalisasiKelolaan(item));
        setData(normalized);
      }
    } catch (error) {
      console.error("Gagal memuat koneksi data crm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelolaan();
  }, []);

  // 🌟 DAFTAR PIC UNIK DARI DATA YANG ADA (untuk isi pilihan dropdown filter Admin)
  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(bacaPicDariItem(item));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "tanggalFu" && value) {
        const tglObj = new Date(value);
        updated.bulan = tglObj.toLocaleString("id-ID", { month: "long" });
      }
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Payload disesuaikan PERSIS dengan field model Go DataKelolaan (tanggalFu, bulan, statusAkun, pic, namaOwner, brand, hpOwner, dst)
      const payloadFormat = {
        tanggalFu: formInput.tanggalFu,
        bulan: formInput.bulan,
        statusAkun: formInput.statusAkun,
        pic: dapatkanNamaPanggilan(formInput.pic),
        namaOwner: formInput.namaOwner,
        brand: formInput.brand,
        hpOwner: formInput.hpOwner,
        expiredDate: formInput.expiredDate,
        score: formInput.score,
        callStatus: formInput.callStatus,
        chatStatus: formInput.chatStatus,
        sumber: formInput.sumber,
        noted: formInput.noted
      };

      const url = isEditMode && selectedRecord 
        ? `${baseUrl}/api/kelolaan/update/${selectedRecord.id || selectedRecord.ID}` 
        : `${baseUrl}/api/kelolaan/create`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFormat),
      });

      if (response.ok) {
        alert(isEditMode ? "Data Kelolaan berhasil diperbarui!" : "Sakti! Data Kelolaan berhasil disimpan permanen!");
        setIsModalOpen(false);
        setFilterDate(formInput.tanggalFu);
        setFilterMonth(formInput.tanggalFu.substring(0, 7));
        resetForm();
        fetchKelolaan(); 
      }
    } catch (error) {
      console.error("Error saving kelolaan:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !confirm("Apakah Anda yakin ingin menghapus data ini secara permanen?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/kelolaan/delete/${selectedRecord.id || selectedRecord.ID}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Data Kelolaan berhasil dihapus!");
        setIsModalOpen(false);
        resetForm();
        fetchKelolaan();
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
      tanggalFu: selectedRecord.tanggalFu ? selectedRecord.tanggalFu.substring(0, 10) : getTodayString(),
      bulan: selectedRecord.bulan || "",
      statusAkun: selectedRecord.statusAkun || "Follow Up",
      pic: dapatkanNamaPanggilan(selectedRecord.pic || loggedInUser), 
      namaOwner: selectedRecord.namaOwner || "",
      brand: selectedRecord.brand || "",
      hpOwner: selectedRecord.hpOwner || "",
      expiredDate: selectedRecord.expiredDate ? selectedRecord.expiredDate.substring(0, 10) : "",
      score: selectedRecord.score || "1",
      callStatus: selectedRecord.callStatus || "DONE",
      chatStatus: selectedRecord.chatStatus || "DELIVERED",
      sumber: selectedRecord.sumber || "Mitra",
      noted: selectedRecord.noted || "",
    });
  };

  const handleExportExcel = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    window.location.href = `${baseUrl}/api/kelolaan/export`;
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  // 🔍 LOGIKA FILTER HARIAN DAN BULANAN
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = bacaPicDariItem(item);
    
    const matchesSearch = 
      item.namaOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());

    const isUserAdmin = userRole.toLowerCase() === "admin";

    // 🌟 KUNCI ROLE KETAT:
    // - Admin: bisa lihat semua PIC, atau pilih PIC tertentu lewat dropdown filter
    // - Sales: dipaksa hanya menampilkan data pribadi miliknya sendiri (tidak bisa lihat punya orang lain)
    let matchesRoleAkses: boolean;
    if (isUserAdmin) {
      matchesRoleAkses = picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase();
    } else {
      const kunciPicDb = itemPicPanggilan.toLowerCase().substring(0, 4);
      const kunciPicLogin = loggedInUser.toLowerCase().substring(0, 4);
      const isPicIdentik = kunciPicDb === kunciPicLogin || itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();
      matchesRoleAkses = isPicIdentik;
    }

    const rawTanggal = item.tanggalFu || "";
    const dataDateStr = rawTanggal ? String(rawTanggal).substring(0, 10) : "";
    
    let matchesTanggal = false;
    if (modeFilter === "harian") {
      matchesTanggal = dataDateStr === filterDate || dataDateStr.includes(filterDate);
    } else {
      const dataMonthStr = rawTanggal ? String(rawTanggal).substring(0, 7) : "";
      matchesTanggal = dataMonthStr === filterMonth || dataMonthStr.includes(filterMonth);
    }
    
    return matchesSearch && matchesRoleAkses && matchesTanggal;
  });

  const getStatusAkunBadge = (status: string) => {
    switch (status) {
      case "Berlangganan": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Follow Up": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Top Up": return "bg-blue-50 text-blue-700 border border-blue-200";
      default: return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative py-4 px-4 bg-[#F5F5F7] min-h-screen">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Data Kelolaan CRM</h1>
          <p className="text-xs text-[#86868B] mt-0.5 font-medium">Monitoring data log aktivitas hubungan kelolaan mitra operasional terintegrasi.</p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {isSessionReady ? loggedInUser : "Loading..."}</span>
            {isSessionReady && userRole.toLowerCase() === "admin" && (
              <span className="ml-2 text-[10px] bg-blue-50 text-[#007AFF] border border-blue-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportExcel} className="px-4 py-2.5 text-xs font-bold text-[#1D1D1F] bg-white border border-[#E5E5EA] rounded-xl hover:bg-gray-50 shadow-sm cursor-pointer">
            📤 Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#007AFF] rounded-xl hover:bg-blue-600 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> Tambah Record Kelolaan
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E8ED] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau Nama PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* 🌟 FILTER PIC — HANYA TAMPIL UNTUK ADMIN */}
          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#007AFF] uppercase whitespace-nowrap">
                👤 PIC Sales:
              </span>
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
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-[#E5E5EA]">
            <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap px-1">
              {modeFilter === "harian" ? "Rekapan Tanggal:" : "Rekapan Bulan:"}
            </span>
            <input 
              type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? filterDate : filterMonth}
              onChange={(e) => modeFilter === "harian" ? setFilterDate(e.target.value) : setFilterMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase"
            />
          </div>
        </div>
      </div>

      {/* DISPLAY CARD GRID */}
      {loading || !isSessionReady ? (
        <div className="text-center py-20 text-sm text-gray-400 font-bold animate-pulse">Mengekstrak pusat data crm...</div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 px-4">
          <span className="text-3xl block mb-2">📭</span>
          <div className="text-sm text-gray-400 font-bold">
            Belum ada record follow up untuk {modeFilter === "harian" ? `tanggal ${filterDate}` : `bulan ${filterMonth}`}
            {userRole.toLowerCase() === "admin" && picFilterAdmin !== "Semua" ? ` untuk PIC ${picFilterAdmin}` : ""}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((item: any, index: number) => (
            <div 
              key={item.id || index} onClick={() => handleOpenRowDetail(item)} 
              className="bg-white rounded-2xl border border-[#E8E8ED] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">{item.bulan || "Periode Buku"}</span>
                    <h3 className="text-base font-black text-[#1D1D1F] truncate mt-0.5">{item.brand || "Tanpa Nama Brand"}</h3>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 ${getStatusAkunBadge(item.statusAkun)}`}>
                    {item.statusAkun}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">PIC:</span>
                  <span className="text-[10px] font-extrabold text-[#007AFF] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                    👤 {bacaPicDariItem(item)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-1 pt-2 border-t border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                  <div>
                    <span className="block text-[9px] text-gray-400">NAMA OWNER</span>
                    <span className="text-sm font-bold text-[#1D1D1F] tracking-tight block mt-0.5 truncate capitalize">{item.namaOwner || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400">NO. HP MITRA</span>
                    <span className="text-sm font-bold text-[#1D1D1F] tracking-tight block mt-0.5 truncate">{item.hpOwner || "-"}</span>
                  </div>
                </div>

                {item.noted && (
                  <div className="pt-2">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase">REMAKS / CATATAN:</span>
                    <p className="text-xs font-medium text-gray-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 italic line-clamp-2">
                      "{item.noted}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Tanggal FU:</span>
                  <span className="text-[11px] font-bold text-[#1D1D1F] mt-0.5">
                    {item.tanggalFu ? String(item.tanggalFu).substring(0, 10) : "-"}
                  </span>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                  {item.sumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-md font-bold text-[#1D1D1F]">
                {selectedRecord && !isEditMode ? "📋 Rincian Data Kelolaan CRM" : isEditMode ? "✏️ Ubah Data Kelolaan CRM" : "➕ Tambah Record Kelolaan Baru"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#86868B] text-lg hover:text-black cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-[#515154]">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>TANGGAL FU</label>
                  <input 
                    type="date" name="tanggalFu" 
                    value={selectedRecord && !isEditMode ? selectedRecord.tanggalFu?.substring(0, 10) : formInput.tanggalFu} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white disabled:bg-[#F5F5F7] uppercase focus:outline-none cursor-pointer" required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>BULAN BERJALAN</label>
                  <input 
                    type="text" name="bulan" placeholder="Juni" 
                    value={selectedRecord && !isEditMode ? selectedRecord.bulan : formInput.bulan} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white disabled:bg-[#F5F5F7] focus:outline-none" required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>STATUS AKUN</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.statusAkun} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="statusAkun" value={formInput.statusAkun} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white focus:outline-none">
                      <option value="Berlangganan">Berlangganan</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Top Up">Top Up</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>NAMA OWNER</label>
                  <input type="text" name="namaOwner" placeholder="Nama owner" value={selectedRecord && !isEditMode ? selectedRecord.namaOwner : formInput.namaOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>NO. HP OWNER</label>
                  <input type="text" name="hpOwner" placeholder="0878..." value={selectedRecord && !isEditMode ? selectedRecord.hpOwner : formInput.hpOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>PIC</label>
                  <input 
                    type="text" 
                    name="pic" 
                    value={formInput.pic} 
                    disabled 
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>PROJECT / BRAND (OUTLET)</label>
                  <input type="text" name="brand" placeholder="Nama Brand Usaha" value={selectedRecord && !isEditMode ? selectedRecord.brand : formInput.brand} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>SUMBER NASABAH</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.sumber} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="sumber" value={formInput.sumber} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white focus:outline-none">
                      <option value="Mitra Referral">Mitra Referral</option>
                      <option value="Mitra Corporated">Mitra Corporated</option>
                      <option value="Vendor Utama">Vendor Utama</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>CATATAN TAMBAHAN (REMAKS / NOTED)</label>
                <textarea name="noted" rows={3} placeholder="Tulis rincian hasil follow up di sini..." value={selectedRecord && !isEditMode ? selectedRecord.noted : formInput.noted} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] resize-none focus:outline-none font-sans" />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer">✏️ Ubah / Edit</button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 text-xs transition cursor-pointer">🗑️ Hapus Record</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold text-sm shadow-md cursor-pointer">{isEditMode ? "Simpan Perubahan" : "Simpan Record"}</button>
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