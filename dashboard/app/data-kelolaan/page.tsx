"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable";

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

  // STATE FILTER PIC KHUSUS ADMIN
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  // Helper nama panggilan (FIXED TYPO)
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    const kataPertama = namaLengkap.split(" ")[0];
    return kataPertama.charAt(0).toUpperCase() + kataPertama.slice(1);
  };

  // Ekstraksi field dinamis dari backend
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

  // Normalisasi data dari backend
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

  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterMonth, setFilterMonth] = useState(getTargetMonthString());

  const initialFormState = () => ({
    tanggalFu: getTodayString(),
    bulan: new Date().toLocaleString("id-ID", { month: "long" }),
    statusAkun: "Akun Baru", 
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPic = localStorage.getItem("user_pic");
      const savedRole = localStorage.getItem("user_role");

      let currentPic = "Satria";
      if (savedPic) {
        currentPic = dapatkanNamaPanggilan(savedPic);
        setLoggedInUser(currentPic);
      }

      setUserRole(savedRole || "Sales");
      setFormInput(prev => ({ ...prev, pic: currentPic }));
      setIsSessionReady(true);
    }
  }, []);

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

  const fetchKelolaan = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/kelolaan`); 
      if (response.ok) {
        const result = await response.json();
        const rawList = result || [];
        const normalized = rawList.map((item: any) => normalisasiKelolaan(item));
        setData(normalized);
      }
    } catch (error) {
      console.error("Gagal memuat data crm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelolaan();
  }, []);

  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(bacaPicDariItem(item));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr || !tglStr.includes("-")) return tglStr;
    const [year, month, day] = tglStr.split("-");
    return `${day}/${month}/${year}`;
  };

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
        alert(isEditMode ? "Data Kelolaan berhasil diperbarui!" : "Data Kelolaan berhasil disimpan!");
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
      statusAkun: selectedRecord.statusAkun || "Akun Baru",
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

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data kelolaan terfilter yang tersedia untuk diekspor pada periode ini.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map((item: any) => ({
        "Tanggal Input / FU": formatTanggalIndo(item.tanggalFu?.substring(0, 10)),
        "Bulan Berjalan": item.bulan || "-",
        "Pic Team Hunter": bacaPicDariItem(item),
        "Project / Brand (Outlet)": item.brand || "-",
        "Nama Owner": item.namaOwner || "-",
        "No Handphone Mitra": item.hpOwner || "-",
        "Status Akun": item.statusAkun === "Akun Baru" || String(item.statusAkun).toLowerCase().includes("baru") ? "Akun Baru" : item.statusAkun,
        "Sumber Nasabah": item.sumber || "-",
        "Catatan Tambahan (Remaks)": item.noted || "-"
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      ws["!cols"] = [
        { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 35 }
      ];

      const namaTab = modeFilter === "harian" ? `Log Hari ${filterDate}` : `Log Bulan ${filterMonth}`;
      XLSX.utils.book_append_sheet(wb, ws, namaTab.substring(0, 31));

      const namaFile = modeFilter === "harian"
        ? `Log_Data_Kelolaan_Piposmart_Harian_${filterDate}.xlsx`
        : `Log_Data_Kelolaan_Piposmart_Bulanan_${filterMonth}.xlsx`;

      XLSX.writeFile(wb, namaFile);

    } catch (error) {
      console.error("Gagal mengekspor data kelolaan ke file Excel:", error);
      alert("Terjadi kesalahan teknis saat mencoba memproses dokumen Excel.");
    }
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = bacaPicDariItem(item);
    
    const matchesSearch = 
      item.namaOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative py-4 px-4 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Data Kelolaan CRM</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Monitoring data log aktivitas hubungan kelolaan mitra operasional terintegrasi.</p>
          <div className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Logged in: <span className="text-[#C92C1E] font-black">{isSessionReady ? loggedInUser : "Loading..."}</span>
            </div>
            
            {/* BADGE MANAGEMENT SYSTEM (MERAH SERASI UNTUK ADMIN DAN SALES) */}
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
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportExcel} className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm cursor-pointer flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#C92C1E] rounded-xl hover:bg-[#A82216] shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Record Kelolaan
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau Nama PIC..." value={searchTerm}
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

          {/* TOGGLE HARIAN / BULANAN — GARIS HITAM SUDAH DIHAPUS */}
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
          <div className="text-center py-24 text-sm text-gray-400 font-bold animate-pulse">Menghubungkan ke tabel kelolaan...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            📭 Tidak ada data kelolaan ditemukan.
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { header: "Tanggal", accessor: "tanggalFu", render: (item: any) => formatTanggalIndo(item.tanggalFu?.substring(0, 10)) },
                { header: "Pic Team Hunter", accessor: "pic", render: (item: any) => <span className="text-[#1C1C1E]">{bacaPicDariItem(item)}</span> }, 
                { header: "Project / Brand", accessor: "brand", render: (item: any) => <span className="font-black text-gray-800">{item.brand || "-"}</span> }, 
                { header: "Nama Owner", accessor: "namaOwner" },
                { header: "No. HP Mitra", accessor: "hpOwner", render: (item: any) => <span className="font-mono">{item.hpOwner || "-"}</span> },
                { header: "Status", accessor: "statusAkun", render: (item: any) => (
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border text-center ${
                      item.statusAkun === "Berlangganan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      item.statusAkun === "Follow Up" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      item.statusAkun === "Top Up" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-sky-50 text-sky-700 border-sky-200"
                    }`}>
                      {item.statusAkun === "Account Baru" || item.statusAkun === "Akun Baru" || String(item.statusAkun).toLowerCase().includes("baru") ? "Akun Baru" : item.statusAkun}
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

      {/* FORM & DETAIL MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-red-100">
              <h2 className="text-md font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {selectedRecord && !isEditMode ? "Rincian Data Kelolaan" : isEditMode ? "Ubah Data Kelolaan" : "Tambah Record Baru"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#86868B] text-lg hover:text-[#C92C1E] rounded-xl p-1 hover:bg-gray-100 cursor-pointer transition-colors">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-gray-500">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>TANGGAL FU</label>
                  <input 
                    type="date" name="tanggalFu" 
                    value={selectedRecord && !isEditMode ? selectedRecord.tanggalFu?.substring(0, 10) : formInput.tanggalFu} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white disabled:bg-[#F5F5F7] uppercase focus:outline-none focus:border-[#C92C1E] transition-colors cursor-pointer" required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>BULAN BERJALAN</label>
                  <input 
                    type="text" name="bulan" 
                    value={selectedRecord && !isEditMode ? selectedRecord.bulan : formInput.bulan} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode}
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors" required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>STATUS AKUN</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.statusAkun === "Akun Baru" || String(selectedRecord.statusAkun).toLowerCase().includes("baru") ? "Akun Baru" : selectedRecord.statusAkun} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="statusAkun" value={formInput.statusAkun} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white focus:outline-none focus:border-[#C92C1E] transition-colors">
                      <option value="Akun Baru">Akun Baru</option>
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
                  <input 
                    type="text" 
                    name="namaOwner" 
                    placeholder="Contoh: Hendra Wijaya" 
                    value={selectedRecord && !isEditMode ? selectedRecord.namaOwner : formInput.namaOwner} 
                    onChange={handleInputChange} 
                    disabled={selectedRecord && !isEditMode} 
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors placeholder:text-gray-300 placeholder:font-normal" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>NO. HP OWNER</label>
                  <input 
                    type="text" 
                    name="hpOwner" 
                    placeholder="Contoh: 081234567890" 
                    value={selectedRecord && !isEditMode ? selectedRecord.hpOwner : formInput.hpOwner} 
                    onChange={handleInputChange} 
                    disabled={selectedRecord && !isEditMode} 
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors placeholder:text-gray-300 placeholder:font-normal" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>PIC</label>
                  <input type="text" name="pic" value={formInput.pic} disabled className="border border-red-200 p-2.5 rounded-xl text-sm font-black text-[#C92C1E] bg-red-50/30 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>PROJECT / BRAND (OUTLET)</label>
                  <input 
                    type="text" 
                    name="brand" 
                    placeholder="Contoh: Kopi Kenangan - Batam Center" 
                    value={selectedRecord && !isEditMode ? selectedRecord.brand : formInput.brand} 
                    onChange={handleInputChange} 
                    disabled={selectedRecord && !isEditMode} 
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] focus:outline-none focus:border-[#C92C1E] transition-colors placeholder:text-gray-300 placeholder:font-normal" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label>SUMBER NASABAH</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.sumber} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="sumber" value={formInput.sumber} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] bg-white focus:outline-none focus:border-[#C92C1E] transition-colors">
                      <option value="Mitra Referral">Mitra Referral</option>
                      <option value="Mitra Corporated">Mitra Corporated</option>
                      <option value="Vendor Utama">Vendor Utama</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>CATATAN TAMBAHAN (REMAKS / NOTED)</label>
                <textarea 
                  name="noted" 
                  rows={3} 
                  placeholder="Contoh: Owner tertarik dengan POS Bundle Business, minta di-hubungi kembali hari Jumat sore jam 16.00 setelah toko senggang." 
                  value={selectedRecord && !isEditMode ? selectedRecord.noted : formInput.noted} 
                  onChange={handleInputChange} 
                  disabled={selectedRecord && !isEditMode} 
                  className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-[#1D1D1F] disabled:bg-[#F5F5F7] resize-none focus:outline-none focus:border-[#C92C1E] transition-colors font-sans placeholder:text-gray-300 placeholder:font-normal placeholder:leading-relaxed" 
                />
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
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#C92C1E] text-white font-bold text-sm shadow-md cursor-pointer hover:bg-[#A82216] transition-colors">{isEditMode ? "Simpan Perubahan" : "Simpan"}</button>
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