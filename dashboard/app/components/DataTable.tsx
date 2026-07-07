"use client";

import React from "react";

// Definisi kontrak data (Interface) Properti DataTable
interface Column {
  header: string;
  accessor: string;
  render?: (item: any) => React.ReactNode; // 🌟 TAMBAHAN: Mendukung custom render (seperti format rupiah hijau)
}

interface DataTableProps {
  columns: Column[];
  initialData: any; 
  onAddClick?: () => void;
  onExportClick?: () => void;
  onRowClick?: (item: any) => void; // 🌟 TAMBAHAN: Menangkap fungsi klik dari halaman utama
}

export default function DataTable({ columns, initialData, onAddClick, onExportClick, onRowClick }: DataTableProps) {
  
  // 🛡️ SAKTI SAFETY GUARD: Mengunci data agar WAJIB murni berbentuk Array [] sebelum di-map
  const safeData = Array.isArray(initialData)
    ? initialData
    : (initialData && typeof initialData === "object" && "data" in initialData && Array.isArray(initialData.data))
      ? initialData.data
      : [];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] shadow-[0_4px_12px_rgba(0,0,0,0.01)] overflow-hidden space-y-4 p-4">
      
      {/* Baris Tombol Kontrol Aksi Atas Tabel */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
          Total Baris: <span className="text-[#007AFF]">{safeData.length}</span> Record
        </div>
        
        <div className="flex items-center gap-2">
          {onExportClick && (
            <button
              onClick={onExportClick}
              className="px-4 py-2 bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] text-xs font-bold rounded-xl hover:bg-gray-100 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              📥 Export Excel
            </button>
          )}
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-[#007AFF] text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* Kontainer Tabel Utama */}
      <div className="overflow-x-auto border border-[#F2F2F7] rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F5F7] border-b border-[#E8E8ED]">
              <th className="px-4 py-3.5 text-[11px] font-bold text-[#86868B] uppercase w-12 text-center select-none">No</th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3.5 text-[11px] font-bold text-[#86868B] uppercase whitespace-nowrap select-none">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F2F7]">
            {safeData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm font-medium text-gray-400 select-none">
                  📭 Belum ada baris data valid yang tersinkronisasi di database.
                </td>
              </tr>
            ) : (
              safeData.map((row: any, rowIdx: number) => (
                <tr 
                  key={row.id || rowIdx} 
                  // 🌟 SEKARANG TR BISA DIKLIK LANGSUNG LAYAKNYA EXCEL SAKTI
                  onClick={() => onRowClick && onRowClick(row)}
                  className="hover:bg-[#007AFF]/5 transition-colors duration-100 text-[13px] font-semibold text-[#1D1D1F] cursor-pointer"
                >
                  {/* Kolom Nomor Otomatis */}
                  <td className="px-4 py-3.5 text-center text-gray-400 font-bold select-none">{rowIdx + 1}</td>
                  
                  {/* Loop Dinamis Isi Kolom Berdasarkan Accessor */}
                  {columns.map((col, colIdx) => {
                    // 🌟 Cek apakah kolom tersebut membutuhkan custom render (dari properti .render di page.tsx)
                    if (col.render) {
                      return (
                        <td key={colIdx} className="px-4 py-3.5 whitespace-nowrap max-w-xs truncate">
                          {col.render(row)}
                        </td>
                      );
                    }

                    const value = row[col.accessor];
                    return (
                      <td key={colIdx} className="px-4 py-3.5 whitespace-nowrap max-w-xs truncate">
                        {value !== undefined && value !== null ? (
                          typeof value === "string" && value.includes("T") && value.length >= 10 ? (
                            value.substring(0, 10)
                          ) : (
                            String(value)
                          )
                        ) : (
                          <span className="text-gray-300 font-normal italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}