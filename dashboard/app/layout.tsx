"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css"; // Pastikan path globals.css kamu sesuai

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. Cek status halaman login
  const isLoginPage = pathname === "/login";

  // 2. Daftar modul CRM PT Piposmart Digital Indonesia - UPDATE: Mengganti Nasabah dengan Penjualan Harian
  const menuItems = [
    { name: "🏠 Dashboard Overview", href: "/" },
    { name: "📄 SOP Operasional", href: "/sop" },
    { name: "🎯 Potensi & Demo", href: "/penjualan" },
    { name: "📈 Target Performa", href: "/target" },
    { name: "💼 Jobdesk Tim", href: "/jobdesk-daily" },
    { name: "👥 Data Kelolaan", href: "/data-kelolaan" },
    { name: "📞 Call & Chat", href: "/call-chat" },
    { name: "📊 Report", href: "/report" },
    { name: "🤝 List Mitra", href: "/list-mitra" },
    { name: "📋 Kelolaan Mitra", href: "/kelolaan-mitra" }, 
  ];

  // 3. Fungsi Aksi Logout
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
    }
    router.push("/login");
  };

  // JIKA USER SEDANG DI HALAMAN LOGIN, TAMPILKAN KONTEN POLOS TANPA SIDEBAR
  if (isLoginPage) {
    return (
      <html lang="id">
        <body className="bg-[#F5F5F7] text-[#1D1D1F] antialiased">
          {children}
        </body>
      </html>
    );
  }

  // JIKA USER SUDAH LOGIN, TAMPILKAN DASHBOARD UTAMA LENGKAP DENGAN SIDEBAR LENGKAP
  return (
    <html lang="id">
      <body className="bg-[#F5F5F7] text-[#1D1D1F] antialiased">
        <div className="flex min-h-screen">
          
          {/* SIDEBAR NAVIGASI GLOBAL (FIXED DI SISI KIRI) */}
          <aside className="w-64 bg-white border-r border-[#E5E5EA] p-5 flex flex-col justify-between fixed h-full z-30">
            <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-1">
              
              {/* Header Sidebar Branding */}
              <div className="pb-4 border-b border-[#E5E5EA]">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest block">WORKSPACE</span>
                <h2 className="text-xl font-black text-[#1D1D1F] mt-1 tracking-tight">Piposmart CRM</h2>
              </div>
              
              {/* Menu Navigasi Link dengan Urutan Baru */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-[#007AFF] text-white shadow-sm shadow-blue-500/20"
                          : "text-[#1D1D1F] hover:bg-[#F2F2F7] hover:text-[#007AFF]"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bagian Bawah Sidebar: Info Status & Tombol LOGOUT */}
            <div className="pt-4 border-t border-[#E5E5EA] space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
              >
                <span>🚪 Logout</span>
                <span className="text-xs">→</span>
              </button>

              <div className="text-[11px] text-[#86868B] font-semibold flex justify-between items-center px-1">
                <span>v1.0.0 • Active</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
            </div>
          </aside>

          {/* AREA PANEL KONTEN UTAMA */}
          <main className="flex-1 ml-64 p-8 min-h-screen bg-[#F5F5F7]">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}