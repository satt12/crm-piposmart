"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "../components/DataTable";

export default function PotensiDemoPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  const [tanggalFilter, setTanggalFilter] = useState(getTodayString());

  const fetchPotensi = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/potensi`);
      if (response.ok) {
        const result = await response.json();
        setData(Array.isArray(result) ? result : (result.data || []));
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Gagal memuat data potensi:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPotensi();
  }, []);

  useEffect(() => {
    const checkMidnightRun = () => {
      const currentToday = getTodayString();
      setTanggalFilter((prev) => {
        if (prev !== currentToday && prev === getTodayString()) {
          return currentToday;
        }
        return prev;
      });
    };

    const intervalId = setInterval(checkMidnightRun, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

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

  // 🌟 SINKRONISASI ROUTE: Menembak rute /potensi-demo/form secara akurat sesuai nama folder fisik
  const handleOpenRowDetail = (item: any) => {
    const id = item.id || item.ID;
    router.push(`/potensi-demo/form?mode=edit&id=${id}`);
  };

  const filteredData = data.filter((item: any) => {
    const matchesSearch = 
      item.namaOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.picNasabah?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTanggal = item.tanggalInput === tanggalFilter;

    return matchesSearch && matchesTanggal;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 p-6 bg-[#FAF9F6] min-h-screen font-sans text-[#1C1C1E]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Data Potensi & Demo</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Monitoring parameter target dan status konversi live tim sales PT PIPOSMART DIGITAL INDONESIA.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/potensi/export"}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 text-xs shadow-sm cursor-pointer"
          >
            📥 Export Excel
          </button>
          {/* 🌟 ROUTE BUTTON FIXED */}
          <button 
            onClick={() => router.push("/potensi-demo/form?mode=create")}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#0062CC] transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Record Prospek Baru
          </button>
        </div>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Cari Brand, Owner, atau PIC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap">Rekapan Tanggal:</span>
            <input 
              type="date"
              value={tanggalFilter}
              onChange={(e) => setTanggalFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE PIPELINE */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 font-bold text-sm text-gray-400 animate-pulse">Menghubungkan ke database pipeline...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl text-gray-400 text-xs font-medium">
            📭 Tidak ada data rekapan prospek pipeline pada tanggal {formatTanggalIndo(tanggalFilter)}.
          </div>
        ) : (
          <div className="bg-white p-2 border border-gray-200/70 rounded-3xl shadow-sm">
            <DataTable columns={[
              { header: "Tanggal Input", accessor: "tanggalInput", render: (item: any) => formatTanggalIndo(item.tanggalInput) },
              { header: "PIC Sales", accessor: "picNasabah" },
              { header: "Brand Usaha", accessor: "brand", render: (item: any) => <span className="font-bold text-gray-800">{item.brand}</span> },
              { header: "Nama Owner", accessor: "namaOwner" },
              { header: "Paket Aktual", accessor: "paketAktual", render: (item: any) => item.paketAktual || "-" },
              { header: "Nominal Deal", accessor: "nominalAktual", render: (item: any) => <span className="font-black text-emerald-600">{formatRupiah(item.nominalAktual)}</span> },
              { header: "Status", accessor: "status", render: (item: any) => <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusStyle(item.status)}`}>{item.status}</span> },
            ]} initialData={filteredData} onRowClick={(item: any) => handleOpenRowDetail(item)} />
          </div>
        )}
      </div>
    </div>
  );
}