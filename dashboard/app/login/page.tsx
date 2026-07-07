"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loading || setLoading(true);

    try {
      // 🌟 KONEKSI REAL-TIME KE BACKEND GO
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // Backend menerima field ini sebagai key pencarian user
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // 🌟 SIMPAN REAL SESSION DATA HASIL RESPONS BACKEND
        localStorage.setItem("user_token", result.token || "");
        localStorage.setItem("user_pic", result.user?.pic || result.user?.nama || "Satria"); // Menyinkronkan kunci otomatisasi modal PIC
        localStorage.setItem("user_role", result.user?.role || "Sales");

        alert(`Selamat datang kembali, ${result.user?.nama || "Tim Hunter"}!`);
        
        // 🌟 FIXED: Mengarahkan pendaratan (landing) pertama kali langsung ke halaman utama Dashboard
        router.push("/"); // Ubah menjadi "/dashboard" jika rute folder dashboard kamu menggunakan sub-folder /dashboard
      } else {
        // Menampilkan pesan error spesifik dari backend (misal: "Username atau Password salah")
        setError(result.message || "Email atau password internal salah. Silakan hubungi Admin.");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError("Gagal terhubung ke API server. Pastikan backend Go Anda berjalan di port 8080.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E8E8ED] shadow-[0_12px_36px_rgba(0,0,0,0.03)] w-full max-w-sm overflow-hidden p-8 space-y-6">
        
        {/* Logo / Header Perusahaan */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Piposmart Business</h2>
          <p className="text-xs text-[#86868B] font-medium">Internal Enterprise Portal</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold bg-red-50 text-red-600 rounded-xl border border-red-100 text-center animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#48484A]">Email Kerja / Username</label>
            <input
              type="text"
              required
              disabled={loading}
              placeholder="nama@piposmart.com atau username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-[#F5F5F7] border border-transparent rounded-xl text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#007AFF] transition-all font-medium disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#48484A]">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-[#F5F5F7] border border-transparent rounded-xl text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#007AFF] transition-all font-medium disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2.5 text-[13px] font-semibold bg-[#007AFF] text-white hover:bg-[#0062CC] rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Memvalidasi Kredensial..." : "Masuk ke Sistem"}
          </button>
        </form>
      </div>
      <p className="text-[11px] text-[#86868B] font-medium mt-4">© 2026 Piposmart Team Hunter. Protected Portal.</p>
    </div>
  );
}