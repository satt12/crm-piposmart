"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const KATALOG_PAKET: Record<string, number> = {
  "Pro 12 Bulan": 1680000,
  "Basic 12 Bulan": 748000,
  "Pro 1 Bulan": 168000,
  "Basic 1 Bulan": 78000,
  "Trial": 0,
  "Aktivasi Pro": 1680000,
  "Aktivasi Basic": 748000,
};

const DAFTAR_PIC = ["Lydia", "Laura", "Satria"];

function FormPotensiContent() {
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

  const [loadingData, setLoadingData] = useState(false);
  const [formInput, setFormInput] = useState({
    tanggalInput: getTodayString(),
    sumberData: "Kelolaan",
    picNasabah: "Lydia",          
    kodeOwner: "",
    namaOwner: "",
    brand: "",
    hpOwner: "",
    status: "Closing",
    membership: "Aktivasi",
    targetPaket: "Pro 12 Bulan", 
    targetNominal: 1680000,       
    paketAktual: "Pro 12 Bulan",   
    nominalAktual: 1680000,       
    tanggalTraining: "",
    statusTraining: "Belum Training",
    timelineTraining: "",
    ratingPlaystore: "",
    tanggalRealisasi: "",
    buktiTransfer: ""
  });

  useEffect(() => {
    if (mode === "edit" && recordId) {
      const loadRecordData = async () => {
        try {
          setLoadingData(true);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const res = await fetch(`${baseUrl}/api/potensi`);
          if (res.ok) {
            const result = await res.json();
            const list = Array.isArray(result) ? result : (result.data || []);
            const found = list.find((item: any) => String(item.id || item.ID) === String(recordId));
            
            if (found) {
              setFormInput({
                tanggalInput: found.tanggalInput ? found.tanggalInput.substring(0, 10) : getTodayString(),
                sumberData: found.sumberData || "Kelolaan",
                picNasabah: found.picNasabah || "Lydia",          
                kodeOwner: found.kodeOwner || "",
                namaOwner: found.namaOwner || "",
                brand: found.brand || "",
                hpOwner: found.hpOwner || "",
                status: found.status || "Closing",
                membership: found.membership || "Aktivasi",
                targetPaket: found.targetPaket || "Pro 12 Bulan", 
                targetNominal: found.targetNominal ?? 0,       
                paketAktual: found.paketAktual || "Pro 12 Bulan",   
                nominalAktual: found.nominalAktual ?? 0,       
                tanggalTraining: found.tanggalTraining ? found.tanggalTraining.substring(0, 10) : "",
                statusTraining: found.statusTraining || "Belum Training",
                timelineTraining: found.timelineTraining || "",
                ratingPlaystore: found.ratingPlaystore || "",
                tanggalRealisasi: found.tanggalRealisasi ? found.tanggalRealisasi.substring(0, 10) : "",
                buktiTransfer: found.buktiTransfer || ""
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
      const updatedForm = { ...prev, [name]: value };

      if (name === "targetPaket") {
        updatedForm.targetNominal = KATALOG_PAKET[value] !== undefined ? KATALOG_PAKET[value] : 0;
      }
      if (name === "paketAktual") {
        updatedForm.nominalAktual = KATALOG_PAKET[value] !== undefined ? KATALOG_PAKET[value] : 0;
      }
      if (name === "nominalAktual" || name === "targetNominal") {
        updatedForm[name] = value === "" ? 0 : Number(value);
      }
      return updatedForm;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = mode === "edit" ? `${baseUrl}/api/potensi/update/${recordId}` : `${baseUrl}/api/potensi/create`;
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInput),
      });

      if (response.ok) {
        alert(mode === "edit" ? "Data Prospek Pipeline Berhasil Diperbarui!" : "Data Prospek Pipeline Berhasil Disimpan!");
        router.push("/potensi-demo"); // 🌟 Redirect ke folder utama yang benar
      } else {
        const result = await response.json();
        alert(`Gagal: ${result.message || "Periksa data input"}`);
      }
    } catch (error) {
      console.error("Error saving potensi:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data Potensi & Demo ini secara permanen?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/potensi/delete/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Data Prospek Pipeline Berhasil Dihapus!");
        router.push("/potensi-demo"); // 🌟 Redirect ke folder utama yang benar
      }
    } catch (err) {
      console.error("Gagal menghapus rekor:", err);
    }
  };

  const listTenorAktif = Object.keys(KATALOG_PAKET);

  if (loadingData) return <div className="text-center py-20 font-bold text-gray-400 animate-pulse">Memuat rincian parameter...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white border border-gray-200/80 shadow-sm rounded-3xl space-y-6 mt-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {mode === "edit" ? "✏️ Perbarui Data Master Potensi & Demo" : "➕ Input Record Prospek Baru"}
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Form formulir penuh penataan pipeline live tim sales PT Piposmart Digital Indonesia.</p>
        </div>
        <button type="button" onClick={() => router.push("/potensi-demo")} className="text-xs font-bold px-4 py-2 bg-gray-50 border rounded-xl hover:bg-gray-100 transition text-gray-500 cursor-pointer">
          ← Kembali ke Tabel
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-bold text-gray-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Tanggal Input</label>
            <input type="date" name="tanggalInput" value={formInput.tanggalInput} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none uppercase cursor-pointer" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Sumber Data</label>
            <select name="sumberData" value={formInput.sumberData} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
              <option value="Kelolaan">Kelolaan</option>
              <option value="Referral Partner">Referral Partner</option>
              <option value="Mitra Taufik">Mitra Taufik</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">PIC Team Hunter</label>
            <select name="picNasabah" value={formInput.picNasabah} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
              {DAFTAR_PIC.map((pic) => <option key={pic} value={pic}>👤 {pic}</option>)}
            </select>
          </div>
        </div>

        <div className="p-6 border border-dashed border-blue-200 bg-blue-50/30 rounded-2xl space-y-5">
          <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-black uppercase tracking-wider block w-max">
            Informasi Profil Toko / Owner
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Kode Owner</label>
              <input type="text" name="kodeOwner" placeholder="Contoh: 18789" value={formInput.kodeOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-gray-600">Nama Owner</label>
              <input type="text" name="namaOwner" placeholder="Nama lengkap owner" value={formInput.namaOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">No. HP Owner</label>
              <input type="text" name="hpOwner" placeholder="081234..." value={formInput.hpOwner} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 focus:outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Project / Brand</label>
              <input type="text" name="brand" placeholder="Nama brand laundry" value={formInput.brand} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Status Konversi</label>
              <select name="status" value={formInput.status} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
                <option value="Closing">Closing</option>
                <option value="Potensi">Potensi</option>
                <option value="Negoisasi">Negoisasi</option>
                <option value="Existing">Existing</option>
                <option value="Renewal">Renewal</option>
                <option value="Tidak Tertarik">Tidak Tertarik</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Membership</label>
              <select name="membership" value={formInput.membership} onChange={handleInputChange} className="border p-3 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
                <option value="Aktivitas">Aktivitas</option>
                <option value="Trial">Trial</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 p-5 rounded-2xl border">
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700">Target Paket Langganan</label>
              <select name="targetPaket" value={formInput.targetPaket} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-white focus:outline-none">
                {listTenorAktif.map((pkt) => <option key={pkt} value={pkt}>{pkt}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400">Target Nominal (Kalkulasi Otomatis)</label>
              <input type="number" name="targetNominal" value={formInput.targetNominal} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-400 bg-gray-100 cursor-not-allowed focus:outline-none" readOnly />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#007AFF]">Paket Aktual (Deal Lapangan)</label>
              <select name="paketAktual" value={formInput.paketAktual} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-semibold text-[#007AFF] bg-white focus:outline-none">
                {listTenorAktif.map((pkt) => <option key={pkt} value={pkt}>{pkt}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600">Nominal Aktual Realisasi (Rp)</label>
              <input type="number" name="nominalAktual" value={formInput.nominalAktual} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-dashed border-emerald-200 bg-emerald-50/20 rounded-2xl space-y-4">
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">
            Parameter Validasi Realisasi Closing
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-900">Tanggal Realisasi Pembayaran</label>
              <input type="date" name="tanggalRealisasi" value={formInput.tanggalRealisasi || ""} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none uppercase cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-900">URL Tautan / Link Bukti Transfer</label>
              <input type="text" name="buktiTransfer" placeholder="Contoh: https://drive.google.com/..." value={formInput.buktiTransfer || ""} onChange={handleInputChange} className="border p-2.5 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none" />
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
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-xs transition cursor-pointer">
                🗑️ Hapus Record Permanen
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/potensi-demo")} className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">
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

export default function FormPotensiPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-bold text-gray-400">Loading form parameters...</div>}>
      <FormPotensiContent />
    </Suspense>
  );
}