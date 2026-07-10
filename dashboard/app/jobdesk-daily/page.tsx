"use client";

import React, { useState, useEffect, useMemo } from "react";

// 1. Master Data Jobdesk
const initialJobdeskMaster = [
  { id: 1, task: "Follow up data kelolaan" },
  { id: 2, task: "Follow up data nasabah new download - Project list & new outlet" },
  { id: 3, task: "Follow up data nasabah potensi" },
  { id: 4, task: "Follow up data nasabah jatuh tempo" },
  { id: 5, task: "Follow up mitra kelolaan & akuisisi new mitra" },
  { id: 6, task: "Posting konten di whatsapp" },
  { id: 7, task: "Posting konten di Instagram, Tiktok dan Facebook" },
  { id: 8, task: "Follow up nasabah yang belum memberikan rating & logo laundry" },
  { id: 9, task: "Daily report follow up data kelolaan (WA Group)" },
  { id: 10, task: "Daily report follow up data jatuh tempo(WA Group)" },
  { id: 11, task: "Pengisian data kelolaan" },
];

// 2. Data Riwayat Checklist Awal
const initialHistoryData: Record<string, boolean[]> = {
  "2026-06-03": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-04": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-05": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-08": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-09": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-10": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-11": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-12": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-15": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-17": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-18": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-19": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-22": [false, false, false, false, false, false, false, false, false, false, false],
  "2026-06-23": [false, false, false, false, false, false, false, false, false, false, false],
};

export default function JobdeskDailyPage() {
  const getTodayString = () => {
    const tglLokal = new Date();
    const offset = tglLokal.getTimezoneOffset();
    const tglDisesuaikan = new Date(tglLokal.getTime() - (offset * 60 * 1000));
    return tglDisesuaikan.toISOString().substring(0, 10);
  };

  // Helper untuk membersihkan nama panjang database ke panggilan pendek resmi
  const dapatkanNamaPanggilan = (namaLengkap: string) => {
    if (!namaLengkap) return "Satria";
    const namaKecil = namaLengkap.toLowerCase().trim();
    if (namaKecil.includes("satria")) return "Satria";
    if (namaKecil.includes("lydia") || namaKecil.includes("lidya")) return "Lydia";
    if (namaKecil.includes("laura")) return "Laura";
    return namaLengkap.split(" ")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [historyData, setHistoryData] = useState<Record<string, boolean[]>>(initialHistoryData);
  const [dailyTargets, setDailyTargets] = useState<Record<string, Record<number, string>>>({});
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  // STATE USER SESSION & ROLE: Mencegah eror hydration SSR Next.js
  const [loggedInUser, setLoggedInUser] = useState("Satria");
  const [userRole, setUserRole] = useState("Sales");

  // Ambil data dari local storage saat pertama kali dimuat
  useEffect(() => {
    setIsMounted(true);
    
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
    }

    const savedHistory = localStorage.getItem("piposmart_jobdesk_history_v2");
    const savedDailyTargets = localStorage.getItem("piposmart_jobdesk_daily_targets_v3");

    if (savedHistory) {
      setHistoryData(JSON.parse(savedHistory));
    } else {
      setHistoryData(initialHistoryData);
    }

    if (savedDailyTargets) {
      setDailyTargets(JSON.parse(savedDailyTargets));
    }
  }, []);

  // AUTOMATIC MIDNIGHT DAY TRACKER
  useEffect(() => {
    const checkMidnightRun = () => {
      const currentToday = getTodayString();
      setSelectedDate((prev) => {
        if (prev !== currentToday && prev === getTodayString()) {
          return currentToday;
        }
        return prev;
      });
    };

    const intervalId = setInterval(checkMidnightRun, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const currentChecklist = historyData[selectedDate] || new Array(initialJobdeskMaster.length).fill(false);
  const currentDayTargets = dailyTargets[selectedDate] || {};

  const handleCheckboxChange = (index: number) => {
    const updatedChecklist = [...currentChecklist];
    updatedChecklist[index] = !updatedChecklist[index];

    const newHistory = {
      ...historyData,
      [selectedDate]: updatedChecklist,
    };

    setHistoryData(newHistory);
    localStorage.setItem("piposmart_jobdesk_history_v2", JSON.stringify(newHistory));
  };

  const startEditing = (id: number, currentTarget: string) => {
    setEditingId(id);
    setEditingValue(currentTarget);
  };

  const saveTarget = (id: number) => {
    const newDailyTargets = {
      ...dailyTargets,
      [selectedDate]: {
        ...(dailyTargets[selectedDate] || {}),
        [id]: editingValue,
      },
    };
    
    setDailyTargets(newDailyTargets);
    localStorage.setItem("piposmart_jobdesk_daily_targets_v3", JSON.stringify(newDailyTargets));
    setEditingId(null);
  };

  if (!isMounted) {
    return <div className="max-w-7xl mx-auto p-12 text-center font-medium text-gray-400">Memuat Lembar Kerja...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 bg-[#FAF9F6] min-h-screen">
      {/* Header Elemen */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">Jobdesk Daily</h1>
          <div className="text-sm text-gray-500 mt-2 font-medium flex items-center gap-2.5 flex-wrap">
            <span className="text-gray-400 font-medium">Logged in:</span>
            
            {/* 🛠️ SINKRONISASI VISUAL BADGE: Format terpisah persis seperti gambar dengan warna Merah Piposmart */}
            <div className="flex items-center gap-2">
              {/* Ikon Vektor SVG User */}
              <svg className="w-4 h-4 text-[#C92C1E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {/* Nama User Terpisah (Warna Merah Piposmart) */}
              <span className="text-sm font-extrabold text-[#C92C1E] tracking-tight">{loggedInUser}</span>
              {/* Capsule Pill Role Terpisah (Background Merah Muda & Border Tipis) */}
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-[#C92C1E] uppercase tracking-wider shadow-sm">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Kalender Real-Time */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <label className="text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Pilih Hari:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[13px] font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-transparent focus:outline-none focus:bg-white focus:border-[#C92C1E] transition-all uppercase cursor-pointer"
          />
        </div>
      </div>

      {/* Tabel Ceklist Jobdesk Utama */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase w-12 text-center select-none">No</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase select-none">Aktivitas / Jobdesk Tim Sales</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase w-44 text-center select-none">Target</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase w-40 text-center select-none">Beri Ceklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialJobdeskMaster.map((job, idx) => {
                const isChecked = currentChecklist[idx];
                const targetValue = currentDayTargets[job.id] || "";

                return (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors duration-100">
                    <td className="px-6 py-4 text-[13px] font-bold text-gray-400 text-center select-none">{job.id}</td>
                    
                    <td 
                      className="px-6 py-4 text-[13px] font-semibold leading-relaxed text-gray-700 cursor-pointer"
                      onClick={() => handleCheckboxChange(idx)}
                    >
                      <span className={isChecked ? "line-through text-gray-400 font-medium transition-all" : "text-gray-700"}>
                        {job.task}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-[13px] text-center" onClick={(e) => e.stopPropagation()}>
                      {editingId === job.id ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <input 
                            type="text"
                            value={editingValue}
                            placeholder="Isi target..."
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveTarget(job.id)}
                            className="border text-center text-xs font-bold px-2 py-1 rounded-lg w-28 bg-white border-[#C92C1E] focus:outline-none focus:ring-1 focus:ring-[#C92C1E]"
                            autoFocus
                          />
                          <button 
                            onClick={() => saveTarget(job.id)}
                            className="bg-[#C92C1E] text-white font-bold text-[11px] px-2 py-1 rounded-lg hover:bg-[#A82216] shadow-sm cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="inline-flex items-center gap-1.5 justify-center group cursor-pointer hover:bg-gray-50 px-2.5 py-1 rounded-lg transition-all min-h-[28px] min-w-[60px]"
                          onClick={() => startEditing(job.id, targetValue)}
                          title="Klik untuk isi target"
                        >
                          {targetValue ? (
                            <span className="bg-gray-50 px-2.5 py-0.5 rounded-md border border-gray-200 text-xs font-bold text-gray-600 group-hover:bg-white transition-colors">
                              {targetValue}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 italic group-hover:text-gray-400 transition-colors">
                              Tambah +
                            </span>
                          )}
                          <svg className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-center select-none">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => handleCheckboxChange(idx)}
                          className="w-5 h-5 rounded-md border-gray-300 text-[#C92C1E] focus:ring-[#C92C1E]/30 focus:ring-2 transition-all cursor-pointer bg-gray-50 accent-[#C92C1E]"
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}