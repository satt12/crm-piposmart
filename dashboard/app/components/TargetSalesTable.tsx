"use client";

import React from "react";
import DataTable from "./DataTable";

interface Column {
  header: string;
  accessor: string;
  render?: (item: any) => React.ReactNode;
}

interface TargetSalesTableProps {
  columns: Column[];
  initialData: any;
  onAddClick?: () => void;
  onExportClick?: () => void;
  onRowClick?: (item: any) => void;
  // Custom header untuk rowSpan/colSpan
  renderCustomHeader?: () => React.ReactNode;
  // Custom footer untuk baris Total Kumulatif
  renderCustomFooter?: (data: any[]) => React.ReactNode;
  // Utility functions (dari page.tsx)
  formatRupiahSakti?: (val: number) => string;
  dapatkanStyleWarnaTeksStatus?: (pct: number) => string;
  dapatkanTeksPenilaian?: (pct: number) => string;
  dapatkanDataMingguAktif?: (item: any) => { user: number; omset: number };
  filterMingguan?: string | number;
}

export default function TargetSalesTable({
  columns,
  initialData,
  onAddClick,
  onExportClick,
  onRowClick,
  renderCustomHeader,
  renderCustomFooter,
  formatRupiahSakti,
  dapatkanStyleWarnaTeksStatus,
  dapatkanTeksPenilaian,
  dapatkanDataMingguAktif,
  filterMingguan,
}: TargetSalesTableProps) {

  // 🛡️ Data safety
  const safeData = Array.isArray(initialData)
    ? initialData
    : (initialData && typeof initialData === "object" && "data" in initialData && Array.isArray(initialData.data))
      ? initialData.data
      : [];

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        initialData={safeData}
        onAddClick={onAddClick}
        onExportClick={onExportClick}
        onRowClick={onRowClick}
        // 🌟 Jika ada custom header, pakai itu. Kalau gak, DataTable pakai default
        renderHeader={renderCustomHeader ? renderCustomHeader : undefined}
        renderFooter={renderCustomFooter ? renderCustomFooter : undefined}
        // Hide row numbers & summary bar untuk tabel Target yang punya struktur khusus
        showRowNumber={false}
        hideSummaryBar={true}
      />
    </div>
  );
}