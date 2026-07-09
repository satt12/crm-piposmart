"use client";

import React, { useState, useEffect } from "react";
import TargetSalesTable from "../components/TargetSalesTable";

export default function TargetPage() {
  const [listData, setListData] = useState([]);
  const [listTargetDb, setListTargetDb] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [localTargets, setLocalTargets] = useState<Record<string, { user?: number; nominal?: number }>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempNominalValue, setTempNominalValue] = useState("");

  // STATE: Dropdown filter mingguan (All = Total Keseluruhan)
  const [filterMingguan, setFilterMingguan] = useState<"All" | 1 | 2 | 3 | 4>("All");

  // STATE: Untuk mengontrol Modal Pop-up cek data PIC
  const [selectedPicData, setSelectedPicData] = useState<{ name: string; transactions: any[] } | null>(null);

  const getTargetMonthString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 7); // Format: YYYY-MM
  };

  // Filter bulan tunggal aktif
  const [bulanFilter, setBulanFilter] = useState(getTargetMonthString());

  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Tim Sales";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("boby") || namaKecil.includes("pak boby") || namaKecil.includes("bobbi")) return "Boby";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lidya";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  const formatRibuanIndo = (nilai: number | string) => {
    if (nilai === undefined || nilai === null || nilai === "") return "";
    const angkaMurni = String(nilai).replace(/\D/g, "");
    if (!angkaMurni) return "";
    return new Intl.NumberFormat("id-ID").format(Number(angkaMurni));
  };

  // 🌟 UTILITY BARU: Memformat Tanggal & Waktu Input secara presisi (DD MMMM YYYY • HH:mm WIB)
  const formatTanggalWaktuLengkap = (tanggalMentah: string, createdAtMentah?: string) => {
    // Gunakan created_at / timestamp input jika tersedia, jika tidak ada gunakan fallback string tanggal biasa
    const targetWaktu = createdAtMentah || tanggalMentah;
    if (!targetWaktu) return "-";

    try {
      const dateObj = new Date(targetWaktu);
      
      // Validasi apakah string tanggal valid
      if (isNaN(dateObj.getTime())) return tanggalMentah;

      // Format Tanggal: DD MMMM YYYY
      const opsiTanggal: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
      const tanggalFormat = new Intl.DateTimeFormat("id-ID", opsiTanggal).format(dateObj);

      // Format Waktu: HH:mm
      const opsiWaktu: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
      const waktuFormat = new Intl.DateTimeFormat("id-ID", opsiWaktu).format(dateObj);

      // Jika input tanggal mentah tidak memiliki jam (panjang karakter pendek seperti YYYY-MM-DD), sembunyikan jamnya
      if (targetWaktu.length <= 10 && !createdAtMentah) {
        return tanggalFormat;
      }

      return `${tanggalFormat} • ${waktuFormat} WIB`;
    } catch (e) {
      return tanggalMentah;
    }
  };

  const fetchTargetData = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      const responsePenjualan = await fetch(`${baseUrl}/api/pipo/penjualan`);
      if (responsePenjualan.ok) {
        const result = await responsePenjualan.json();
        setListData(Array.isArray(result) ? result : result.data || []);
      }

      const resTarget = await fetch(`${baseUrl}/api/pipo/target?periode_bulan=${bulanFilter}`);
      if (resTarget.ok) {
        const resultTarget = await resTarget.json();
        setListTargetDb(Array.isArray(resultTarget) ? resultTarget : resultTarget.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data target bulanan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetData();
  }, [bulanFilter]);

  // Filter data transaksi berdasarkan kecocokan bulan aktif
  const dataBulanTerpilih = listData.filter((item: any) => {
    if (!item.tanggal) return false;
    return item.tanggal.substring(0, 7) === bulanFilter;
  });

  // Logika membedah data transaksi per minggu
  const hitungDataMingguanPerPic = (transaksiListPic: any[], mingguKe: number) => {
    let user = 0;
    let omset = 0;
    
    if (Array.isArray(transaksiListPic)) {
      transaksiListPic.forEach(item => {
        if (!item.tanggal) return;
        const hari = new Date(item.tanggal).getDate();
        let matches = false;
        if (mingguKe === 1 && hari >= 1 && hari <= 7) matches = true;
        if (mingguKe === 2 && hari >= 8 && hari <= 14) matches = true;
        if (mingguKe === 3 && hari >= 15 && hari <= 21) matches = true;
        if (mingguKe === 4 && hari >= 22) matches = true;

        if (matches) {
          user += Number(item.jumlah_nasabah || 1);
          const nominal = typeof item.total_penjualan === "string" ? Number(item.total_penjualan.replace(/\D/g, "")) : Number(item.total_penjualan) || 0;
          omset += nominal;
        }
      });
    }
    return { user, omset };
  };

  const dapatkanStyleWarnaTeksStatus = (persentase: number) => {
    if (persentase >= 100) return "text-[#2E9D52] font-black";
    if (persentase >= 70) return "text-[#FFB938] font-black";
    if (persentase >= 50) return "text-[#D23D33] font-black";
    return "text-gray-950 font-black";
  };

  // Update mendapatkan style label keterangan peforama
  const dapatkanStyleJudulPeforma = (persentase: number) => {
    if (persentase >= 100) return "bg-green-700 text-green-200";
    if (persentase >= 70) return "bg-yellow-700 text-yellow-200";
    if (persentase >= 50) return "bg-red-700 text-red-100";
    return "bg-gray-700 text-gray-200";
  };

  const dapatkanTeksPenilaian = (persentase: number) => {
    if (persentase >= 100) return "Hijau";
    if (persentase >= 70) return "Kuning";
    if (persentase >= 50) return "Merah";
    return "Hitam";
  };

  // Update, Membuat fungsi untuk mendapatkan teks penilaian berdasarkan peforma
  const dapatkanJudulPenilaianPeforma = (persentse: number) => {
    if (persentse >= 100) return "Sangat Unggul";
    if (persentse >= 70) return "Posisi Aman";
    if (persentse >= 50) return "Posisi Bahaya";
    return "Sanksi Penalti";
  };

  // Update, Membuat fungsi untuk mendapatkan deskripsi penilaian berdasarkan peforma
  const dapatkanDeskripsiPenilaianPeforma = (persentse: number) => {
    if (persentse >= 100) return "Terpenuhi sempurna mencapai 100% dari akumulasi target bulanan.";
    if (persentse >= 70) return "Batas minimal pencapaian wajib menyentuh angka 70% dari Target Nominal.";
    if (persentse >= 50) return "Angka konversi tidak aman apabila pencapaian berada di kisaran 50% dari target.";
    return "Berlaku pemantauan ketat khusus apabila omset riil berada di bawah batas 30%.";
  };

  // Agregasi Map data per PIC Sales
  const targetPicMap = dataBulanTerpilih.reduce((acc: Record<string, any>, curr: any) => {
    const pic = dapatkanNamaPanggilan(curr.pic_team || curr.picTeam || "");
    if (!pic) return acc; 

    if (!acc[pic]) {
      const targetDbMatch = listTargetDb.find(
        (t: any) => dapatkanNamaPanggilan(t.pic_team || t.picTeam || "").toLowerCase().trim() === pic.toLowerCase().trim()
      );

      const userLokal = localTargets[`${bulanFilter}-${pic}`]?.user;
      const nominalLokal = localTargets[`${bulanFilter}-${pic}`]?.nominal;

      acc[pic] = {
        name: pic,
        paketLangganan: curr.nama_paket || "Pro",
        targetUser: userLokal ?? targetDbMatch?.target_nasabah ?? 11, 
        targetNominal: nominalLokal ?? targetDbMatch?.target_penjualan ?? 14362000, 
        realisasiUser: 0,
        realisasiOmset: 0,
        rawTransactions: []
      };
    }

    acc[pic].rawTransactions.push(curr);
    acc[pic].realisasiUser += curr.jumlah_nasabah || 1;
    const nominalOmset = typeof curr.total_penjualan === "string" ? Number(curr.total_penjualan.replace(/\D/g, "")) : Number(curr.total_penjualan) || 0;
    acc[pic].realisasiOmset += nominalOmset;
    return acc;
  }, {});

  const dataTargetFinal = Object.values(targetPicMap).map((item: any) => {
    return {
      ...item,
      w1: hitungDataMingguanPerPic(item.rawTransactions, 1),
      w2: hitungDataMingguanPerPic(item.rawTransactions, 2),
      w3: hitungDataMingguanPerPic(item.rawTransactions, 3),
      w4: hitungDataMingguanPerPic(item.rawTransactions, 4),
    };
  });

  const totalTargetUser = dataTargetFinal.reduce((sum, item: any) => sum + item.targetUser, 0);
  const totalTargetNominal = dataTargetFinal.reduce((sum, item: any) => sum + item.targetNominal, 0);
  const totalRealisasiUser = dataTargetFinal.reduce((sum, item: any) => sum + item.realisasiUser, 0);
  const totalRealisasiOmset = dataTargetFinal.reduce((sum, item: any) => sum + item.realisasiOmset, 0);
  
  const grandPctUser = totalTargetUser > 0 ? Math.round((totalRealisasiUser / totalTargetUser) * 100) : 0;
  const grandPctOmset = totalTargetNominal > 0 ? Math.round((totalRealisasiOmset / totalTargetNominal) * 100) : 0;

  const formatRupiahSakti = (val: any) => {
    const angkaMurni = typeof val === "string" ? Number(val.replace(/\D/g, "")) : Number(val);
    return `Rp ${angkaMurni.toLocaleString("id-ID")}`;
  };

  const handleSaveInlineTarget = async (picName: string, fieldType: "user" | "nominal", newValue: number) => {
    const currentItem = targetPicMap[picName];
    if (!currentItem) return;
    const keySimpan = `${bulanFilter}-${picName}`;
    localTargets[keySimpan] = { ...localTargets[keySimpan], [fieldType]: newValue };
    setLocalTargets({ ...localTargets });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${baseUrl}/api/pipo/target/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periode_bulan: bulanFilter + "-01",
          pic_team: picName,
          paket_langganan: currentItem.paketLangganan, 
          target_nasabah: fieldType === "user" ? newValue : currentItem.targetUser,
          target_penjualan: fieldType === "nominal" ? newValue : currentItem.targetNominal
        })
      });
      fetchTargetData();
    } catch (err) { console.error(err); }
  };

  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const dapatkanDataMingguAktif = (item: any) => {
    if (filterMingguan === 1) return item.w1;
    if (filterMingguan === 2) return item.w2;
    if (filterMingguan === 3) return item.w3;
    if (filterMingguan === 4) return item.w4;
    return { user: 0, omset: 0 };
  };

  return (
    <div className="w-full space-y-6 py-6 px-2 font-sans text-[#1D1D1F] bg-[#F5F5F7] min-h-screen">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">Performance Target Penjualan</h1>
          <p className="text-xs text-[#86868B] mt-1 font-medium">Ubah filter bulan tunggal untuk memantau perbandingan target, rekapitulasi realisasi, and status penilaian indikator.</p>
        </div>
        
        {/* FILTERS PANEL */}
        <div className="flex flex-row items-center gap-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-2 shrink-0 overflow-x-auto">
          {/* FILTER BULAN TUNGGAL */}
          <div className="flex flex-row items-center gap-2 bg-white px-3 py-1 rounded-xl border border-gray-200 shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase whitespace-nowrap">Pilih Bulan:</span>
            <input 
              type="month" 
              value={bulanFilter} 
              onChange={(e) => setBulanFilter(e.target.value)} 
              className="text-xs font-bold text-gray-700 focus:outline-none cursor-pointer" 
            />
          </div>

          {/* DROPDOWN SELECTOR MINGGUAN */}
          <div className="flex flex-row items-center gap-1.5 px-1 shrink-0">
            <span className="text-[10px] font-black text-[#007AFF] uppercase whitespace-nowrap">Tampilan Analitik:</span>
            <select 
              value={filterMingguan} 
              onChange={(e) => setFilterMingguan(e.target.value === "All" ? "All" : Number(e.target.value) as any)}
              className="text-xs font-bold text-[#007AFF] bg-white border border-blue-200 p-1 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="All">Total Keseluruhan</option>
              <option value="1">Tampilkan Week 1</option>
              <option value="2">Tampilkan Week 2</option>
              <option value="3">Tampilkan Week 3</option>
              <option value="4">Tampilkan Week 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABEL ESENSIAL SINKRON MOCKUP */}
      {loading ? (
        <div className="text-center py-24 text-sm text-gray-400 font-bold animate-pulse">Memproses penghitungan data matriks...</div>
      ) : dataTargetFinal.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center py-28 px-4 text-center min-h-[350px]">
          <span className="text-4xl mb-4 select-none">📬</span>
          <h3 className="text-sm font-bold text-gray-700 mt-2">Riwayat Bulan Kosong</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm text-center font-medium">
            Tidak ada aktivitas closing transaksi penjualan pada periode bulan <span className="font-bold text-blue-600">{bulanFilter}</span>.
          </p>
        </div>
      ) : (

        <div>
          {/* Tabel lama */}
          <div className="w-full hidden overflow-x-auto border border-[#E5E5EA] rounded-2xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-[#E5E5EA] text-center text-sm font-bold whitespace-nowrap table-auto">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[#1D1D1F]">
                  <th rowSpan={2} className="px-6 py-4 border-b border-r bg-[#F2F2F7] text-left min-w-[140px]">PIC Penjualan</th>
                  <th colSpan={2} className="px-6 py-3 border-b border-r bg-[#FFB938] text-gray-900 font-black">Target Penjualan</th>
                  <th colSpan={2} className="px-6 py-3 border-b border-r bg-[#2E9D52] text-white font-black">Total Realisasi</th>
                  <th rowSpan={2} className="px-5 py-4 border-b border-r bg-[#D23D33] text-white">Kekurangan User</th>
                  
                  {filterMingguan === "All" ? (
                    <>
                      <th rowSpan={2} className="px-5 py-3 border-b border-r bg-[#D23D33] text-white text-[10px] leading-tight min-w-[120px]">Persentase<br/>Tercapai User (%)</th>
                      <th rowSpan={2} className="px-5 py-3 border-b border-r bg-[#D23D33] text-white text-[10px] leading-tight min-w-[120px]">Persentase Target<br/>Booking (%)</th>
                      <th rowSpan={2} className="px-5 py-3 border-b border-r bg-[#D23D33] text-white text-[11px] min-w-[130px]">Penilaian Membership</th>
                      <th rowSpan={2} className="px-5 py-3 border-b bg-[#D23D33] text-white text-[11px] min-w-[120px]">Penilaian Target</th>
                    </>
                  ) : (
                    <th colSpan={2} className="px-4 py-2 border-b bg-blue-50 text-[#0071E3]">Pencapaian Week {filterMingguan}</th>
                  )}
                </tr>
                <tr className="text-[10px] bg-gray-50 uppercase text-gray-500 border-b">
                  <th className="px-4 py-2 border-r min-w-[70px]">User 📝</th>
                  <th className="px-6 py-2 border-r min-w-[130px]">Nominal Omset 📝</th>
                  <th className="px-4 py-2 border-r min-w-[70px]">User</th>
                  <th className="px-6 py-2 border-r min-w-[140px]">Omset</th>
                  {filterMingguan !== "All" && (
                    <>
                      <th className="px-3 py-2 border-r bg-blue-50/40 min-w-[60px]">User</th>
                      <th className="px-5 py-2 bg-blue-50/40 min-w-[120px]">Omset</th>
                    </>
                  )}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-[#E5E5EA] text-[#1D1D1F]">
                {dataTargetFinal.map((item: any, idx) => {
                  const mingguAktif = dapatkanDataMingguAktif(item);
                  const selisihUser = item.realisasiUser - item.targetUser;
                  
                  const pctUser = item.targetUser > 0 ? Math.round((item.realisasiUser / item.targetUser) * 100) : 0;
                  const pctOmset = item.targetNominal > 0 ? Math.round((item.realisasiOmset / item.targetNominal) * 100) : 0;

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td 
                        onClick={() => setSelectedPicData({ name: item.name, transactions: item.rawTransactions })}
                        className="px-6 py-4 border-r text-left text-[#007AFF] hover:underline font-bold bg-gray-50/30 cursor-pointer select-none"
                      >
                        👤 {item.name}
                      </td>
                      
                      {/* Input Edit Target User */}
                      <td className="px-4 py-4 border-r">
                        {editingKey === `user-${item.name}` ? (
                          <input 
                            type="number" defaultValue={item.targetUser}
                            onBlur={(e) => {
                              handleSaveInlineTarget(item.name, "user", Number(e.target.value) || 0);
                              setEditingKey(null);
                            }}
                            onKeyDown={handleKeyDownEnter} autoFocus className="w-14 text-center border outline-none font-bold text-sm bg-white"
                          />
                        ) : (
                          <span onClick={() => setEditingKey(`user-${item.name}`)} className="cursor-pointer border-b border-dashed border-gray-400 hover:text-blue-600 px-1">{item.targetUser}</span>
                        )}
                      </td>

                      {/* Input Edit Target Nominal Omset */}
                      <td className="px-6 py-4 border-r text-center">
                        {editingKey === `nominal-${item.name}` ? (
                          <input 
                            type="text" value={tempNominalValue}
                            onChange={(e) => setTempNominalValue(formatRibuanIndo(e.target.value))}
                            onBlur={() => {
                              handleSaveInlineTarget(item.name, "nominal", Number(tempNominalValue.replace(/\D/g, "")) || 0);
                              setEditingKey(null);
                            }}
                            onKeyDown={handleKeyDownEnter} autoFocus className="w-28 text-center border-2 border-[#007AFF] rounded-xl outline-none px-1 py-0.5 font-bold text-sm bg-white"
                          />
                        ) : (
                          <span onClick={() => {
                            setEditingKey(`nominal-${item.name}`);
                            setTempNominalValue(formatRibuanIndo(item.targetNominal));
                          }} className="cursor-pointer border-b border-dashed border-gray-400 hover:text-blue-600">{new Intl.NumberFormat("id-ID").format(item.targetNominal)}</span>
                        )}
                      </td>

                      <td className="px-4 py-4 border-r text-center text-gray-700">{item.realisasiUser}</td>
                      <td className="px-6 py-4 border-r text-center text-gray-700">{formatRupiahSakti(item.realisasiOmset)}</td>

                      <td className={`px-4 py-4 border-r text-center font-semibold ${selisihUser < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {selisihUser}
                      </td>

                      {filterMingguan === "All" ? (
                        <>
                          <td className="px-4 py-4 border-r text-center text-gray-700">{pctUser}%</td>
                          <td className="px-4 py-4 border-r text-center text-gray-700">{pctOmset}%</td>
                          <td className={`px-4 py-4 border-r text-center ${dapatkanStyleWarnaTeksStatus(pctUser)}`}>
                            {dapatkanTeksPenilaian(pctUser)}
                          </td>
                          <td className={`px-4 py-4 text-center ${dapatkanStyleWarnaTeksStatus(pctOmset)}`}>
                            {dapatkanTeksPenilaian(pctOmset)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-4 border-r bg-gray-50 text-gray-500 font-medium">{mingguAktif.user}</td>
                          <td className="px-4 py-4 bg-gray-50 text-gray-400 font-normal">{formatRupiahSakti(mingguAktif.omset)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* BARIS TOTAL KUMULATIF */}
                <tr className="bg-[#F2F2F7] font-black text-gray-900 border-t-2 text-sm">
                  <td className="px-6 py-4 border-r text-left">Total Kumulatif</td>
                  <td className="px-4 py-4 border-r">{totalTargetUser}</td>
                  <td className="px-6 py-4 border-r text-center">{new Intl.NumberFormat("id-ID").format(totalTargetNominal)}</td>
                  <td className="px-4 py-4 border-r text-center">{totalRealisasiUser}</td>
                  <td className="px-6 py-4 border-r text-center">{formatRupiahSakti(totalRealisasiOmset)}</td>
                  <td className="px-4 py-4 border-r text-center">{totalRealisasiUser - totalTargetUser}</td>
                  
                  {filterMingguan === "All" ? (
                    <>
                      <td className="px-4 py-4 border-r text-center">{grandPctUser}%</td>
                      <td className="px-4 py-4 border-r text-center">{grandPctOmset}%</td>
                      <td className="px-4 py-4 border-r text-center"></td>
                      <td className="px-4 py-4 text-center"></td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-4 border-r bg-gray-200/50 text-center text-blue-700">
                        {dataTargetFinal.reduce((sum: number, item: any) => sum + dapatkanDataMingguAktif(item).user, 0)}
                      </td>
                      <td className="px-4 py-4 bg-gray-200/50 text-center text-blue-700">
                        {formatRupiahSakti(dataTargetFinal.reduce((sum: number, item: any) => sum + dapatkanDataMingguAktif(item).omset, 0))}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel baru */}
          <div className="min-w-full min-h-80 overflow-x-auto border border-[#E5E5EA] rounded-2xl bg-white shadow-sm p-6">
            {dataTargetFinal.map((item: any, idx) => {
              const mingguAktif = dapatkanDataMingguAktif(item);
              const selisihUser = item.realisasiUser - item.targetUser;
              
              const pctUser = item.targetUser > 0 ? Math.round((item.realisasiUser / item.targetUser) * 100) : 0;
              const pctOmset = item.targetNominal > 0 ? Math.round((item.realisasiOmset / item.targetNominal) * 100) : 0;

              return (
                
                <div key={idx} className=" bg-gray-200 rounded-xl m-2 p-6 gap-y-4 flex flex-col border-gray-400 border-2 shadow-xl shadow-gray-200">
                  <div className="w-full h-full flex justify-between">
                    <div className="text-2xl text-gray-800 font-black">
                      {item.name}
                    </div>
                    <div className="text-2xl text-gray-600 font-thin">
                      {bulanFilter}
                    </div>                  
                  </div>

                  <div className="flex flex-row gap-x-4 w-full">
                    <div className="w-full flex flex-col gap-y-4">
                      <div className="bg-gray-500 w-full p-4 rounded-xl flex flex-col gap-y-4 border-2 border-gray-600 shadow-gray-300 shadow-lg">
                        <div className="text-xl font-bold text-gray-100 text-center">
                          Target
                        </div>
                        <hr className="border-t border-gray-200 border-2"/> 
                        <div className="flex w-full justify-between gap-x-4">
                          <div className="bg-gray-600 rounded-xl p-2 w-full flex-col gap-y-2 flex">
                            <div className="text-gray-100 font-bold text-lg w-full text-center">Target User</div>
                            <div className="w-full text-center text-gray-400">{item.targetUser}</div>
                          </div>
                          <div className="bg-gray-600 rounded-xl p-2 w-full flex-col gap-y-2 flex">
                            <div className="text-gray-100 font-bold text-lg w-full text-center">Target Nominal</div>
                            <div className="w-full text-center text-gray-400">{formatRupiahSakti(item.targetNominal)}</div>
                          </div>                    
                        </div>
                      </div>
                      <div className="flex flex-row gap-x-4 w-full justify-between">
                        <div className="bg-blue-300 border-2 border-blue-400 p-4 rounded-xl flex flex-col gap-y-4 shadow-lg shadow-gray-300 w-full">
                          <div className="text-lg font-bold text-blue-700 w-full text-center">Realisasi</div>
                          <hr className="border-t border-2 border-blue-700"/>
                          <div className="w-full flex flex-row justify-between gap-x-4">
                            <div className="p-2 rounded-lg bg-blue-500 w-full flex flex-col gap-y-2">
                              <div className="text-gray-100 font-bold text-lg w-full text-center">User</div>
                              <div className="text-gray-100 text-lg w-full text-center">{item.realisasiUser}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500 w-full flex flex-col gap-y-2">
                              <div className="text-gray-100 font-bold text-lg w-full text-center">Nominal</div>
                              <div className="text-gray-100 text-lg w-full text-center">{formatRupiahSakti(item.realisasiOmset)}</div>
                            </div>                      
                          </div>
                        </div>
                        <div className="bg-red-200 border-2 border-red-300 p-4 rounded-xl flex flex-col gap-y-4 shadow-lg shadow-gray-300 w-full">
                          <div className="text-lg font-bold text-red-500 w-full text-center">Kekurangan</div>
                          <hr className="border-t border-2 border-red-500"/>
                          <div className="w-full flex flex-row justify-between gap-x-4">
                            <div className="p-2 rounded-lg bg-red-400 w-full flex flex-col gap-y-2">
                              <div className="text-gray-100 font-bold text-lg w-full text-center">User</div>
                              <div className="text-gray-100 text-lg w-full text-center">{selisihUser * -1}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-red-400 w-full flex flex-col gap-y-2">
                              <div className="text-gray-100 font-bold text-lg w-full text-center">Nominal</div>
                              <div className="text-gray-100 text-lg w-full text-center">{formatRupiahSakti(item.targetNominal - item.realisasiOmset)}</div>
                            </div>                      
                          </div>                    
                        </div>                                      
                      </div> 
                    </div>
                    <div className="bg-orange-200 w-full p-4 rounded-xl flex flex-col gap-y-4 border-2 border-orange-400 shadow-gray-300 shadow-lg">
                      <div className="text-xl font-bold text-orange-700 text-center">
                        Peforma
                      </div>
                      <hr className="border-t border-orange-700 border-2"/> 
                      <div className="flex w-full justify-between gap-x-4">
                        <div className="bg-orange-300 rounded-xl p-2 w-full flex-col gap-y-2 flex">
                          <div className="text-orange-700 font-bold text-lg w-full text-center">Persentase Tercapai User</div>
                          <div className="w-full text-orange-500 text-4xl h-full flex items-center justify-center">{pctUser}%</div>
                        </div>
                        <div className="bg-orange-300 rounded-xl p-2 w-full flex-col gap-y-2 flex">
                          <div className="text-orange-700 font-bold text-lg w-full text-center">Persentase Target Booking</div>
                          <div className="w-full text-orange-500 text-4xl h-full flex items-center justify-center">{pctOmset}%</div>
                        </div>
                        <div className="bg-orange-300 rounded-xl p-2 w-full flex-col gap-y-2 flex items-center">
                          <div className="text-orange-700 font-bold text-lg w-full text-center">Penilaian Membership</div>
                          <div className={`w-full text-center rounded-4xl font-semibold py-2 px-3 max-w-fit ${dapatkanStyleJudulPeforma(pctUser)}`}>{dapatkanJudulPenilaianPeforma(pctUser)}</div>
                          <div className="w-full text-center text-sm px-4">{dapatkanDeskripsiPenilaianPeforma(pctUser)}</div>
                        </div>                                            
                        <div className="bg-orange-300 rounded-xl p-2 w-full flex-col gap-y-2 flex items-center">
                          <div className="text-orange-700 font-bold text-lg w-full text-center">Penilaian Target</div>
                          <div className={`w-full text-center rounded-4xl font-semibold py-2 px-3 max-w-fit ${dapatkanStyleJudulPeforma(pctUser)}`}>{dapatkanJudulPenilaianPeforma(pctOmset)}</div>
                          <div className="w-full text-center text-sm px-4">{dapatkanDeskripsiPenilaianPeforma(pctOmset)}</div>
                        </div>                    
                      </div>
                    </div>                      
                  </div>               
                </div>
              );
            })}
          </div>          
        </div>
      )}

      {/* MODAL POP-UP DETIL DENGAN FORMAT TANGGAL, BULAN, TAHUN & JAM INPUT LENGKAP */}
      {selectedPicData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Riwayat Closing Penjualan: {selectedPicData.name}</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Log audit transaksi penjualan murni periode aktif {bulanFilter}</p>
              </div>
              <button 
                onClick={() => setSelectedPicData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Isi Konten Tabel Transaksi Modal */}
            <div className="overflow-y-auto flex-1 border rounded-2xl">
              {selectedPicData.transactions.length === 0 ? (
                <div className="text-center py-12 text-xs font-bold text-gray-400">Tidak ada riwayat closing transaksi untuk PIC ini.</div>
              ) : (
                <table className="min-w-full text-center text-xs font-bold divide-y whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 uppercase">
                    <tr>
                      {/* 🌟 PENYESUAIAN HEADER: Tanggal, Bulan, Tahun & Waktu Input */}
                      <th className="px-6 py-3 text-left">Waktu & Tanggal Input Transaksi</th>
                      <th className="px-4 py-3">Nama Paket</th>
                      <th className="px-4 py-3">Jumlah Nasabah</th>
                      <th className="px-4 py-3 text-right">Total Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {selectedPicData.transactions.map((t: any, tIdx: number) => (
                      <tr key={tIdx} className="hover:bg-gray-50/60">
                        {/* 🌟 IMPLEMENTASI VALUE: Memetakan waktu input jam menit secara live */}
                        <td className="px-6 py-3 text-left font-black text-gray-900">
                          ⏱️ {formatTanggalWaktuLengkap(t.tanggal, t.created_at || t.createdAt)}
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#007AFF] border border-blue-100">{t.nama_paket || t.namaPaket || "Pro"}</span></td>
                        <td className="px-4 py-3 text-gray-600 font-semibold">{t.jumlah_nasabah || 1} User</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-black">{formatRupiahSakti(t.total_penjualan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t pt-4 mt-4 flex items-center justify-between text-xs font-black text-gray-900 bg-gray-50 p-3 rounded-xl">
              <span>Total Kontribusi PIC:</span>
              <div className="flex gap-4">
                <span className="text-gray-600">📝 {selectedPicData.transactions.reduce((s, c) => s + (c.jumlah_nasabah || 1), 0)} User</span>
                <span className="text-emerald-600">💰 {formatRupiahSakti(selectedPicData.transactions.reduce((s, c) => s + (typeof c.total_penjualan === "string" ? Number(c.total_penjualan.replace(/\D/g, "")) : Number(c.total_penjualan) || 0), 0))}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 📌 PANEL INDIKATOR BATAS AMAN OPERASIONAL — DIKUNCI JANGAN DIUBAH */}
      <div className="bg-white border border-[#E8E8ED] p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
          <span className="text-base">📌</span>
          <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wide">Catatan Batas Aman Pencapaian Operasional</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-2xl bg-emerald-50/60 border-emerald-200 flex flex-col justify-between space-y-2 group hover:shadow-sm transition-all">
            <div className="flex items-center justify-between"><span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Posisi Unggul</span><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></div>
            <div><p className="text-[11px] text-gray-500 font-medium leading-relaxed">Terpenuhi sempurna mencapai 100% dari akumulasi target bulanan.</p></div>
          </div>
          <div className="p-4 border rounded-2xl bg-amber-50/60 border-amber-200 flex flex-col justify-between space-y-2 group hover:shadow-sm transition-all">
            <div className="flex items-center justify-between"><span className="text-xs font-black text-amber-800 uppercase tracking-wider">Posisi Aman</span><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" /></div>
            <div><p className="text-[11px] text-gray-500 font-medium leading-relaxed">Batas minimal pencapaian wajib menyentuh angka 70% dari Target Nominal.</p></div>
          </div>
          <div className="p-4 border rounded-2xl bg-rose-50/60 border-rose-200 flex flex-col justify-between space-y-2 group hover:shadow-sm transition-all">
            <div className="flex items-center justify-between"><span className="text-xs font-black text-rose-800 uppercase tracking-wider">Posisi Bahaya</span><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /></div>
            <div><p className="text-[11px] text-gray-500 font-medium leading-relaxed">Angka konversi tidak aman apabila pencapaian berada di kisaran 50% dari target.</p></div>
          </div>
          <div className="p-4 border rounded-2xl bg-gray-50 border-gray-300 flex flex-col justify-between space-y-2 group hover:shadow-sm transition-all">
            <div className="flex items-center justify-between"><span className="text-xs font-black text-gray-800 uppercase tracking-wider">Sanksi Penalti</span><span className="w-2.5 h-2.5 rounded-full bg-gray-900 shadow-[0_0_8px_rgba(0,0,0,0.3)]" /></div>
            <div><p className="text-[11px] text-gray-500 font-medium leading-relaxed">Berlaku pemantauan ketat khusus apabila omset riil berada di bawah batas 30%.</p></div>
          </div>
        </div>
      </div>

    </div>
  );
}