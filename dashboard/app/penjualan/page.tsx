"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataTable from "../components/DataTable";

export default function PenjualanHarianPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Helper untuk membersihkan dan menstandarkan nama panggilan pendek
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  // STATE USER SESSION
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // STATE FILTER PIC KHUSUS ADMIN
  const [picFilterAdmin, setPicFilterAdmin] = useState("Semua");

  // State Mode Filter: "harian" atau "bulanan"
  const [modeFilter, setModeFilter] = useState<"harian" | "bulanan">("harian");

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  const getTargetMonthString = () => {
    return new Date().toISOString().substring(0, 7); // Format: YYYY-MM
  };

  const [tanggalFilter, setTanggalFilter] = useState(getTodayString());
  const [bulanAwalFilter, setBulanAwalFilter] = useState(getTargetMonthString());
  const [bulanAkhirFilter, setBulanAkhirFilter] = useState(getTargetMonthString());

  // 🌟 UPDATE UTAMA: Memulihkan ingatan parameter tanggal/bulan secara utuh agar tidak kosong saat kembali
  useEffect(() => {
    const filterTerbawa = searchParams.get("filter");
    const tglTerbawa = searchParams.get("tgl");
    const blnAwalTerbawa = searchParams.get("blnAwal");
    const blnAkhirTerbawa = searchParams.get("blnAkhir");

    if (filterTerbawa === "bulanan") {
      setModeFilter("bulanan");
      if (blnAwalTerbawa) setBulanAwalFilter(blnAwalTerbawa);
      if (blnAkhirTerbawa) setBulanAkhirFilter(blnAkhirTerbawa);
    } else if (filterTerbawa === "harian") {
      setModeFilter("harian");
      if (tglTerbawa) setTanggalFilter(tglTerbawa);
    }
  }, [searchParams]);

  // UTILITY FUNCTION: Memformat Tanggal & Waktu Input secara presisi (DD MMMM YYYY • HH:mm WIB)
  const formatTanggalWaktuLengkap = (tanggalMentah: string, createdAtMentah?: string) => {
    const targetWaktu = createdAtMentah || tanggalMentah;
    if (!targetWaktu) return "-";

    try {
      const dateObj = new Date(targetWaktu);
      if (isNaN(dateObj.getTime())) return tanggalMentah;

      const opsiTanggal: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
      const tanggalFormat = new Intl.DateTimeFormat("id-ID", opsiTanggal).format(dateObj);

      const opsiWaktu: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
      const waktuFormat = new Intl.DateTimeFormat("id-ID", opsiWaktu).format(dateObj);

      if (targetWaktu.length <= 10 && !createdAtMentah) {
        return tanggalFormat;
      }

      return `${tanggalFormat} • ${waktuFormat} WIB`;
    } catch (e) {
      return tanggalMentah;
    }
  };

  // AMAN SSR: Memuat data session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPic = localStorage.getItem("user_pic");
      const savedRole = localStorage.getItem("user_role");
      if (savedPic) {
        setLoggedInUser(dapatkanNamaPanggilan(savedPic));
      }
      if (savedRole) {
        setUserRole(savedRole);
      }
    }
  }, []);

  const fetchPenjualan = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/pipo/penjualan`);
      if (response.ok) {
        const result = await response.json();
        const dataMentah = Array.isArray(result) ? result : (result.data || []);
        setData(dataMentah);
      }
    } catch (error) {
      console.error("Gagal memuat data penjualan harian:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenjualan();
  }, []);

  // DAFTAR PIC UNIK
  const daftarPicUnik = useMemo(() => {
    const setPic = new Set<string>();
    data.forEach((item: any) => {
      setPic.add(dapatkanNamaPanggilan(item.pic_team || ""));
    });
    return Array.from(setPic).sort();
  }, [data]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Closing": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Potensi": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negoisasi": return "bg-sky-50 text-sky-700 border-sky-200";
      case "Existing": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Renewal": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Tidak Tertarik": return "bg-rose-50 text-rose-600 border-rose-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // 🌟 UPDATE FUNGSI: Mengoper semua parameter filter aktif ke form agar tidak ter-reset
  const handleOpenRowDetail = (item: any) => {
    const id = item.id || item.ID;
    router.push(`/penjualan/form?mode=edit&id=${id}&source=${modeFilter}&tgl=${tanggalFilter}&blnAwal=${bulanAwalFilter}&blnAkhir=${bulanAkhirFilter}`);
  };

  // LOGIKA UTAMA FILTER DATA
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.pic_team || "");

    const matchesSearch = 
      item.nama_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.target_paket?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoleAkses = userRole === "Admin"
      ? (picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase())
      : itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();

    const dataDateStr = item.tanggal ? item.tanggal.substring(0, 10) : "";
    let matchesTanggal = false;
    
    if (modeFilter === "harian") {
      matchesTanggal = dataDateStr === tanggalFilter;
    } else {
      const dataMonthStr = item.tanggal ? item.tanggal.substring(0, 7) : "";
      matchesTanggal = dataMonthStr >= bulanAwalFilter && dataMonthStr <= bulanAkhirFilter;
    }
    
    return matchesSearch && matchesRoleAkses && matchesTanggal;
  });

  // FITUR EKSPOR EXCEL SINKRONISASI RENTANG WAKTU
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data tabel yang tersedia untuk diekspor pada filter periode ini.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map((item: any) => ({
        "Waktu & Tanggal Input": formatTanggalWaktuLengkap(item.tanggal, item.created_at || item.createdAt),
        "PIC Team": dapatkanNamaPanggilan(item.pic_team),
        "Brand Usaha": item.nama_brand || "-",
        "Nama Owner": item.nama_owner || "-",
        "No Handphone": item.no_hp || item.whatsapp || "-",
        "Target Skema Paket": item.target_paket || "-",
        "Harga Satuan": item.harga_satuan || 0,
        "Jumlah Nasabah": item.jumlah_nasabah || 0,
        "Total Omset Penjualan": item.total_penjualan || 0,
        "Tenor": item.tenor || "-",
        "Status Pipeline": item.status || "-"
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      ws["!cols"] = [
        { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 16 }, { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 18 }
      ];

      const namaSheet = modeFilter === "harian" 
        ? `Harian ${tanggalFilter}` 
        : `Range ${bulanAwalFilter} sd ${bulanAkhirFilter}`;
      XLSX.utils.book_append_sheet(wb, ws, namaSheet.substring(0, 31));

      const namaFile = modeFilter === "harian"
        ? `Data_Penjualan_Piposmart_Harian_${tanggalFilter}.xlsx`
        : `Data_Penjualan_Piposmart_Rentang_Bulan_${bulanAwalFilter}_ke_${bulanAkhirFilter}.xlsx`;

      XLSX.writeFile(wb, namaFile);

    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      alert("Terjadi kesalahan saat memproses ekspor berkas Excel.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pusat Data Penjualan</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Ringkasan parameter esensial konversi pipeline dan target operasional PT PIPOSMART DIGITAL INDONESIA.
          </p>
          
          {/* LOGGED IN SECTION */}
          <div className="text-xs text-gray-400 font-bold mt-3 flex items-center gap-2.5 flex-wrap">
            <span className="text-gray-400 font-medium">Logged in:</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C92C1E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-extrabold text-[#C92C1E] tracking-tight">{loggedInUser}</span>
              
              {/* BADGE MANAGEMENT SYSTEM (SEKARANG KEDUANYA BERWARNA MERAH SERASI) */}
              {userRole === "Admin" ? (
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
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Excel</span>
          </button>
          
          <button 
            onClick={() => router.push(`/penjualan/form?mode=create&source=${modeFilter}&tgl=${tanggalFilter}&blnAwal=${bulanAwalFilter}&blnAkhir=${bulanAkhirFilter}`)}
            className="px-5 py-2.5 bg-[#C92C1E] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#A82216] transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Record Penjualan Baru</span>
          </button>
        </div>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Cari Brand, Owner, atau Nama PIC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-2 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-[#C92C1E] transition-all"
            />
          </div>

          {/* FILTER PIC — HANYA TAMPIL UNTUK ADMIN */}
          {userRole === "Admin" && (
            <div className="flex items-center gap-2 bg-red-50/50 border border-red-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#C92C1E] uppercase whitespace-nowrap flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                PIC:
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

          {/* SUSUNAN LAYOUT TOGGLE FILTER TANGGAL (GARIS HITAM SUDAH DIHAPUS) */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200/80 w-full sm:w-auto flex-wrap">
            <div className="flex bg-gray-200/70 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setModeFilter("harian")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  modeFilter === "harian" ? "bg-white text-[#C92C1E] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setModeFilter("bulanan")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  modeFilter === "bulanan" ? "bg-white text-[#C92C1E] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Bulanan
              </button>
            </div>

            <div className="flex items-center gap-2 px-1 text-gray-600 font-bold text-[11px]">
              {modeFilter === "harian" ? (
                <>
                  <span className="text-gray-400 font-black uppercase text-[10px]">Tanggal:</span>
                  <input 
                    type="date"
                    value={tanggalFilter}
                    onChange={(e) => setTanggalFilter(e.target.value)}
                    className="bg-white border border-gray-200 focus:border-[#C92C1E] rounded-lg px-2 py-0.5 text-xs text-gray-700 focus:outline-none cursor-pointer uppercase transition-all"
                  />
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-black uppercase text-[10px]">Dari:</span>
                  <input 
                    type="month"
                    value={bulanAwalFilter}
                    onChange={(e) => setBulanAwalFilter(e.target.value)}
                    className="bg-white border border-gray-200 focus:border-[#C92C1E] rounded-lg px-2 py-0.5 text-xs text-gray-700 focus:outline-none cursor-pointer transition-all"
                  />
                  <span className="text-gray-400 font-black uppercase text-[10px]">S/D:</span>
                  <input 
                    type="month"
                    value={bulanAkhirFilter}
                    onChange={(e) => setBulanAkhirFilter(e.target.value)}
                    className="bg-white border border-gray-200 focus:border-[#C92C1E] rounded-lg px-2 py-0.5 text-xs text-gray-700 focus:outline-none cursor-pointer transition-all"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* DATA TABLE */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke tabel penjualan...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 00-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.514 13H4" />
            </svg>
            Tidak ada data rekapan penjualan/pipeline pada {modeFilter === "harian" ? `tanggal ${formatTanggalIndo(tanggalFilter)}` : `rentang periode ${formatBulanIndo(bulanAwalFilter)} s/d ${formatBulanIndo(bulanAkhirFilter)}`}
            {userRole === "Admin" && picFilterAdmin !== "Semua" ? ` untuk PIC ${picFilterAdmin}` : ""}.
            <p className="text-[11px] text-gray-400 mt-1">Jika Anda merasa sudah menginput data, silakan ubah rentang tanggal/bulan di atas.</p>
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { 
                  header: "Waktu & Tanggal Input", 
                  accessor: "tanggal", 
                  render: (item: any) => (
                    <span className="text-gray-900 font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#C92C1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTanggalWaktuLengkap(item.tanggal, item.created_at || item.createdAt)}
                    </span>
                  )
                },
                { header: "PIC Team", accessor: "pic_team", render: (item: any) => dapatkanNamaPanggilan(item.pic_team) },
                { header: "Brand Usaha", accessor: "nama_brand", render: (item: any) => <span className="font-bold text-gray-800">{item.nama_brand || "-"}</span> },
                { header: "Nama Owner", accessor: "nama_owner" },
                { header: "Target Skema Paket", accessor: "target_paket", render: (item: any) => item.target_paket || "-" },
                { header: "Total Omset", accessor: "total_penjualan", render: (item: any) => <span className="font-black text-emerald-600">{formatRupiah(item.total_penjualan)}</span> },
                { header: "Status", accessor: "status", render: (item: any) => <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusStyle(item.status)}`}>{item.status}</span> },
              ]} 
              initialData={filteredData} 
              onRowClick={(item: any) => handleOpenRowDetail(item)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}