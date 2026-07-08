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

    // 🌟 BE VALIDATOR FIX: Menyuntikkan nilai default "-" / "0" agar lolos pengecekan 'required' Backend
    const payload = {
      tanggalFu: formInput.tanggalFu || getTodayString(),
      bulan: formInput.bulan || "-",
      tanggalDibagikan: formInput.tanggalDibagikan || getTodayString(),
      statusAkun: formInput.statusAcnt || "Akun Baru", 
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
        // 🌟 ERROR CATCH FIX: Memastikan error dari backend dibaca dan ditampilkan ke Pop-Up 
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
          <h1 className="text-2xl font-black tracking-tight">Tele-Marketing Matrix</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manajemen riwayat monitoring tele-marketing internal PT PIPOSMART DIGITAL INDONESIA.
          </p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {isSessionReady ? loggedInUser : "Loading..."} ({userRole})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/callchat/export"}
            className="px-4 py-2.5 bg-white border border-gray-200 font-bold text-gray-600 rounded-xl text-xs hover:bg-gray-50 shadow-sm transition cursor-pointer"
          >
            Public 📤 Export Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-[#007AFF] text-white font-bold rounded-xl text-xs hover:bg-blue-600 shadow-md transition cursor-pointer"
          >
            <span>➕</span> Log Riwayat Baru
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {isSessionReady && userRole.toLowerCase() === "admin" && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#007AFF] uppercase whitespace-nowrap">👤 PIC:</span>
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

          <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-gray-200">
            <button type="button" onClick={() => setModeFilter("harian")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "harian" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"}`}>Harian</button>
            <button type="button" onClick={() => setModeFilter("bulanan")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${modeFilter === "bulanan" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"}`}>Bulanan</button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-gray-200">
            <input 
              type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? filterDate : filterMonth}
              onChange={(e) => modeFilter === "harian" ? setFilterDate(e.target.value) : setFilterMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase p-0.5"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE INTEGRATED (MINIMALIS) */}
      <div className="space-y-4">
        {loading || !isSessionReady ? (
          <div className="text-center py-24 text-sm text-gray-400 font-bold animate-pulse">Menghubungkan ke tabel call & chat...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            📭 Tidak ada data log ditemukan.
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
                { header: "Status", accessor: "statusAkun", render: (item: any) => (
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border text-center ${
                      item.statusAkun === "Outlet Baru" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      item.statusAkun === "Referral Mitra" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-sky-50 text-sky-700 border-sky-200" 
                    }`}>
                      {item.statusAkun === "Akun Baru" || String(item.statusAkun).toLowerCase().includes("baru") ? "Akun Baru" : item.statusAkun}
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
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-md font-bold text-[#1D1D1F]">
                {selectedRecord && !isEditMode ? "📋 Rincian Data Call & Chat" : isEditMode ? "✏️ Ubah Log Aktivitas" : "➕ Log Riwayat Box Baru"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#86868B] text-lg hover:text-black cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-[#515154]">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>TANGGAL FU</label>
                  <input type="date" name="tanggalFu" value={selectedRecord && !isEditMode ? selectedRecord.tanggalFu?.substring(0, 10) : formInput.tanggalFu} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none cursor-pointer uppercase" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>BULAN BERJALAN</label>
                  <input type="text" name="bulan" placeholder="Contoh: Juli" value={selectedRecord && !isEditMode ? selectedRecord.bulan : formInput.bulan} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>TANGGAL DIBAGIKAN</label>
                  <input type="date" name="tanggalDibagikan" value={selectedRecord && !isEditMode ? selectedRecord.tanggalDibagikan?.substring(0, 10) : formInput.tanggalDibagikan} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-white disabled:bg-[#F5F5F7] focus:outline-none cursor-pointer uppercase" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>STATUS AKUN</label>
                  {selectedRecord && !isEditMode ? (
                    <input type="text" value={selectedRecord.statusAkun === "Akun Baru" || String(selectedRecord.statusAkun).toLowerCase().includes("baru") ? "Akun Baru" : selectedRecord.statusAkun} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium bg-[#F5F5F7] text-gray-500" />
                  ) : (
                    <select name="statusAcnt" value={formInput.statusAcnt} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium focus:outline-none cursor-pointer">
                      <option value="Akun Baru">Akun Baru</option>
                      <option value="Outlet Baru">Outlet Baru</option>
                      <option value="Referral Mitra">Referral Mitra</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label>NO. HP OWNER</label>
                  <input type="text" name="hpOwner" placeholder="Contoh: 08123456xxx" value={selectedRecord && !isEditMode ? selectedRecord.hpOwner : formInput.hpOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>NAMA OWNER</label>
                  <input type="text" name="namaOwner" placeholder="Contoh: Pak Budi" value={selectedRecord && !isEditMode ? selectedRecord.namaOwner : formInput.namaOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>KODE OWNER</label>
                  <input type="number" name="kodeOwner" placeholder="Contoh: 1255" value={selectedRecord && !isEditMode ? selectedRecord.kodeOwner : formInput.kodeOwner} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label>PIC SALES</label>
                  <input type="text" name="pic" value={formInput.pic} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label>PROJECT / BRAND</label>
                  <input type="text" name="brand" placeholder="Contoh: Piposmart Laundry" value={selectedRecord && !isEditMode ? selectedRecord.brand : formInput.brand} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label>KODE BARIS</label>
                  <input type="number" name="kodeBaris" placeholder="Contoh: 142" value={selectedRecord && !isEditMode ? selectedRecord.kodeBaris : formInput.kodeBaris} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none" required />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>OUTLET</label>
                <input type="text" name="outlet" placeholder="Contoh: Cabang Batam Center" value={selectedRecord && !isEditMode ? selectedRecord.outlet : formInput.outlet} onChange={handleInputChange} disabled={selectedRecord && !isEditMode} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-medium disabled:bg-[#F5F5F7] focus:outline-none" />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div>
                  {selectedRecord && !isEditMode && (
                    <div className="flex gap-2">
                      <button type="button" onClick={handleActivateEditMode} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 text-xs transition cursor-pointer">✏️ Edit</button>
                      <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 text-xs transition cursor-pointer">🗑️ Hapus</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">{selectedRecord && !isEditMode ? "Selesai" : "Batal"}</button>
                  {(isEditMode || !selectedRecord) && (
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold text-sm shadow-md cursor-pointer">{isEditMode ? "Simpan Perubahan" : "Simpan Log"}</button>
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