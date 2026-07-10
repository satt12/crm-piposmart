"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable";

export default function ListMitraPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [picFilter, setPicFilter] = useState("All");

  // STATE USER LOGIN & SESSION (Aman dari Eror Hydration SSR)
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  const listBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember", "Nihil"
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

  // State Filter Tanggal (Harian) & Bulan (Bulanan)
  const [tanggalFilter, setTanggalFilter] = useState(getTodayString());
  const [bulanFilter, setBulanFilter] = useState(getTargetMonthString());

  // Helper nama panggilan pendek
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecKecil = namaLengkap.toLowerCase().trim();
    if (namaKecKecil.includes("satria")) return "Satria";
    if (namaKecKecil.includes("boby") || namaKecKecil.includes("pak boby") || namaKecKecil.includes("bobbi")) return "Boby";
    if (namaKecKecil.includes("lydia") || namaKecKecil.includes("lidya")) return "Lydia";
    if (namaKecKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  // FORM FIELD EXCEL MATCH
  const initialFormState = () => ({
    tanggalInput: getTodayString(),
    kategori: "REFERAL (Berlangganan)",
    kategoriSub: "Mitra Referral",
    picNasabah: typeof window !== "undefined" ? dapatkanNamaPanggilan(localStorage.getItem("user_pic") || "Satria") : "Satria", 
    bulanTerdaftar: listBulan[new Date().getMonth()], 
    tahun: new Date().getFullYear(), 
    kodeOwner: "",
    owner: "",
    brand: "",
    totalAkuisisiReferal: 0,
    totalReferral: 0,
  });

  const [formInput, setFormInput] = useState(initialFormState);

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

  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      if (typeof window !== "undefined") {
        const savedPic = localStorage.getItem("user_pic") || "Satria";
        setFormInput(prev => ({ 
          ...prev, 
          tanggalInput: getTodayString(),
          bulanTerdaftar: listBulan[new Date().getMonth()],
          tahun: new Date().getFullYear(),
          picNasabah: dapatkanNamaPanggilan(savedPic) 
        }));
      }
    }
  }, [isModalOpen, isEditMode]);

  // SINKRONISASI BACKEND LOGIC
  const normalisasiMitra = (item: any) => {
    return {
      id: item.id ?? item.ID,
      createdAt: item.createdAt ?? item.created_at ?? "",
      kategoriMitra: item.kategoriMitra ?? item.kategori_mitra ?? item.kategori ?? "REFERAL (Berlangganan)",
      kategoriMitraSub: item.kategoriMitraSub ?? item.kategori_mit_sub ?? item.kategoriSub ?? "Mitra Referral",
      picNasabah: item.picNasabah ?? item.pic_nasabah ?? item.pic ?? "",
      bulanTerdaftar: item.bulanTerdaftar ?? item.bulan_terdaftar ?? "",
      tahun: item.tahun ?? new Date().getFullYear(),
      kodeOwner: item.kodeOwner ?? item.kode_owner ?? "",
      owner: item.owner ?? item.ownerMitra ?? "",
      brand: item.brand ?? item.namaBrand ?? item.nama_brand ?? "",
      totalAkuisisiReferal: item.totalAkuisisiReferal ?? item.total_akuisisi_referal ?? 0,
      totalReferral: item.totalReferral ?? item.total_referral ?? 0,
    };
  };

  const fetchListMitra = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/list-mitra`);
      if (response.ok) {
        const result = await response.json();
        const rawList = result || [];
        const normalized = rawList.map((item: any) => normalisasiMitra(item));
        setData(normalized);
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
      if (name === "totalReferral" || name === "totalAkuisisiReferal" || name === "tahun") {
        updated[name] = value === "" ? "" : Number(value);
      }
      return updated;
    });
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setIsEditMode(false);
    setFormInput(initialFormState());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formInput,
      picNasabah: dapatkanNamaPanggilan(formInput.picNasabah),
      telp: selectedRecord?.telp || "-", 
      rekening: selectedRecord?.rekening || "-",
      wilayah: selectedRecord?.wilayah || "-",
      alamat: selectedRecord?.alamat || "-"
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
        alert(isEditMode ? "Data Master List Mitra berhasil diperbarui!" : "Data Master List Mitra berhasil disimpan!");
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
      bulanTerdaftar: item.bulanTerdaftar || listBulan[new Date().getMonth()],
      tahun: item.tahun || new Date().getFullYear(),
      kodeOwner: item.kodeOwner || "",
      owner: item.owner || item.ownerMitra || "",
      brand: item.brand || item.namaBrand || "",
      totalAkuisisiReferal: item.totalAkuisisiReferal ?? 0,
      totalReferral: item.totalReferral ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleActivateEditMode = () => {
    if (!selectedRecord) return;
    setIsEditMode(true);
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data master mitra terfilter yang tersedia untuk diekspor pada periode ini.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map((item: any) => ({
        "Tanggal Registrasi": item.createdAt ? item.createdAt.substring(0, 10) : "-",
        "Bulan Terdaftar": item.bulanTerdaftar || "-",
        "Tahun Buku": item.tahun || "-",
        "PIC Sales Hunter": dapatkanNamaPanggilan(item.picNasabah),
        "Kode Owner": item.kodeOwner || "-",
        "Nama Owner": item.owner || "-",
        "Nama Brand / Toko": item.brand || "-",
        "Kategori Utama": item.kategoriMitra || "-",
        "Sub Kategori": item.kategoriMitraSub || "-",
        "Total Akuisisi Referal": item.totalAkuisisiReferal ?? 0,
        "Total Referral": item.totalReferral ?? 0
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      ws["!cols"] = [
        { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 26 }, { wch: 20 }, { wch: 22 }, { wch: 16 }
      ];

      const namaTab = modeFilter === "harian" ? `Mitra Hari ${tanggalFilter}` : `Mitra Bulan ${bulanFilter}`;
      XLSX.utils.book_append_sheet(wb, ws, namaTab.substring(0, 31));

      const namaFile = modeFilter === "harian"
        ? `Direktori_Master_Mitra_Harian_${tanggalFilter}.xlsx`
        : `Direktori_Master_Mitra_Bulanan_${bulanFilter}.xlsx`;

      XLSX.writeFile(wb, namaFile);

    } catch (error) {
      console.error("Gagal mengekspor direktori master mitra ke Excel:", error);
      alert("Terjadi kegagalan teknis saat memproses pembuatan berkas Excel.");
    }
  };

  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.picNasabah || "");
    
    const matchesSearch = 
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Data List Mitra</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Manajemen ekosistem kemitraan korporasi & pelacakan referral harian.</p>
          <div className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Logged in: <span className="text-[#C92C1E] font-black">{isSessionReady ? loggedInUser : "Loading..."}</span>
            </div>
            
            {/* BADGE SYSTEM TERKONDISIKAN SECARA DINAMIS DAN SERASI BERWARNA MERAH */}
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
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#C92C1E] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#A82216] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrasi Mitra Baru
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
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
              type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? tanggalFilter : bulanFilter}
              onChange={(e) => modeFilter === "harian" ? setTanggalFilter(e.target.value) : setBulanFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase p-0.5"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE INTEGRATION */}
      <div className="space-y-4">
        {loading || !isSessionReady ? (
          <div className="text-center py-24 font-bold text-sm text-gray-400 animate-pulse">Sinkronisasi direktori crm...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 00-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.514 13H4" />
            </svg>
            Tidak ada data master mitra ditemukan.
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { header: "Bulan Terdaftar", accessor: "bulanTerdaftar" }, 
                { header: "Tahun", accessor: "tahun" },
                { header: "Kode Owner", accessor: "kodeOwner", render: (item: any) => <span className="font-mono text-gray-400 font-medium">{item.kodeOwner ? `#${item.kodeOwner}` : "-"}</span> },
                { header: "Owner Mitra", accessor: "owner" },
                { header: "Nama Brand", accessor: "brand", render: (item: any) => <span className="font-black text-gray-800">{item.brand || "-"}</span> }, 
                { 
                  header: "Kategori Mitra", 
                  accessor: "kategoriMitra", 
                  render: (item: any) => {
                    const kat = item.kategoriMitra || "-";
                    let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                    if (kat.includes("REFERAL")) badgeStyle = "bg-red-50 text-[#C92C1E] border-red-200";
                    else if (kat.includes("AFILIASI")) badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";

                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border text-center whitespace-nowrap block ${badgeStyle}`}>
                        {kat}
                      </span>
                    );
                  }
                },
              ]} 
              initialData={filteredData} 
              onRowClick={(item: any) => handleOpenRowDetail(item)} 
            />
          </div>
        )}
      </div>

      {/* POP-UP MODAL DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-red-100">
              <div>
                <h2 className="text-md font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {selectedRecord && !isEditMode ? "Rincian Data Master Database Mitra" : isEditMode ? "Perbarui Data Master Mitra" : "Registrasi Record Master Mitra Baru"}
                </h2>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Sistem otomatis mengunci PIC berdasarkan akun login aktif.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 text-sm p-1.5 hover:bg-gray-100 hover:text-[#C92C1E] rounded-xl cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">Tanggal Operasional Laporan</label>
                  <input 
                    type="date" name="tanggalInput" value={formInput.tanggalInput} 
                    onChange={handleInputChange} disabled={selectedRecord && !isEditMode} 
                    className="border border-[#E5E5EA] p-3 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7] uppercase cursor-pointer" required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-600">PIC</label>
                  <input type="text" name="picNasabah" value={formInput.picNasabah} disabled className="border border-red-200 p-3 rounded-xl text-sm font-black text-[#C92C1E] bg-red-50/30 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              {/* Kategori Utama & Sub (Box Merah/Rose Kontainer Report) */}
              <div className="bg-red-50/40 border border-red-100 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-[#C92C1E] bg-red-100/60 px-2.5 py-0.5 rounded-md uppercase">Kategori Kemitraan Utama</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C92C1E]/80">Kategori Utama</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={formInput.kategori} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-gray-100 disabled:bg-[#F5F5F7]" />
                    ) : (
                      <select name="kategori" value={formInput.kategori} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white">
                        <option value="REFERAL (Berlangganan)">REFERAL (Berlangganan)</option>
                        <option value="AFILIASI (Eks. Mesin, Rak, Dll)">AFILIASI (Eks. Mesin, Rak, Dll)</option>
                        <option value="FRANCHISE (Jual Brand)">FRANCHISE (Jual Brand)</option>
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C92C1E]/80">Sub Kategori Kemitraan</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={formInput.kategoriSub} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-gray-100 disabled:bg-[#F5F5F7]" />
                    ) : (
                      <select name="kategoriSub" value={formInput.kategoriSub} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white">
                        <option value="Mitra Referral">Mitra Referral</option>
                        <option value="Mitra Corporated">Mitra Corporated</option>
                        <option value="Vendor Utama">Vendor Utama</option>
                        <option value="Personal Affiliate">Personal Affiliate</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Periode Terdaftar Container */}
              <div 
                className="p-4 rounded-2xl space-y-3"
                style={{
                  backgroundColor: "#FFF5F5",
                  border: "1px solid #FEE2E2"
                }}
              >
                <span 
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase"
                  style={{ color: "#C92C1E", background: "rgba(239, 68, 68, 0.15)" }}
                >
                  Periode Buku Terdaftar
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: "#C92C1E" }}>Bulan Terdaftar (Dapat Diedit)</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={formInput.bulanTerdaftar} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none bg-gray-100 disabled:bg-[#F5F5F7]" />
                    ) : (
                      <select name="bulanTerdaftar" value={formInput.bulanTerdaftar} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none cursor-pointer focus:border-[#C92C1E] transition-colors bg-white">
                        {listBulan.map((bln) => (
                          <option key={bln} value={bln}>{bln}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ color: "#C92C1E" }}>Tahun Buku (Dapat Diedit)</label>
                    <input 
                      type="number" name="tahun" placeholder="Contoh: 2025" 
                      value={formInput.tahun} onChange={handleInputChange} 
                      disabled={selectedRecord && !isEditMode} 
                      className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Rincian Identitas Owner Box */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-gray-500 bg-gray-200/80 px-2.5 py-0.5 rounded-md uppercase">Identitas Pemilik & Toko</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Kode Owner</label>
                    <input type="text" name="kodeOwner" placeholder="Contoh: 11165" value={formInput.kodeOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Nama Owner</label>
                    <input type="text" name="owner" placeholder="Nama owner" value={formInput.owner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-600">Brand / Nama Toko</label>
                    <input type="text" name="brand" placeholder="Nama brand laundry" value={formInput.brand} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" required />
                  </div>
                </div>
              </div>

              {/* Parameter Akumulasi Nilai Referral */}
              <div className="bg-red-50/40 border border-red-100 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-[#C92C1E] bg-red-100/60 px-2.5 py-0.5 rounded-md uppercase">Akumulasi Performansi Referral</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C92C1E]/80">Total Akuisisi Referal</label>
                    <input type="number" name="totalAkuisisiReferal" value={formInput.totalAkuisisiReferal} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#C92C1E]/80">Total Referral</label>
                    <input type="number" name="totalReferral" value={formInput.totalReferral} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} placeholder="0" className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-[#C92C1E] transition-colors bg-white disabled:bg-[#F5F5F7]" />
                  </div>
                </div>
              </div>

              {/* CONTROLS FOOTER */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-2">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Ubah / Edit
                      </button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-50 text-[#C92C1E] border border-red-200 font-bold hover:bg-red-100 text-xs transition cursor-pointer flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Master
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#C92C1E] text-white font-bold hover:bg-[#A82216] text-sm shadow-md cursor-pointer transition-colors">{isEditMode ? "Simpan Perubahan" : "Simpan Master"}</button>
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