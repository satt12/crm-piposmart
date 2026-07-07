"use client";

import React, { useState, useEffect } from "react";

export default function TargetPage() {
  const [listData, setListData] = useState([]);
  const [listTargetDb, setListTargetDb] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [localTargets, setLocalTargets] = useState<Record<string, { user?: number; nominal?: number }>>({});
  const [selectedPicDetails, setSelectedPicDetails] = useState<any | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Fungsi helper tanggal hari ini
  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  // Helper mendapatkan tanggal awal bulan ini
  const getFirstDayOfMonthString = () => {
    return getTodayString().substring(0, 8) + "01";
  };

  // Filter rentang tanggal (Date Range)
  const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
  const [endDate, setEndDate] = useState(getTodayString());

  // Ekstraksi periode bulan untuk kebutuhan update (YYYY-MM)
  const selectedPeriode = startDate.substring(0, 7);

  // Helper sinkronisasi nama panggilan tim sales
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Tim Sales";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("boby") || namaKecil.includes("pak boby") || namaKecil.includes("bobbi")) return "Boby";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lidya";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  const fetchTargetData = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // 1. Ambil history penjualan
      const responsePenjualan = await fetch(`${baseUrl}/api/pipo/penjualan`);
      if (responsePenjualan.ok) {
        const result = await responsePenjualan.json();
        const dataPenjualanMurni = Array.isArray(result) ? result : result.data || [];
        setListData(dataPenjualanMurni);
      }

      // 2. Ambil target database kustom berdasarkan range tanggal
      const resTarget = await fetch(`${baseUrl}/api/pipo/target?start_date=${startDate}&end_date=${endDate}`);
      if (resTarget.ok) {
        const resultTarget = await resTarget.json();
        const dataTargetMurni = Array.isArray(resultTarget) ? resultTarget : resultTarget.data || [];
        setListTargetDb(dataTargetMurni);
      }
    } catch (err) {
      console.error("Gagal mengambil sinkronisasi data target rentang tanggal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetData();
  }, [startDate, endDate]);

  // Filter data transaksi penjualan lapangan yang murni masuk ke dalam range kalender
  const dataBulanTerpilih = listData.filter((item: any) => {
    if (!item.tanggal) return false;
    const itemDate = item.tanggal.substring(0, 10);
    return itemDate >= startDate && itemDate <= endDate;
  });

  // AGREGASI MAP PER PIC SALES
  const targetPicMap = dataBulanTerpilih.reduce((acc: Record<string, any>, curr: any) => {
    const pic = dapatkanNamaPanggilan(curr.pic_team || curr.picTeam || "");
    if (!pic) return acc; 

    if (!acc[pic]) {
      const targetDbMatch = listTargetDb.find(
        (t: any) => dapatkanNamaPanggilan(t.pic_team || t.picTeam || "").toLowerCase().trim() === pic.toLowerCase().trim()
      );

      const keySimpan = `${selectedPeriode}-${pic}`;
      const userLokal = localTargets[keySimpan]?.user;
      const nominalLokal = localTargets[keySimpan]?.nominal;

      const targetUserDb = targetDbMatch?.target_nasabah ?? targetDbMatch?.targetNasabah;
      const targetNominalDb = targetDbMatch?.target_penjualan ?? targetDbMatch?.targetPenjualan;

      acc[pic] = {
        name: pic,
        paketLangganan: curr.nama_paket || curr.namaPaket || "Pro",
        targetUser: userLokal ?? targetUserDb ?? (curr.target_nasabah || curr.targetNasabah || 11), 
        targetNominal: nominalLokal ?? targetNominalDb ?? (curr.target_penjualan || curr.targetPenjualan || 14362000), 
        realisasiUser: 0,
        realisasiOmset: 0,
      };
    }

    acc[pic].realisasiUser += curr.jumlah_nasabah || curr.jumlahNasabah || 1;

    const nominalOmset = typeof curr.total_penjualan === "string" 
      ? Number(curr.total_penjualan.replace(/[^0-9]/g, "")) 
      : Number(curr.total_penjualan) || 0;

    acc[pic].realisasiOmset += nominalOmset;
    return acc;
  }, {});

  const dataTargetFinal = Object.values(targetPicMap);

  const totalTargetUser = dataTargetFinal.reduce((sum, item: any) => sum + item.targetUser, 0);
  const totalTargetNominal = dataTargetFinal.reduce((sum, item: any) => sum + item.targetNominal, 0);
  const totalRealisasiUser = dataTargetFinal.reduce((sum, item: any) => sum + item.realisasiUser, 0);
  const totalRealisasiOmset = dataTargetFinal.reduce((sum, item: any) => sum + item.realisasiOmset, 0);

  const totalKekuranganUser = Math.max(0, totalTargetUser - totalRealisasiUser);
  const totalKekuranganOmset = Math.max(0, totalTargetNominal - totalRealisasiOmset);

  const pctKekuranganUser = totalTargetUser > 0 ? Math.round((totalKekuranganUser / totalTargetUser) * 100) : 100;
  const pctKekuranganOmset = totalTargetNominal > 0 ? Math.round((totalKekuranganOmset / totalTargetNominal) * 100) : 100;

  const handlePicClick = (picName: string) => {
    const rawStories = dataBulanTerpilih.filter((item: any) => dapatkanNamaPanggilan(item.pic_team || item.picTeam || "") === picName);
    setSelectedPicDetails({ picName, stories: rawStories });
  };

  const formatHtmlTanggal = (tglStr: string) => {
    if (!tglStr || !tglStr.includes("-")) return tglStr;
    const [year, month, day] = tglStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatRupiahSakti = (val: any) => {
    if (val === undefined || val === null) return "Rp 0";
    const angkaMurni = typeof val === "string" ? Number(val.replace(/[^0-9]/g, "")) : Number(val);
    return `Rp ${angkaMurni.toLocaleString("id-ID")}`;
  };

  const handleSaveInlineTarget = async (picName: string, fieldType: "user" | "nominal", newValue: number) => {
    const currentItem = targetPicMap[picName];
    if (!currentItem) return;

    const keySimpan = `${selectedPeriode}-${picName}`;

    setLocalTargets((prev) => ({
      ...prev,
      [keySimpan]: {
        ...prev[keySimpan],
        [fieldType]: newValue
      }
    }));

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const payload = {
        periode_bulan: selectedPeriode + "-01",
        pic_team: picName,
        paket_langganan: currentItem.paketLangganan, 
        target_nasabah: fieldType === "user" ? newValue : currentItem.targetUser,
        target_penjualan: fieldType === "nominal" ? newValue : currentItem.targetNominal
      };

      const response = await fetch(`${baseUrl}/api/pipo/target/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchTargetData();
      }
    } catch (err) {
      console.error("Gagal mengunci konfigurasi target baru ke database:", err);
    }
  };

  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 font-sans text-[#1D1D1F] relative min-h-screen bg-[#F5F5F7]">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">Performance Target Range Tanggal</h1>
          <p className="text-xs text-[#86868B] mt-1 font-medium">Ubah filter kalender di samping untuk menganalisis pencapaian target pada range hari tertentu.</p>
        </div>
        
        {/* INPUT FILTER RENTANG TANGGAL */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase">Dari:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase bg-white p-1 rounded-lg border border-gray-200" />
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase">Sampai:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold text-gray-700 focus:outline-none cursor-pointer uppercase bg-white p-1 rounded-lg border border-gray-200" />
          </div>
        </div>
      </div>

      {/* TAMPILAN DATA TABEL */}
      {loading ? (
        <div className="text-center py-24 text-sm text-gray-400 font-bold animate-pulse">Mengkalkulasi parameter range target...</div>
      ) : dataTargetFinal.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center py-28 px-4 text-center min-h-[350px]">
          <span className="text-4xl mb-4 select-none">📬</span>
          <h3 className="text-sm font-bold text-gray-700 mt-2">Riwayat Range Kosong</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm text-center font-medium">
            Tidak ada aktivitas closing transaksi penjualan dalam rentang <span className="font-bold text-blue-600">{formatHtmlTanggal(startDate)}</span> s/d <span className="font-bold text-blue-600">{formatHtmlTanggal(endDate)}</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-[#E5E5EA] rounded-2xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[#E5E5EA] text-left text-sm font-bold">
            {/* 🌟 FIXED: Penyelarasan Sub-Header agar sesuai dengan susunan kolom utama */}
            <thead className="bg-[#F2F2F7] text-gray-500 uppercase tracking-wider text-xs">
              <tr>
                <th rowSpan={2} className="px-6 py-4 border-b border-r">Pic Team Hunter</th>
                <th colSpan={2} className="px-6 py-2 border-b border-r text-center bg-amber-50 text-amber-900">Target Operational</th>
                <th colSpan={2} className="px-6 py-2 border-b border-r text-center">Realisasi Rentang Hari</th>
                <th colSpan={2} className="px-6 py-2 border-b text-center">Kekurangan</th>
              </tr>
              <tr className="text-[11px]">
                <th className="px-6 py-2 border-b border-r text-center bg-amber-100/60 text-amber-900">User 📝</th>
                <th className="px-6 py-2 border-b border-r text-center bg-amber-100/60 text-amber-900">Nominal 📝</th>
                <th className="px-6 py-2 border-b border-r text-center bg-[#E5E5EA]/50">User</th>
                <th className="px-6 py-2 border-b border-r text-center bg-[#E5E5EA]/50">Omset</th>
                <th className="px-6 py-2 border-b border-r text-center bg-[#E5E5EA]/50">User</th>
                <th className="px-6 py-2 border-b text-center bg-[#E5E5EA]/50">Omset</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#E5E5EA] text-[#1D1D1F]">
              {dataTargetFinal.map((item: any, index) => {
                const kurangUser = Math.max(0, item.targetUser - item.realisasiUser);
                const kurangOmset = Math.max(0, item.targetNominal - item.realisasiOmset);
                const keyUser = `user-${item.name}`;
                const keyNominal = `nominal-${item.name}`;
                
                return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Kolom 1: Nama PIC */}
                    <td className="px-6 py-4 border-r whitespace-nowrap">
                      <button onClick={() => handlePicClick(item.name)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#007AFF] hover:text-white transition shadow-sm border border-blue-100 flex items-center gap-1.5 cursor-pointer">
                        <span>👤</span> {item.name}    <span className="text-[9px] opacity-60">ℹ️ Detail</span>
                      </button>
                    </td>

                    {/* Kolom 2: Target User */}
                    <td className="px-6 py-4 border-r text-center font-black bg-amber-50/20">
                      {editingKey === keyUser ? (
                        <input 
                          type="number"
                          defaultValue={item.targetUser}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            handleSaveInlineTarget(item.name, "user", val);
                            setEditingKey(null);
                          }}
                          onKeyDown={handleKeyDownEnter}
                          autoFocus
                          className="w-16 text-center border border-gray-300 rounded outline-none p-0.5 font-bold text-sm bg-white"
                        />
                      ) : (
                        <span onClick={() => setEditingKey(keyUser)} className="cursor-pointer hover:underline border-b border-dashed border-amber-500 px-2 py-0.5 rounded bg-amber-100/40 text-amber-900">
                          {item.targetUser}
                        </span>
                      )}
                    </td>

                    {/* Kolom 3: Target Nominal */}
                    <td className="px-6 py-4 border-r text-center font-black bg-amber-50/20">
                      {editingKey === keyNominal ? (
                        <input 
                          type="number"
                          defaultValue={item.targetNominal}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            handleSaveInlineTarget(item.name, "nominal", val);
                            setEditingKey(null);
                          }}
                          onKeyDown={handleKeyDownEnter}
                          autoFocus
                          className="w-28 text-center border border-gray-300 rounded outline-none p-0.5 font-bold text-sm bg-white"
                        />
                      ) : (
                        <span onClick={() => setEditingKey(keyNominal)} className="cursor-pointer hover:underline border-b border-dashed border-amber-500 px-2 py-0.5 rounded bg-amber-100/40 text-amber-900">
                          Rp {item.targetNominal.toLocaleString("id-ID")}
                        </span>
                      )}
                    </td>

                    {/* Kolom 4 & 5: Realisasi User & Omset */}
                    <td className="px-6 py-4 border-r text-center text-emerald-600 font-extrabold">{item.realisasiUser}</td>
                    <td className="px-6 py-4 border-r text-center text-emerald-600 font-extrabold">Rp {item.realisasiOmset.toLocaleString("id-ID")}</td>
                    
                    {/* Kolom 6 & 7: Kekurangan User & Omset */}
                    <td className="px-6 py-4 border-r text-center text-rose-600 font-extrabold">{kurangUser}</td>
                    <td className="px-6 py-4 text-center text-rose-600 font-extrabold">Rp {kurangOmset.toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}

              {/* BARIS TOTAL */}
              <tr className="bg-[#E5E5EA]/30 font-black text-[#1D1D1F]">
                <td className="px-6 py-4 border-r text-blue-900">Total Pencapaian</td>
                <td className="px-6 py-4 border-r text-center text-blue-900">{totalTargetUser}</td>
                <td className="px-6 py-4 border-r text-center text-blue-900">Rp {totalTargetNominal.toLocaleString("id-ID")}</td>
                <td className="px-6 py-4 border-r text-center text-emerald-700">{totalRealisasiUser}</td>
                <td className="px-6 py-4 border-r text-center text-emerald-700">Rp {totalRealisasiOmset.toLocaleString("id-ID")}</td>
                <td className="px-6 py-4 border-r text-center text-rose-600">{totalKekuranganUser}</td>
                <td className="px-6 py-4 text-center text-rose-600">Rp {totalKekuranganOmset.toLocaleString("id-ID")}</td>
              </tr>

              {/* BARIS PERSENTASE */}
              <tr className="bg-blue-50/40 font-black text-blue-700 text-xs">
                <td className="px-6 py-4 border-r uppercase tracking-wider">Total Kekurangan [%]</td>
                <td className="px-6 py-4 border-r text-center">{pctKekuranganUser}%</td>
                <td className="px-6 py-4 border-r text-center">{pctKekuranganOmset}%</td>
                <td className="px-6 py-4 border-r text-center">{100 - pctKekuranganUser}%</td>
                <td className="px-6 py-4 border-r text-center">{100 - pctKekuranganOmset}%</td>
                <td className="px-6 py-4 border-r text-center">{pctKekuranganUser}%</td>
                <td className="px-6 py-4 text-center">{pctKekuranganOmset}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL STORY MODAL POP-UP */}
      {selectedPicDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-[10px] bg-blue-100 text-[#007AFF] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Activity Story</span>
                <h2 className="text-xl font-black text-gray-900 mt-1 tracking-tight">👤 {selectedPicDetails.picName}</h2>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Riwayat closing riil rentang {formatHtmlTanggal(startDate)} s/d {formatHtmlTanggal(endDate)}</p>
              </div>
              <button onClick={() => setSelectedPicDetails(null)} className="text-gray-400 hover:text-black p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer">✕ Tutup</button>
            </div>

            <div className="mt-4 space-y-3.5 overflow-y-auto py-2 flex-1 pr-1">
              {selectedPicDetails.stories.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-400 font-medium border border-dashed rounded-2xl bg-gray-50/50">Tidak ada detail record closing individu pada range hari ini.</div>
              ) : (
                selectedPicDetails.stories.map((story: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-blue-400 transition-all duration-150">
                    <div className="absolute left-0 inset-y-0 w-1 bg-[#007AFF]" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Nama Owner Terdaftar</span>
                        <h4 className="text-sm font-black text-gray-800 tracking-tight">
                          {story.nama_owner || story.nama_nasabah || "Nasabah Pipo"}
                        </h4>
                        <div className="text-[10px] text-gray-400 font-semibold space-y-0.5 mt-1">
                          <p>🏬 Brand: {story.nama_brand || "-"}</p>
                          <p>📍 Outlet: {story.nama_outlet || "-"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-md">+{story.jumlah_nasabah || 1} User</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] font-semibold">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Total Penjualan</span>
                        <span className="text-[#007AFF] font-black">{formatRupiahSakti(story.total_penjualan)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 block text-[9px] uppercase">Tanggal Closing</span>
                        <span className="text-gray-600 font-bold">{formatHtmlTanggal(story.tanggal?.substring(0, 10))}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}