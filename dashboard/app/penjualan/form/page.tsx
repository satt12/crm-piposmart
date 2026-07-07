"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 📦 MASTER KATALOG PAKET RESMI PIPOSMART
interface SkemaHarga {
  id_skema: string;
  nama_promo: string;
  tenor_bulan: string;
  total_penjualan: number;
}

const DATA_PACKET_MASTER: Record<string, SkemaHarga[]> = {
  "Basic": [
    { id_skema: "basic_24", nama_promo: "24 Bulan Basic", tenor_bulan: "24", total_penjualan: 1716000 },
    { id_skema: "basic_18", nama_promo: "18 Bulan Basic", tenor_bulan: "18", total_penjualan: 1398000 },
    { id_skema: "basic_12", nama_promo: "12 Bulan Basic", tenor_bulan: "12", total_penjualan: 858000 },
    { id_skema: "basic_9", nama_promo: "9 Bulan Basic", tenor_bulan: "9", total_penjualan: 702000 },
    { id_skema: "basic_1", nama_promo: "1 Bulan Basic", tenor_bulan: "1", total_penjualan: 78000 }
  ],
  "Business": [
    { id_skema: "biz_24", nama_promo: "24 Bulan Business", tenor_bulan: "24", total_penjualan: 2596000 },
    { id_skema: "biz_18", nama_promo: "18 Bulan Business", tenor_bulan: "18", total_penjualan: 1998000 },
    { id_skema: "biz_12", nama_promo: "12 Bulan Business", tenor_bulan: "12", total_penjualan: 1298000 },
    { id_skema: "biz_9", nama_promo: "9 Bulan Business", tenor_bulan: "9", total_penjualan: 998000 },
    { id_skema: "biz_6", nama_promo: "6 Bulan Business", tenor_bulan: "6", total_penjualan: 708000 },
    { id_skema: "biz_1", nama_promo: "1 Bulan Business", tenor_bulan: "1", total_penjualan: 118000 }
  ],
  "Pro": [
    { id_skema: "pro_24", nama_promo: "24 Bulan Pro", tenor_bulan: "24", total_penjualan: 3368000 },
    { id_skema: "pro_18", nama_promo: "18 Bulan Pro", tenor_bulan: "18", total_penjualan: 2688000 },
    { id_skema: "pro_12", nama_promo: "12 Bulan Pro", tenor_bulan: "12", total_penjualan: 1688000 },
    { id_skema: "pro_9", nama_promo: "9 Bulan Pro", tenor_bulan: "9", total_penjualan: 1368000 },
    { id_skema: "pro_6", nama_promo: "6 Bulan Pro", tenor_bulan: "6", total_penjualan: 1008000 },
    { id_skema: "pro_1", nama_promo: "1 Bulan Pro", tenor_bulan: "1", total_penjualan: 168000 }
  ],
  "Bundling & Alat": [
    { id_skema: "bund_starter", nama_promo: "Paket Starter Pro (JAGOAN PRO)", tenor_bulan: "12", total_penjualan: 2078000 },
    { id_skema: "bund_pos_pro", nama_promo: "POS Bundle Pro", tenor_bulan: "12", total_penjualan: 5288000 },
    { id_skema: "bund_jagoan_biz", nama_promo: "Jagoan Business", tenor_bulan: "12", total_penjualan: 1598000 },
    { id_skema: "bund_pos_biz", nama_promo: "POS Bundle Business", tenor_bulan: "12", total_penjualan: 4798000 }
  ]
};

// 🌟 SINKRON: Daftar PIC CRM Resmi
const DAFTAR_PIC = ["Satria Ramadhan", "Lidya Marpaung", "Laura"];

function FormPenjualanPotensiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get("mode") || "create";
  const recordId = searchParams.get("id");

  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  const getLoggedInUser = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_pic") || "Satria Ramadhan";
    }
    return "Satria Ramadhan";
  };

  const [loadingData, setLoadingData] = useState(false);

  const [formInput, setFormInput] = useState({
    tanggalInput: getTodayString(),
    sumberData: "Kelolaan",
    picNasabah: getLoggedInUser(), // 🌟 DINAMIS: Langsung membaca profil login akun browser          
    kodeOwner: "",
    namaOwner: "",
    brand: "",
    namaOutlet: "",
    hpOwner: "",
    status: "Closing",
    membership: "Aktivasi",
    paketKategori: "Basic",
    skemaId: "basic_24",
    paketKategoriAktual: "Basic",
    skemaIdAktual: "basic_24",
    nominalHargaDeal: 1716000, 
    tanggalTraining: "",
    statusTraining: "Belum Training",
    tanggalRealisasi: "",
    buktiTransfer: ""
  });

  // Sinkronisasi ulang jika user membuka form record baru agar data PIC tidak tertinggal cache lama
  useEffect(() => {
    if (mode === "create") {
      setFormInput(prev => ({ ...prev, picNasabah: getLoggedInUser() }));
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "edit" && recordId) {
      const loadRecordData = async () => {
        try {
          setLoadingData(true);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const res = await fetch(`${baseUrl}/api/pipo/penjualan`);
          if (res.ok) {
            const result = await res.json();
            const list = Array.isArray(result) ? result : (result.data || []);
            const found = list.find((item: any) => String(item.id || item.ID) === String(recordId));
            
            if (found) {
              let detectedKategori = "Basic";
              let matchSkemaId = "";

              for (const kat in DATA_PACKET_MASTER) {
                const match = DATA_PACKET_MASTER[kat].find(s => s.nama_promo === found.target_paket);
                if (match) {
                  detectedKategori = kat;
                  matchSkemaId = match.id_skema;
                  break;
                }
              }

              setFormInput({
                tanggalInput: found.tanggal ? found.tanggal.substring(0, 10) : getTodayString(),
                sumberData: found.sumber_data || "Kelolaan",
                picNasabah: found.pic_team || getLoggedInUser(),          
                kodeOwner: found.kode_owner || "",
                namaOwner: found.nama_owner || "",
                brand: found.nama_brand || "",
                namaOutlet: found.nama_outlet || "",
                hpOwner: found.hp_owner || "",
                status: found.status || "Closing",
                membership: found.membership || "Aktivasi",
                paketKategori: detectedKategori,
                skemaId: matchSkemaId || "basic_24",
                paketKategoriAktual: detectedKategori,
                skemaIdAktual: matchSkemaId || "basic_24",
                nominalHargaDeal: found.total_penjualan ?? 0,
                tanggalTraining: found.tanggal_training ? found.tanggal_training.substring(0, 10) : "",
                statusTraining: found.status_training || "Belum Training",
                tanggalRealisasi: found.tanggal_realisasi ? found.tanggal_realisasi.substring(0, 10) : "",
                buktiTransfer: found.bukti_transfer || ""
              });
            }
          }
        } catch (err) {
          console.error("Gagal memuat rincian pipeline:", err);
        } finally {
          setLoadingData(false);
        }
      };
      loadRecordData();
    }
  }, [mode, recordId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormInput((prev) => {
      const nextForm = { ...prev, [name]: value };
      
      if (name === "paketKategori") {
        const listTenorTersedia = DATA_PACKET_MASTER[value] || [];
        const skemaPertama = listTenorTersedia.length > 0 ? listTenorTersedia[0].id_skema : "";
        nextForm.skemaId = skemaPertama;

        nextForm.paketKategoriAktual = value;
        nextForm.skemaIdAktual = skemaPertama;
        const skemaTerpilih = listTenorTersedia.find(s => s.id_skema === skemaPertama);
        if (skemaTerpilih) nextForm.nominalHargaDeal = skemaTerpilih.total_penjualan;
      }

      if (name === "skemaId") {
        const listTenorTersedia = DATA_PACKET_MASTER[nextForm.paketKategori] || [];
        const skemaTerpilih = listTenorTersedia.find(s => s.id_skema === value);

        nextForm.paketKategoriAktual = nextForm.paketKategori;
        nextForm.skemaIdAktual = value;
        if (skemaTerpilih) nextForm.nominalHargaDeal = skemaTerpilih.total_penjualan;
      }

      if (name === "paketKategoriAktual") {
        const listTenorTersedia = DATA_PACKET_MASTER[value] || [];
        nextForm.skemaIdAktual = listTenorTersedia.length > 0 ? listTenorTersedia[0].id_skema : "";
      }

      if (name === "paketKategoriAktual" || name === "skemaIdAktual") {
        const listAktif = DATA_PACKET_MASTER[nextForm.paketKategoriAktual] || [];
        const targetSkema = listAktif.find(s => s.id_skema === nextForm.skemaIdAktual);
        if (targetSkema) {
          nextForm.nominalHargaDeal = targetSkema.total_penjualan;
        }
      }

      if (name === "nominalHargaDeal") {
        nextForm[name] = value === "" ? 0 : Number(value);
      }

      return nextForm;
    });
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini secara permanen?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/pipo/penjualan/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Data Pipeline Berhasil Dihapus!");
        router.push("/penjualan");
      }
    } catch (err) {
      console.error("Gagal menghapus rekor:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let namaPaketFinal = "";
    let targetNominalStandar = 0;

    for (const kategori in DATA_PACKET_MASTER) {
      const listSkema = DATA_PACKET_MASTER[kategori];
      const match = listSkema.find((s) => s.id_skema === formInput.skemaIdAktual);
      if (match) {
        namaPaketFinal = match.nama_promo;
        targetNominalStandar = match.total_penjualan;
        break;
      }
    }

    try {
      const payload = {
        tanggalInput: formInput.tanggalInput,
        sumberData: formInput.sumberData,
        picNasabah: formInput.picNasabah,
        kodeOwner: formInput.kodeOwner,
        namaOwner: formInput.namaOwner,
        brand: formInput.brand,
        namaOutlet: formInput.namaOutlet,
        hpOwner: formInput.hpOwner,
        status: formInput.status,
        membership: formInput.membership,
        targetPaket: namaPaketFinal,      
        targetNominal: targetNominalStandar, 
        nominalAktual: formInput.nominalHargaDeal, 
        tanggalTraining: formInput.tanggalTraining,
        statusTraining: formInput.statusTraining,
        tanggalRealisasi: formInput.tanggalRealisasi,
        buktiTransfer: formInput.buktiTransfer
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = mode === "edit" ? `${baseUrl}/api/pipo/penjualan/${recordId}` : `${baseUrl}/api/pipo/penjualan`;
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Sakti! Data Pipeline Berhasil Disimpan!");
        router.push("/penjualan"); 
      } else {
        alert("Gagal memproses data ke server backend.");
      }
    } catch (error) {
      console.error("Error saving penjualan:", error);
    }
  };

  const listTenorAktif = DATA_PACKET_MASTER[formInput.paketKategori] || [];
  const skemaTerpilih = listTenorAktif.find(s => s.id_skema === formInput.skemaId);
  const hargaTetap = skemaTerpilih ? skemaTerpilih.total_penjualan : 0;

  const listTenorAktifAktual = DATA_PACKET_MASTER[formInput.paketKategoriAktual] || [];

  if (loadingData) return <div className="text-center py-20 font-bold text-sm text-gray-400 animate-pulse">Memuat rincian parameter...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white border border-gray-200/80 shadow-sm rounded-3xl space-y-6 mt-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {mode === "edit" ? "✏️ Perbarui Data Master Penjualan" : "➕ Input Record Penjualan Baru"}
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Form formulir dinamis pembagian paket resmi langganan dan kustomisasi deal aktual lapangan.</p>
        </div>
        <button type="button" onClick={() => router.push("/penjualan")} className="text-xs font-bold px-4 py-2 bg-gray-50 border rounded-xl hover:bg-gray-100 transition text-gray-500 cursor-pointer">
          ← Kembali ke Tabel
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-bold text-gray-500">
        
        {/* ROW OPERASIONAL TIM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Tanggal Input Laporan</label>
            <input type="date" name="tanggalInput" value={formInput.tanggalInput} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none uppercase cursor-pointer" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Sumber Pipeline Data</label>
            <select name="sumberData" value={formInput.sumberData} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
              <option value="Kelolaan">Kelolaan</option>
              <option value="Referral Partner">Referral Partner</option>
              <option value="Mitra Taufik">Mitra Taufik</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* 🌟 Terkunci otomatis (Read-Only) mengikuti akun yang sedang login */}
            <label className="text-gray-600">PIC Team Hunter</label>
            <input 
              type="text" 
              name="picNasabah" 
              value={formInput.picNasabah} 
              disabled 
              className="border p-3 rounded-xl text-sm font-black text-[#007AFF] bg-gray-100 cursor-not-allowed focus:outline-none" 
            />
          </div>
        </div>

        {/* PROFIL MITRA */}
        <div className="p-6 border border-dashed border-blue-200 bg-blue-50/30 rounded-2xl space-y-5">
          <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-black uppercase tracking-wider block w-max">
            Informasi Profil Toko / Usaha Mitra
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Kode Owner</label>
              <input type="text" name="kodeOwner" placeholder="Contoh: OWN-0034" value={formInput.kodeOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Nama Owner</label>
              <input type="text" name="namaOwner" placeholder="Nama lengkap owner usaha" value={formInput.namaOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">No. HP Owner</label>
              <input type="text" name="hpOwner" placeholder="Contoh: 0812345..." value={formInput.hpOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-gray-600">Nama Brand / Usaha</label>
              <input type="text" name="brand" placeholder="Contoh: Pippo Laundry" value={formInput.brand} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Nama Cabang / Outlet</label>
              <input type="text" name="namaOutlet" placeholder="Contoh: Cabang Tiban" value={formInput.namaOutlet} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Status Konversi Pipeline</label>
              <select name="status" value={formInput.status} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
                <option value="Closing">Closing</option>
                <option value="Potensi">Potensi</option>
                <option value="Negoisasi">Negoisasi</option>
                <option value="Existing">Existing</option>
                <option value="Renewal">Renewal</option>
                <option value="Tidak Tertarik">Tidak Tertarik</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION PAKET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
            <span className="text-[10px] bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-black uppercase tracking-wider block w-max">
              📋 Paket Langganan (Rencana)
            </span>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700">Kategori Paket</label>
              <select name="paketKategori" value={formInput.paketKategori} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none">
                <option value="Basic">Basic</option>
                <option value="Business">Business</option>
                <option value="Pro">Pro</option>
                <option value="Bundling & Alat">Bundling & Alat</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700">Nama Promo / Skema Tenor</label>
              <select name="skemaId" value={formInput.skemaId} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none">
                {listTenorAktif.map((skema) => (
                  <option key={skema.id_skema} value={skema.id_skema}>{skema.nama_promo}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500">Harga Tetap (Standar Katalog)</label>
              <input 
                type="number" 
                value={hargaTetap} 
                disabled 
                className="border p-3.5 rounded-2xl text-base font-black bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed focus:outline-none" 
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-4">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-black uppercase tracking-wider block w-max">
              ⚡ Paket Aktual (Deal Lapangan)
            </span>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#007AFF]">Kategori Paket</label>
              <select name="paketKategoriAktual" value={formInput.paketKategoriAktual} onChange={handleInputChange} className="border-2 border-blue-200 p-3 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none">
                <option value="Basic">Basic</option>
                <option value="Business">Business</option>
                <option value="Pro">Pro</option>
                <option value="Bundling & Alat">Bundling & Alat</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#007AFF]">Nama Promo / Skema Tenor</label>
              <select name="skemaIdAktual" value={formInput.skemaIdAktual} onChange={handleInputChange} className="border-2 border-blue-200 p-3 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none">
                {listTenorAktifAktual.map((skema) => (
                  <option key={skema.id_skema} value={skema.id_skema}>{skema.nama_promo}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#007AFF]">Nominal Aktual Realisasi (Rp)</label>
              <input 
                type="number" 
                name="nominalHargaDeal" 
                value={formInput.nominalHargaDeal || ""} 
                onChange={handleInputChange} 
                className="border-2 p-3.5 rounded-2xl text-base font-black bg-white border-blue-200 text-[#007AFF] focus:outline-none focus:border-blue-400" 
                required
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-gray-600">Membership System</label>
          <select name="membership" value={formInput.membership} onChange={handleInputChange} className="border p-3.5 rounded-2xl text-sm font-semibold text-gray-800 bg-white focus:outline-none w-full">
            <option value="Aktivasi">Aktivasi</option>
            <option value="Trial">Trial</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
        </div>

        <div className="p-4 border border-dashed border-emerald-200 bg-emerald-50/20 rounded-2xl space-y-4">
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">
            Parameter Validasi Administrasi Realisasi Aktual
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-900">Tanggal Realisasi Pembayaran Aktual</label>
              <input type="date" name="tanggalRealisasi" value={formInput.tanggalRealisasi || ""} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none uppercase cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-900">URL Tautan / Link Bukti Transfer Valid</label>
              <input type="text" name="buktiTransfer" placeholder="Contoh: https://drive.google.com/file/..." value={formInput.buktiTransfer || ""} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Tanggal Pelaksanaan Training</label>
            <input type="date" name="tanggalTraining" value={formInput.tanggalTraining} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-white cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Status Capaian Training</label>
            <select name="statusTraining" value={formInput.statusTraining} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none">
              <option value="Belum Training">Belum Training</option>
              <option value="Selesai Training">Selesai Training</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-2">
          <div>
            {mode === "edit" && (
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-xs transition cursor-pointer">
                🗑️ Hapus Record Permanen
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/penjualan")} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-bold hover:bg-[#0062CC] text-sm shadow-md cursor-pointer">
              {mode === "edit" ? "Simpan Perubahan" : "Simpan Transaksi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Parent rendering context with fallback
type SuspenseProps = {
  children?: React.ReactNode;
};

export default function FormPenjualanPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-bold text-gray-400 animate-pulse">Loading form parameters...</div>}>
      <FormPenjualanPotensiContent />
    </Suspense>
  );
}