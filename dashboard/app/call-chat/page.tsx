"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable";

export default function CallChatPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // STATE USER SESSION (Aman dari Eror Hydration SSR)
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // STATE FILTER PIC KHUSUS ADMIN
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  // Helper penyaringan nama panggilan pendek
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

  const getTargetMonthString = () => {
    return new Date().toISOString().substring(0, 7);
  };

  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterMonth, setFilterMonth] = useState(getTargetMonthString());

  const initialFormState = () => ({
    tanggalFu: getTodayString(),
    bulan: new Date().toLocaleString("id-ID", { month: "long" }),
    tanggalDibagikan: getTodayString(),
    statusAcnt: "Akun Baru",
    pic: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    kodeBaris: "",
    kodeOwner: "",
    namaOwner: "",
    brand: "",
    outlet: "",
    hpOwner: "",
  });

  const [formInput, setFormInput] = useState(initialFormState);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPic = localStorage.getItem("user_pic");
      const savedRole = localStorage.getItem("user_role") || localStorage.getItem("userRole");
      let currentPic = "Satria";
      
      if (savedPic) {
        currentPic = dapatkanNamaPanggilan(savedPic);
        setLoggedInUser(currentPic);
      }

      if (savedRole) {
        setUserRole(savedRole);
      } else {
        const namaBersih = currentPic.toLowerCase();
        setUserRole(namaBersih === "satria" || namaBersih === "boby" ? "Admin" : "Sales");
      }

      setFormInput(prev => ({ ...prev, pic: currentPic }));
      setIsSessionReady(true);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const currentPic = dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria");
        setFormInput((prev) => ({ 
          ...prev, 
          tanggalFu: getTodayString(),
          tanggalDibagikan: getTodayString(),
          bulan: new Date().toLocaleString("id-ID", { month: "long" }),
          pic: currentPic 
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  const fetchCallChat = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/callchat`);
      if (response.ok) {
        const result = await response.json();
        setData(result || []);
      }
    } catch (error) {
      console.error("Gagal memuat data monitoring call & chat:", error);
      setData([]); 
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchCallChat();
  }, []);

  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.pic || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      tanggalFu: formInput.tanggalFu || getTodayString(),
      bulan: formInput.bulan || "-",
      tanggalDibagikan: formInput.tanggalDibagikan || getTodayString(),
      statusAkun: formInput.statusAcnt, 
      pic: dapatkanNamaPanggilan(formInput.pic), 
      kodeBaris: formInput.kodeBaris ? String(formInput.kodeBaris) : "0",
      kodeOwner: formInput.kodeOwner ? String(formInput.kodeOwner) : "-",
      namaOwner: formInput.namaOwner || "-",
      brand: formInput.brand || "-",
      outlet: formInput.outlet || "-",
      hpOwner: formInput.hpOwner || "-",
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = isEditMode && selectedRecord 
        ? `${baseUrl}/api/callchat/update/${selectedRecord.id || selectedRecord.ID}` 
        : `${baseUrl}/api/callchat/create`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditMode ? "Log Call & Chat berhasil diperbarui!" : "Log Call & Chat berhasil disimpan!");
        setIsModalOpen(false);
        setFilterDate(formInput.tanggalFu);
        setFilterMonth(formInput.tanggalFu.substring(0, 7)); 
        resetForm();
        fetchCallChat(); 
      } else {
        const result = await response.json().catch(() => ({}));
        alert(`Gagal Menyimpan: ${result.message || result.error || "Validasi backend menolak data kosong."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan atau koneksi server terputus.");
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus data log ini secara permanen?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/callchat/delete/${selectedRecord.id || selectedRecord.ID}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Log Call & Chat berhasil dihapus!");
        setIsModalOpen(false);
        resetForm();
        fetchCallChat();
      }
    } catch (error) {
      console.error(error);
    }
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
      tanggalDibagikan: selectedRecord.tanggalDibagikan ? selectedRecord.tanggalDibagikan.substring(0, 10) : getTodayString(),
      statusAcnt: selectedRecord.statusAkun || "Akun Baru",
      pic: dapatkanNamaPanggilan(selectedRecord.pic || loggedInUser), 
      kodeBaris: selectedRecord.kodeBaris || "",
      kodeOwner: selectedRecord.kodeOwner || "",
      namaOwner: selectedRecord.namaOwner || "",
      brand: selectedRecord.brand || "",
      outlet: selectedRecord.outlet || "",
      hpOwner: selectedRecord.hpOwner || "",
    });
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data log follow-up terfilter yang tersedia untuk diekspor pada periode ini.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map((item: any) => ({
        "Tanggal FU": formatTanggalIndo(item.tanggalFu?.substring(0, 10)),
        "Bulan Berjalan": item.bulan || "-",
        "Tanggal Dibagikan": formatTanggalIndo(item.tanggalDibagikan?.substring(0, 10)),
        "Pic Team Hunter": dapatkanNamaPanggilan(item.pic),
        "Project / Brand": item.brand || "-",
        "Cabang Outlet": item.outlet || "-",
        "Nama Owner": item.namaOwner || "-",
        "No Handphone Owner": item.hpOwner || "-",
        "Kode Owner": item.kodeOwner || "-",
        "Kode Baris": item.kodeBaris || "-",
        "Status Akun": item.statusAkun
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      ws["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 16 }
      ];

      const namaTab = modeFilter === "harian" ? `FollowUp Hari ${filterDate}` : `FollowUp Bulan ${filterMonth}`;
      XLSX.utils.book_append_sheet(wb, ws, namaTab.substring(0, 31));

      const namaFile = modeFilter === "harian"
        ? `Log_FollowUp_Piposmart_Harian_${filterDate}.xlsx`
        : `Log_FollowUp_Piposmart_Bulanan_${filterMonth}.xlsx`;

      XLSX.writeFile(wb, namaFile);

    } catch (error) {
      console.error("Gagal memproses berkas excel:", error);
      alert("Terjadi kegagalan teknis saat memproses ekspor Excel.");
    }
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr || !tglStr.includes("-")) return tglStr;
    const [year, month, day] = tglStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const filteredData = data.filter((item: any) => {
    const itemDateStr = item.tanggalFu ? item.tanggalFu.substring(0, 10) : "";
    let matchesTanggal = false;

    if (modeFilter === "harian") {
      matchesTanggal = itemDateStr === filterDate || itemDateStr.includes(filterDate);
    } else {
      const itemMonthStr = item.tanggalFu ? item.tanggalFu.substring(0, 7) : "";
      matchesTanggal = itemMonthStr === filterMonth || itemMonthStr.includes(filterMonth);
    }

    const itemPicPanggilan = dapatkanNamaPanggilan(item.pic || "");
    const matchesSearch = 
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.outlet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === "All" || item.statusAkun === filterStatus;

    const isUserAdmin = userRole.toLowerCase() === "admin";
    let matchesRoleAkses: boolean;
    if (isUserAdmin) {
      matchesRoleAkses = picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase();
    } else {
      const kunciPicDb = itemPicPanggilan.toLowerCase().substring(0, 4);
      const kunciPicLogin = loggedInUser.toLowerCase().substring(0, 4);
      const isPicIdentik = kunciPicDb === kunciPicLogin || itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();
      matchesRoleAkses = isPicIdentik;
    }
    
    return matchesTanggal && matchesSearch && matchesStatus && matchesRoleAkses;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Call & Chat Follow-Up</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manajemen riwayat monitoring aktivitas follow-up call & chat whatsapp internal PT PIPOSMART DIGITAL INDONESIA.
          </p>
          <div className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Logged in: <span className="text-[#C92C1E] font-black">{isSessionReady ? loggedInUser : "Loading..."}</span>
            </div>

            {/* DUAL BADGE SYSTEM — KEDUANYA WARNA MERAH KHAS REPORT SESUAI INTEGRASI */}
            {userRole.toLowerCase() === "admin" ? (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-[#C92C1E] uppercase tracking-wider shadow-sm">
                Admin
              </span>
            ) : (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-[#C92C1E] uppercase tracking-wider shadow-sm">
                Sales
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-gray-200 font-bold text-gray-600 rounded-xl text-xs hover:bg-gray-50 shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#C92C1E] text-white font-bold rounded-xl text-xs hover:bg-[#A82216] shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Riwayat Baru
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-[#C92C1E] transition-all"
            />
          </div>

          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-red-50/50 border border-red-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[11px] font-bold text-[#C92C1E] uppercase whitespace-nowrap">PIC:</span>
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

          {/* TOGGLE PANEL — PANEL TOGGLE DENGAN AKSEN MERAH BEBAS GARIS HITAM */}
          <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-gray-200">
            <button type="button" onClick={() => setModeFilter("harian")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "harian" ? "bg-white text-[#C92C1E] shadow-sm" : "text-gray-500"}`}>Harian</button>
            <button type="button" onClick={() => setModeFilter("bulanan")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "bulanan" ? "bg-white text-[#C92C1E] shadow-sm" : "text-gray-500"}`}>Bulanan</button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-gray-200">
            <svg className="w-3.5 h-3.5 text-gray-500 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input 
              type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? filterDate : filterMonth}
              onChange={(e) => modeFilter === "harian" ? setFilterDate(e.target.value) : setFilterMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase p-0.5"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE INTEGRATED */}
      <div className="space-y-4">
        {loading || !isSessionReady ? (
          <div className="text-center py-24 text-sm text-gray-400 font-bold animate-pulse">Menghubungkan ke tabel call & chat...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.514 13H4" />
            </svg>
            Tidak ada data log ditemukan.
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { header: "Tanggal", accessor: "tanggalFu", render: (item: any) => formatTanggalIndo(item.tanggalFu?.substring(0, 10)) },
                { header: "Pic Team Hunter", accessor: "pic", render: (item: any) => <span className="text-[#1C1C1E]">{dapatkanNamaPanggilan(item.pic)}</span> }, 
                { header: "Project / Brand", accessor: "brand", render: (item: any) => <span className="font-black text-gray-800">{item.brand || "-"}</span> }, 
                { header: "Nama Owner", accessor: "namaOwner" },
                { header: "No. HP Mitra", accessor: "hpOwner", render: (item: any) => <span className="font-mono">{item.hpOwner || "-"}</span> },
                { 
                  header: "Status", accessor: "statusAkun", render: (item: any) => (
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border text-center ${
                      item.statusAkun === "Outlet Baru" ? "bg-amber-50 text-amber-700 border-emerald-200" :
                      item.statusAkun === "Referral Mitra" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-sky-50 text-sky-700 border-sky-200" 
                    }`}>
                      {item.statusAkun || "-"}
                    </span>
                  ) 
                },
              ]} 
              initialData={filteredData} 
              onRowClick={(item: any) => handleOpenRowDetail(item)} 
            />
          </div>
        )}
      </div>

      {/* FORM MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-red-100">
              <h2 className="text-md font-bold text-[#1D1D1F] flex items-center gap-1.5">
                {selectedRecord && !isEditMode ? (
                  <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : isEditMode ? (
                  <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {selectedRecord && !isEditMode ? "Rincian Data Call & Chat" : isEditMode ? "Ubah Log Aktivitas" : "Log Riwayat Box Baru"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#86868B] text-lg hover:text-[#C92C1E] rounded-xl p-1 hover:bg-gray-100 cursor-pointer transition-colors">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-gray-500">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>TANGGAL FU</label>
                  <input type="date" name="tanggalFu" value={selectedRecord && !isEditMode ? selectedRecord.tanggalFu?.substring(0, 10) : formInput.tanggalFu} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors cursor-pointer uppercase" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>BULAN BERJALAN</label>
                  <input type="text" name="bulan" placeholder="Contoh: Juli" value={selectedRecord && !isEditMode ? selectedRecord.bulan : formInput.bulan} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>TANGGAL DIBAGIKAN</label>
                  <input type="date" name="tanggalDibagikan" value={selectedRecord && !isEditMode ? selectedRecord.tanggalDibagikan?.substring(0, 10) : formInput.tanggalDibagikan} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors cursor-pointer uppercase" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>STATUS AKUN</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.statusAkun} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="statusAcnt" value={formInput.statusAcnt} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C92C1E] transition-colors cursor-pointer">
                      <option value="Akun Baru">Akun Baru</option>
                      <option value="Outlet Baru">Outlet Baru</option>
                      <option value="Referral Mitra">Referral Mitra</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label>NO. HP OWNER</label>
                  <input type="text" name="hpOwner" placeholder="Contoh: 08123456xxx" value={selectedRecord && !isEditMode ? selectedRecord.hpOwner : formInput.hpOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>NAMA OWNER</label>
                  <input type="text" name="namaOwner" placeholder="Contoh: Pak Budi" value={selectedRecord && !isEditMode ? selectedRecord.namaOwner : formInput.namaOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>KODE OWNER</label>
                  <input type="number" name="kodeOwner" placeholder="Contoh: 1255" value={selectedRecord && !isEditMode ? selectedRecord.kodeOwner : formInput.kodeOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <label>PIC SALES</label>
                  <input type="text" name="pic" value={formInput.pic} disabled className="border border-red-200 p-2.5 rounded-xl text-sm font-black text-[#C92C1E] bg-red-50/30 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label>PROJECT / BRAND</label>
                  <input type="text" name="brand" placeholder="Contoh: Piposmart Laundry" value={selectedRecord && !isEditMode ? selectedRecord.brand : formInput.brand} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>KODE BARIS</label>
                  <input type="number" name="kodeBaris" placeholder="Contoh: 142" value={selectedRecord && !isEditMode ? selectedRecord.kodeBaris : formInput.kodeBaris} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>OUTLET</label>
                <input type="text" name="outlet" placeholder="Contoh: Cabang Batam Center" value={selectedRecord && !isEditMode ? selectedRecord.outlet : formInput.outlet} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 text-xs transition cursor-pointer flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#C92C1E] text-white font-bold text-sm shadow-md cursor-pointer hover:bg-[#A82216] transition-colors">{isEditMode ? "Simpan Perubahan" : "Simpan Log"}</button>
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