"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface PenjualanItem {
  id: number;
  tanggal: string;
  pic_team: string;
  nama_paket: string;
  tipe_harga: string;
  harga_satuan: number;
  jumlah_nasabah: number;
  total_penjualan: number;
  tenor: string;
  periode_bulan: string;
  target_nasabah: number;
  target_penjualan: number;
}

const WARNA_PIE = ["#0071E3", "#34C759", "#FF9500", "#AF52DE"];
const KATEGORI_PACKET = ["Basic", "Business", "Pro", "Bundling & Alat"];

const DATA_PACKET_MASTER: Record<string, string[]> = {
  "Basic": ["24 Bulan Basic", "18 Bulan Basic", "12 Bulan Basic", "9 Bulan Basic", "1 Bulan Basic"],
  "Business": ["24 Bulan Business", "18 Bulan Business", "12 Bulan Business", "9 Bulan Business", "6 Bulan Business", "1 Bulan Business"],
  "Pro": ["24 Bulan Pro", "18 Bulan Pro", "12 Bulan Pro", "9 Bulan Pro", "6 Bulan Pro", "1 Bulan Pro"],
  "Bundling & Alat": ["Paket Starter Pro (JAGOAN PRO)", "POS Bundle Pro", "Jagoan Business", "POS Bundle Business"],
};

const PAKET_REVERSE_LOOKUP: Record<string, string> = {};
Object.entries(DATA_PACKET_MASTER).forEach(([kategori, listPromo]) => {
  listPromo.forEach((namaPromo) => {
    PAKET_REVERSE_LOOKUP[namaPromo.trim().toLowerCase()] = kategori;
  });
});

function normalisasiNamaPaket(raw: string | undefined | null): string {
  if (!raw || raw.trim() === "") return "Lainnya";
  const val = raw.trim().toLowerCase();

  if (PAKET_REVERSE_LOOKUP[val]) return PAKET_REVERSE_LOOKUP[val];

  if (val.includes("bundl") || val.includes("jagoan") || val.includes("pos bundle") || val.includes("alat")) return "Bundling & Alat";
  if (val.includes("pro")) return "Pro";
  if (val.includes("bisnis") || val.includes("business")) return "Business";
  if (val.includes("basic")) return "Basic";

  return "Lainnya";
}

export default function DashboardOverview() {
  const [totalDataKelolaan, setTotalDataKelolaan] = useState<string>("Loading...");
  const [totalKelolaanMitra, setTotalKelolaanMitra] = useState<string>("Loading...");

  const [sales, setSales] = useState<PenjualanItem[]>([]);
  const [bulanDipilih, setBulanDipilih] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });
  const [loadingCharts, setLoadingCharts] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [loggedInUser, setLoggedInUser] = useState<string>("Satria");
  const [userRole, setUserRole] = useState<string>("Sales");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🌟 HELPER PENAMAAN SINKRON: Ditambahkan toleransi string untuk mendeteksi Pak Boby
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Tim Sales";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("boby") || namaKecil.includes("bobbi") || namaKecil.includes("bobbie")) return "Boby";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  // AMAN SSR: Menentukan tingkatan hak akses role (Satria & Boby otomatis dideklarasikan sebagai ADMIN)
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
        // 🔒 SISTEM OTENTIKASI BARU: Satria & Boby memegang kontrol Admin, selain itu diposisikan sebagai Sales
        const namaBersih = panggilan.toLowerCase();
        if (namaBersih === "satria" || namaBersih === "boby") {
          setUserRole("Admin");
        } else {
          setUserRole("Sales");
        }
      }
    }
  }, []);

  // 1. Mengambil data agregat summary cards (DIFILTER BERDASARKAN BULAN AKTIF & PROTEKSI PIC)
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      try {
        const isUserAdmin = userRole.toLowerCase() === "admin";

        const resLama = await fetch(`${baseUrl}/api/kelolaan-mitra`);
        if (resLama.ok) {
          const dataLama = await resLama.json();
          const filteredLama = (dataLama || []).filter((item: any) => {
            const tgl = item.tanggalInput || item.tanggal_input || item.tanggalFu || item.createdAt;
            const matchesBulan = tgl && tgl.startsWith(bulanDipilih);
            
            const itemPic = dapatkanNamaPanggilan(item.picNasabah || item.pic || "");
            const matchesPic = isUserAdmin || itemPic.toLowerCase() === loggedInUser.toLowerCase();
            
            return matchesBulan && matchesPic;
          });
          setTotalDataKelolaan(`${filteredLama.length} Akun`);
        } else {
          setTotalDataKelolaan("0 Akun");
        }

        const resBaru = await fetch(`${baseUrl}/api/list-mitra`);
        if (resBaru.ok) {
          const dataBaru = await resBaru.json();
          const filteredBaru = (dataBaru || []).filter((item: any) => {
            const tgl = item.createdAt || item.tanggalInput;
            const matchesBulan = tgl && tgl.startsWith(bulanDipilih);
            
            const itemPic = dapatkanNamaPanggilan(item.picNasabah || item.pic || "");
            const matchesPic = isUserAdmin || itemPic.toLowerCase() === loggedInUser.toLowerCase();

            return matchesBulan && matchesPic;
          });
          setTotalKelolaanMitra(`${filteredBaru.length} Record`);
        } else {
          setTotalKelolaanMitra("0 Record");
        }
      } catch (error) {
        console.error("Gagal terhubung ke API Stats Backend:", error);
        setTotalDataKelolaan("Offline");
        setTotalKelolaanMitra("Offline");
      }
    };

    if (isMounted) {
      fetchDashboardStats();
    }
  }, [bulanDipilih, loggedInUser, userRole, isMounted]);

  // 2. Fetch live data transaksi penjualan harian
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoadingCharts(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      try {
        const response = await fetch(`${baseUrl}/api/pipo/penjualan`);
        if (response.ok) {
          const result = await response.json();
          const rawList = result.data || result || [];

          const normalized: PenjualanItem[] = rawList.map((item: any) => ({
            id: item.id,
            tanggal: item.tanggal ?? item.tanggal_transaksi ?? item.date ?? "",
            pic_team: dapatkanNamaPanggilan(item.pic_team ?? item.picTeam ?? item.picNasabah ?? "Tim Sales"),
            nama_paket: item.target_paket ?? item.targetPaket ?? item.nama_paket ?? item.namaPaket ?? item.paket ?? "",
            tipe_harga: item.tipe_harga ?? item.tipeHarga ?? "",
            harga_satuan: Number(item.harga_satuan ?? item.hargaSatuan ?? 0),
            jumlah_nasabah: Number(item.jumlah_nasabah ?? item.jumlahNasabah ?? 0),
            total_penjualan: Number(item.total_penjualan ?? item.nominalAktual ?? item.totalPenjualan ?? 0),
            tenor: item.tenor ?? "",
            periode_bulan: item.periode_bulan ?? item.periodeBulan ?? "",
            target_nasabah: Number(item.target_nasabah ?? item.targetNasabah ?? 0),
            target_penjualan: Number(item.target_penjualan ?? item.targetNominal ?? item.targetPenjualan ?? 0),
          }));

          setSales(normalized);
        }
      } catch (error) {
        console.error("Gagal memuat data grafik dashboard:", error);
      } finally {
        setLoadingCharts(false);
      }
    };

    if (isMounted) {
      fetchSalesData();
    }
  }, [bulanDipilih, isMounted]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const filteredSales = sales.filter((item) => {
    if (!item.tanggal) return false;
    const itemBulan = item.tanggal.substring(0, 7); 
    const matchesBulan = itemBulan === bulanDipilih;

    const isUserAdmin = userRole.toLowerCase() === "admin";
    const isPicIdentik = item.pic_team.toLowerCase() === loggedInUser.toLowerCase() || item.pic_team.toLowerCase().substring(0, 4) === loggedInUser.toLowerCase().substring(0, 4);
    const matchesRoleAkses = isUserAdmin || isPicIdentik;

    return matchesBulan && matchesRoleAkses;
  });

  const rekapPerPic = filteredSales.reduce((acc: any, curr) => {
    const pic = curr.pic_team || "Tim Sales";
    if (!acc[pic]) {
      acc[pic] = { name: pic, Target: 0, Realisasi: 0 };
    }
    acc[pic].Target = curr.target_penjualan || 14362000; 
    acc[pic].Realisasi += curr.total_penjualan || 0;
    return acc;
  }, {});
  const dataGrafikBar = Object.values(rekapPerPic);

  const rekapPerPaketMap: Record<string, number> = {};
  KATEGORI_PACKET.forEach((kategori) => {
    rekapPerPaketMap[kategori] = 0;
  });

  filteredSales.forEach((curr) => {
    if (curr.total_penjualan > 0) {
      const kategori = normalisasiNamaPaket(curr.nama_paket);
      if (!(kategori in rekapPerPaketMap)) {
        rekapPerPaketMap[kategori] = 0; 
      }
      rekapPerPaketMap[kategori] += curr.total_penjualan;
    }
  });

  const dataGrafikPie = Object.entries(rekapPerPaketMap)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const totalTargetNominal = dataGrafikBar.reduce((sum: number, item: any) => sum + item.Target, 0);
  const totalRealisasiOmset = filteredSales.reduce((sum, item) => sum + item.total_penjualan, 0);
  const pctOmsetTercapai = totalTargetNominal > 0 ? Math.round((totalRealisasiOmset / totalTargetNominal) * 100) : 0;

  const handleExportChartData = () => {
    if (filteredSales.length === 0) {
      alert("Tidak ada data transaksi analitik yang tersedia untuk diekspor pada bulan ini.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "--- PERFORMANCE CAPAIAN TIM SALES ---\n";
    csvContent += "Nama Sales,Target Capaian (IDR),Realisasi Omset (IDR),Persentase Gol (%)\n";
    dataGrafikBar.forEach((row: any) => {
      const gol = row.Target > 0 ? Math.round((row.Realisasi / row.Target) * 100) : 0;
      csvContent += `"${row.name}",${row.Target},${row.Realisasi},${gol}%\n`;
    });

    csvContent += "\n";
    csvContent += "--- DISTRIBUSI PENJUALAN PAKET PRODUK ---\n";
    csvContent += "Kategori Paket,Total Omset Terjual (IDR)\n";
    dataGrafikPie.forEach((row: any) => {
      csvContent += `"${row.name}",${row.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analitik_CRM_Piposmart_${bulanDipilih}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { name: "Data Kelolaan (Profil)", value: totalDataKelolaan, change: "Bank & Email Log", href: "/data-kelolaan" },
    { name: "Kelolaan Mitra (Referral)", value: totalKelolaanMitra, change: "Anak Outlet Tracker", href: "/kelolaan-mitra" },
    { name: "Total Realisasi Omset", value: formatRupiah(totalRealisasiOmset), change: `${pctOmsetTercapai}% Target Gol`, href: "/target" },
    { name: "Realisasi User Bulan Ini", value: `${filteredSales.length} Closing`, change: "Transaksi Aktif", href: "/penjualan" },
  ];

  const quickActions = [
    { title: "Data Kelolaan Utama", desc: "Pantau database profil, kualifikasi bank, wilayah, and email legalitas mitra.", href: "/data-kelolaan", color: "bg-gray-100 text-gray-700" },
    { title: "Kelolaan Kemitraan (Referral)", desc: "Monitoring integrasi referral, paket langganan anak outlet, and status follow-up.", href: "/kelolaan-mitra", color: "bg-blue-50 text-blue-600" },
    { title: "Input Penjualan Harian", desc: "Catat closingan paket (Basic, Business, Pro, Bundling & Alat) dengan otomasi hitung tenor.", href: "/penjualan", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-9 py-4 px-2">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E5E5EA] pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">CRM Pusat Kontrol</h1>
          <p className="text-sm text-[#86868B] mt-2 font-medium">
            PT. PIPOSMART DIGITAL INDONESIA • Panel Kendali Aktivitas Kemitraan & Performa Bisnis.
          </p>
          <div className="text-xs text-gray-400 font-bold mt-1">
            Logged in: <span className="text-[#007AFF]">👤 {loggedInUser} ({userRole})</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={handleExportChartData}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-[#E5E5EA] rounded-xl hover:bg-gray-50 shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            📥 Export Analitik Excel
          </button>

          <div className="bg-white border border-[#E5E5EA] shadow-sm rounded-xl p-1.5 flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase px-1">Periode:</span>
            <input 
              type="month" 
              className="font-bold text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              value={bulanDipilih}
              onChange={(e) => setBulanDipilih(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Link href={item.href} key={item.name} className="block group">
            <div className="relative overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#AEAEB2] active:scale-[0.99] h-full flex flex-col justify-between">
              <dt className="truncate text-sm font-semibold text-[#86868B] uppercase tracking-wider">{item.name}</dt>
              <dd className="mt-3 flex flex-col items-start md:flex-row md:items-baseline md:justify-between gap-2">
                <span className="text-2xl font-bold tracking-tight text-[#1D1D1F] group-hover:text-blue-600 transition-colors break-words">
                  {item.value}
                </span>
                <span className="text-xs font-semibold bg-[#F2F2F7] text-[#555559] px-2 py-1 rounded-md whitespace-nowrap">
                  {item.change}
                </span>
              </dd>
            </div>
          </Link>
        ))}
      </div>

      {/* SEKSI INTERAKTIF: ANALISIS GRAFIK PERFORMA */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1D1D1F]">Analitik Capaian Realisasi Bulanan</h2>
        {loadingCharts ? (
          <div className="p-12 text-center text-gray-400 font-bold bg-white border rounded-2xl shadow-sm">Mengkalkulasi matriks grafik...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grafik Batang Perbandingan Capaian Sales */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col min-w-0">
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900">Performance Capaian Per Sales</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Analisis perolehan omset rupiah masing-masing personil tim sales</p>
              </div>
              <div className="w-full h-72 mt-auto">
                {dataGrafikBar.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Tidak ada data transaksi closing pada periode ini.</div>
                ) : (
                  isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataGrafikBar} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                        <Tooltip formatter={(value) => formatRupiah(value as number)} contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #E5E5EA" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Bar dataKey="Target" fill="#E5E5EA" radius={[5, 5, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Realisasi" fill="#0071E3" radius={[5, 5, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
            </div>

            {/* Grafik Donat Distribusi Paket */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
              <div className="mb-2">
                <h3 className="text-base font-bold text-gray-900">Distribusi Penjualan Paket</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Segmentasi Basic, Business, Pro & Bundling/Alat</p>
              </div>
              <div className="w-full h-52 my-auto flex items-center justify-center relative">
                {dataGrafikPie.length === 0 ? (
                  <div className="text-gray-400 text-sm italic">Belum ada paket closing nasabah.</div>
                ) : (
                  isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataGrafikPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dataGrafikPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={WARNA_PIE[index % WARNA_PIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500 pt-3 border-t max-h-20 overflow-y-auto">
                {dataGrafikPie.map((item: any, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: WARNA_PIE[idx % WARNA_PIE.length] }}></span>
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Quick Access Menu Navigasi */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1D1D1F]">Akses Cepat Menu Navigasi</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link href={action.href} key={action.title} className="block group">
              <div className="h-full border border-[#E5E5EA] rounded-2xl p-5 bg-white shadow-sm hover:border-[#1D1D1F] transition-all flex flex-col justify-between">
                <div>
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center font-bold text-lg mb-4`}>
                    →
                  </div>
                  <h3 className="font-bold text-[#1D1D1F] group-hover:text-blue-600 transition-colors">{action.title}</h3>
                  <p className="text-sm text-[#86868B] mt-1 leading-relaxed">{action.desc}</p>
                </div>
                <div className="mt-4 text-xs font-bold text-[#1D1D1F] inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Buka Halaman <span className="ml-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}