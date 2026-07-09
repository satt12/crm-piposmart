"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable";

export default function KelolaanMitraPage() {
  const [data, setData] = useState<any[]>([]);
  const [listMitraMaster, setListMitraMaster] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // STATE USER DROPDOWN FILTER UNTUK ADMIN
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // STATE USER LOGIN & SESSION
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // State Mode Filter: "harian" atau "bulanan"
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

  // State Filter Tanggal (Harian) & Bulan (Bulanan)
  const [tanggalFilter, setTanggalFilter] = useState(getTodayString());
  const [bulanFilter, setBulanFilter] = useState(getTargetMonthString());

  // Helper nama panggilan pendek
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

  // 🌟 HELPER BARU: Format Angka Menjadi Ribuan Indonesia (Titik)
  const formatRibuanIndo = (nilai: number | string) => {
    if (nilai === undefined || nilai === null || nilai === "") return "";
    const angkaMurni = String(nilai).replace(/\D/g, "");
    if (!angkaMurni) return "";
    return new Intl.NumberFormat("id-ID").format(Number(angkaMurni));
  };

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

  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.picNasabah || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  // 🌟 UPDATE: Menangani perubahan input teks dengan filter titik koma otomatis
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "nominal_komisi") {
      // Buang semua karakter yang bukan angka
      const murniAngka = value.replace(/\D/g, "");
      setFormInput((prev) => ({
        ...prev,
        [name]: murniAngka
      }));
    } else {
      setFormInput((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      
      // 🌟 UPDATE: Bersihkan string titik sebelum dikirim sebagai number ke backend
      const payload = {
        ...formInput,
        picNasabah: dapatkanNamaPanggilan(formInput.picNasabah),
        nominal_komisi: Number(String(formInput.nominal_komisi).replace(/\D/g, "")) || 0
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
        alert(isEditMode ? "Data Kelolaan Mitra Berhasil Diperbarui!" : "Data Kelolaan Mitra Berhasil Disimpan!");
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
      // Pastikan diekstrak sebagai angka murni
      nominal_komisi: selectedRecord.nominal_komisi !== undefined ? String(selectedRecord.nominal_komisi).replace(/\D/g, "") : "",
      status_komisi: selectedRecord.status_komisi || "Pending"
    });
  };

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data kelolaan mitra terfilter yang tersedia untuk diekspor pada periode ini.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map((item: any) => ({
        "Tanggal Input": item.tanggalInput ? item.tanggalInput.substring(0, 10) : "-",
        "CRM PIC Nasabah": dapatkanNamaPanggilan(item.picNasabah),
        "Kode Owner": item.kodeOwnerUtama || "-",
        "Nama Mitra Utama": item.namaMitra || "-",
        "Brand / Badan Usaha": item.brandUtama || "-",
        "Kategori Kemitraan": item.kategoriMitra || "-",
        "Paket Langganan": item.paketLangganan || "-",
        "Nominal Komisi (Rp)": Number(item.nominal_komisi) || 0,
        "Status Komisi": item.status_komisi === "Selesai" ? "Cair" : "Pending",
        "Status Langganan": item.statusLangganan || "-"
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      ws["!cols"] = [
        { wch: 15 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 25 },
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 18 }
      ];

      const namaTab = modeFilter === "harian" ? `Kelolaan Hari ${tanggalFilter}` : `Kelolaan Bulan ${bulanFilter}`;
      XLSX.utils.book_append_sheet(wb, ws, namaTab.substring(0, 31));

      const namaFile = modeFilter === "harian"
        ? `Data_Kelolaan_Mitra_Harian_${tanggalFilter}.xlsx`
        : `Data_Kelolaan_Mitra_Bulanan_${bulanFilter}.xlsx`;

      XLSX.writeFile(wb, namaFile);

    } catch (error) {
      console.error("Gagal melakukan proses penulisan file Excel:", error);
      alert("Terjadi gangguan teknis saat mengunduh dokumen Excel.");
    }
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

  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.picNasabah || "");
    
    const matchesSearch = 
      item.namaMitra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandUtama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUserAdmin = userRole.toLowerCase() === "admin";
    
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
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">Data Kelolaan Mitra</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Monitoring integrasi referral nasabah PT PIPOSMART DIGITAL INDONESIA.</p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {isSessionReady ? loggedInUser : "Loading..."}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm cursor-pointer flex items-center gap-1"
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

      {/* FILTER SEARCH PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" placeholder="Cari Brand, Owner, atau Nama PIC..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* DROPDOWN FILTER PIC SALES UNTUK ADMIN */}
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

        <div className="flex items-center justify-end gap-2 bg-[#F5F5F7] p-2 rounded-xl border border-gray-200 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap px-1">
            {modeFilter === "harian" ? "Rekapan Tanggal:" : "Rekapan Bulan:"}
          </span>
          <input 
            type={modeFilter === "harian" ? "date" : "month"} value={modeFilter === "harian" ? tanggalFilter : bulanFilter}
            onChange={(e) => modeFilter === "harian" ? setTanggalFilter(e.target.value) : setBulanFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase p-0.5"
          />
        </div>
      </div>

      {/* DATA TABLE INTEGRATED */}
      <div className="space-y-4">
        {loading || !isSessionReady ? (
          <div className="text-center py-24 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke enkripsi crm...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            📭 Tidak ada data rekapan ditemukan.
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { header: "Tanggal", accessor: "tanggalInput", render: (item: any) => formatTanggalIndo(item.tanggalInput?.substring(0, 10)) },
                { header: "PIC Nasabah", accessor: "picNasabah", render: (item: any) => <span className="text-[#1C1C1E]">{dapatkanNamaPanggilan(item.picNasabah)}</span> }, 
                { header: "Kode Owner", accessor: "kodeOwnerUtama", render: (item: any) => <span className="font-mono text-gray-400">#{item.kodeOwnerUtama || "-"}</span> },
                { header: "Nama Mitra", accessor: "namaMitra" },
                { header: "Brand Utama", accessor: "brandUtama", render: (item: any) => <span className="font-black text-gray-800">{item.brandUtama || "-"}</span> }, 
                { 
                  header: "Status Komisi", 
                  accessor: "status_komisi", 
                  render: (item: any) => (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border text-center ${item.status_komisi === "Selesai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {item.status_komisi === "Selesai" ? "Cair" : "Pending"}
                    </span>
                  ) 
                },
                { 
                  header: "Status Langganan", 
                  accessor: "statusLangganan", 
                  render: (item: any) => (
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase text-center ${getStatusLanggananStyle(item.statusLangganan)}`}>
                      {item.statusLangganan}
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
                    className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-white disabled:bg-[#F5F5F7] focus:outline-none uppercase cursor-pointer" required 
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
                  <label>Kategori Kemitraan</label>
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
                  <label>Paket Langganan</label>
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
                  <label>Status Langganan</label>
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
                    {/* 🌟 UPDATE VIEW FORM: Menggunakan tipe text & helper formatRibuanIndo */}
                    <input 
                      type="text" 
                      name="nominal_komisi" 
                      placeholder="Contoh: 250.000" 
                      value={selectedRecord && !isEditMode ? formatRibuanIndo(selectedRecord.nominal_komisi) : formatRibuanIndo(formInput.nominal_komisi)} 
                      onChange={handleInputChange} 
                      disabled={selectedRecord && !isEditMode} 
                      className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white disabled:bg-gray-100/70 focus:outline-none" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-amber-900">Status Pencairan Komisi</label>
                    {selectedRecord && !isEditMode ? (
                      <input type="text" value={selectedRecord.status_komisi === "Selesai" ? "Cair" : "Pending"} disabled className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-gray-100/70 text-gray-500" />
                    ) : (
                      <select name="status_komisi" value={formInput.status_komisi} onChange={handleInputChange} className="border border-[#E5E5EA] p-2.5 rounded-xl text-sm font-bold bg-white text-gray-800 focus:outline-none">
                        <option value="Pending">Pending (Ditahan)</option>
                        <option value="Selesai">Selesai (Sudah Cair)</option>
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