"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DataTable from "../components/DataTable";

export default function PenjualanHarianPage() {
  const router = useRouter();
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

  // 🌟 STATE USER SESSION: Menyimpan nama akun dan role browser pasca-mounted
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // 🌟 STATE FILTER PIC KHUSUS ADMIN: "Semua" = tampilkan semua PIC
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
  const [bulanFilter, setBulanFilter] = useState(getTargetMonthString()); // State Filter Bulanan

  // 🌟 AMAN SSR: Memuat data localStorage hanya setelah masuk siklus client-side
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

  // 🌟 DAFTAR PIC UNIK DARI DATA YANG ADA (untuk isi pilihan dropdown filter Admin)
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

  const handleOpenRowDetail = (item: any) => {
    const id = item.id || item.ID;
    router.push(`/penjualan/form?mode=edit&id=${id}`);
  };

  // 🔍 🌟 LOGIKA UTAMA SINKRONISASI HAK AKSES DATA FILTER
  const filteredData = data.filter((item: any) => {
    const itemPicPanggilan = dapatkanNamaPanggilan(item.pic_team || "");

    const matchesSearch = 
      item.nama_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemPicPanggilan.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.target_paket?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 🌟 KUNCI ROLE KETAT:
    // - Admin: bisa lihat semua PIC, atau pilih PIC tertentu lewat dropdown filter
    // - Sales: dipaksa hanya menampilkan data pribadi miliknya sendiri (tidak bisa lihat punya orang lain)
    const matchesRoleAkses = userRole === "Admin"
      ? (picFilterAdmin === "Semua" || itemPicPanggilan.toLowerCase() === picFilterAdmin.toLowerCase())
      : itemPicPanggilan.toLowerCase() === loggedInUser.toLowerCase();

    const dataDateStr = item.tanggal ? item.tanggal.substring(0, 10) : "";
    let matchesTanggal = false;
    
    if (modeFilter === "harian") {
      matchesTanggal = dataDateStr === tanggalFilter;
    } else {
      const dataMonthStr = item.tanggal ? item.tanggal.substring(0, 7) : "";
      matchesTanggal = dataMonthStr === bulanFilter;
    }
    
    return matchesSearch && matchesRoleAkses && matchesTanggal;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pusat Data Penjualan</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Ringkasan parameter esensial konversi pipeline dan target operasional PT PIPOSMART DIGITAL INDONESIA.
          </p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {loggedInUser}</span>
            {userRole === "Admin" && (
              <span className="ml-2 text-[10px] bg-blue-50 text-[#007AFF] border border-blue-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/pipo/penjualan/export"}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm transition cursor-pointer"
          >
            📥 Export Excel
          </button>
          <button 
            onClick={() => router.push("/penjualan/form?mode=create")}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#0062CC] transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Record Penjualan Baru
          </button>
        </div>
      </div>

      {/* FILTER SEARCH PANEL WITH MONTH MODE */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Cari Brand, Owner, atau Nama PIC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          {/* 🌟 FILTER PIC — HANYA TAMPIL UNTUK ADMIN */}
          {userRole === "Admin" && (
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

          {/* TOGGLE TAB MODE FILTER */}
          <div className="flex bg-gray-100 p-1 rounded-xl border w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModeFilter("harian")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                modeFilter === "harian" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setModeFilter("bulanan")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                modeFilter === "bulanan" ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-500"
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* INPUT DATE/MONTH CONTROLLER */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap">
              {modeFilter === "harian" ? "Rekapan Tanggal:" : "Rekapan Bulan:"}
            </span>
            <input 
              type={modeFilter === "harian" ? "date" : "month"}
              value={modeFilter === "harian" ? tanggalFilter : bulanFilter}
              onChange={(e) => modeFilter === "harian" ? setTanggalFilter(e.target.value) : setBulanFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase"
            />
          </div>

        </div>
      </div>

      {/* DATA TABLE */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke tabel penjualan...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            📭 Tidak ada data rekapan penjualan/pipeline pada {modeFilter === "harian" ? `tanggal ${formatTanggalIndo(tanggalFilter)}` : `bulan ${formatBulanIndo(bulanFilter)}`}
            {userRole === "Admin" && picFilterAdmin !== "Semua" ? ` untuk PIC ${picFilterAdmin}` : ""}.
            <p className="text-[11px] text-gray-400 mt-1">Jika Anda merasa sudah menginput data, silakan ubah filter tanggal/bulan di atas ke periode data tersebut diinput.</p>
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable 
              columns={[
                { header: "Tanggal Input", accessor: "tanggal", render: (item: any) => formatTanggalIndo(item.tanggal?.substring(0, 10)) },
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