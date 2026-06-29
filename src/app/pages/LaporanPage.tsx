import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";

// ==========================
// TYPES
// ==========================
type ReportType = "jurnal" | "laporan-keuangan" | "laba-rugi";

type Transaction = {
  id: number;
  tanggal: string;
  keterangan: string;
  jumlah: number;
  tipe: string;
  kategori: string;
  status: string;
  nomor_invoice: string | null;
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
};

const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) => {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ==========================
// MAIN COMPONENT
// ==========================
export function LaporanPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("laporan-keuangan");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [tipeFilter, setTipeFilter] = useState<"all" | "pemasukan" | "pengeluaran">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch official transactions only for financial reports.
  // Backend maps status=approved to approved + valid legacy records.
  useEffect(() => {
    const fetchTransaksi = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch("/transaksi?status=approved");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error("Gagal fetch transaksi resmi:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransaksi();
  }, []);

  // Compute filtered official transactions
  const filteredTransactions = transactions.filter((t) => {
    // Filter by tipe
    if (tipeFilter !== "all" && t.tipe !== tipeFilter) return false;
    
    // Filter by date range
    if (dateFrom && t.tanggal < dateFrom) return false;
    if (dateTo && t.tanggal > dateTo) return false;
    
    return true;
  });

  // Compute official summary from filtered transactions
  const totalPemasukan = filteredTransactions
    .filter((t) => t.tipe === "pemasukan")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);

  const totalPengeluaran = filteredTransactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);

  const labaRugi = totalPemasukan - totalPengeluaran;

  const reports: { id: ReportType; label: string }[] = [
    { id: "jurnal", label: "Jurnal Umum" },
    { id: "laporan-keuangan", label: "Laporan Keuangan" },
    { id: "laba-rugi", label: "Laba Rugi" },
  ];

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada transaksi resmi untuk diexport.");
      return;
    }

    downloadCsv(
      `finsped-${activeReport}-official-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Tanggal", "No Ref", "Keterangan", "Kategori", "Tipe", "Status", "Jumlah"],
      filteredTransactions.map((t) => [
        t.tanggal,
        t.nomor_invoice || `REF-${String(t.id).padStart(4, "0")}`,
        t.keterangan,
        t.kategori || "",
        t.tipe,
        t.status,
        Number(t.jumlah),
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500">
            Generate dan export laporan resmi berdasarkan transaksi approved + valid
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-colors text-center ${
                activeReport === report.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <FileText
                className={`w-8 h-8 mx-auto mb-2 ${
                  activeReport === report.id ? "text-gray-900" : "text-gray-400"
                }`}
              />
              <div className="text-sm text-gray-900">{report.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 flex-wrap">
        <span className="text-sm text-gray-700">Filter:</span>
        
        {/* Tipe Filter */}
        <select 
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={tipeFilter}
          onChange={(e) => setTipeFilter(e.target.value as any)}
        >
          <option value="all">Semua Tipe</option>
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-sm text-gray-500">sampai</span>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Reset Button */}
        {(tipeFilter !== "all" || dateFrom || dateTo) && (
          <button 
            onClick={() => { setTipeFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Reset Filter
          </button>
        )}

        {/* Summary Badge */}
        <div className="ml-auto text-sm text-gray-500">
          {filteredTransactions.length} transaksi resmi
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {activeReport === "laporan-keuangan" && (
            <LaporanKeuanganContent 
              totalPemasukan={totalPemasukan}
              totalPengeluaran={totalPengeluaran}
              labaRugi={labaRugi}
              filteredTransactions={filteredTransactions}
            />
          )}
          {activeReport === "jurnal" && (
            <JurnalContent transactions={filteredTransactions} />
          )}
          {activeReport === "laba-rugi" && (
            <LabaRugiContent 
              totalPemasukan={totalPemasukan}
              totalPengeluaran={totalPengeluaran}
              filteredTransactions={filteredTransactions}
            />
          )}
        </>
      )}
    </div>
  );
}

// ==========================
// CONTENT COMPONENTS
// ==========================

type LaporanKeuanganProps = {
  totalPemasukan: number;
  totalPengeluaran: number;
  labaRugi: number;
  filteredTransactions: Transaction[];
};

function LaporanKeuanganContent({ totalPemasukan, totalPengeluaran, labaRugi, filteredTransactions }: LaporanKeuanganProps) {
  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID").format(num);

  return (
    <div className="space-y-6">
      {/* Summary Cards - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-green-700">Total Pemasukan</div>
          </div>
          <div className="font-mono text-xl text-gray-900">
            Rp {formatRupiah(totalPemasukan)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {filteredTransactions.filter(t => t.tipe === "pemasukan").length} transaksi
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-red-700">Total Pengeluaran</div>
          </div>
          <div className="font-mono text-xl text-gray-900">
            Rp {formatRupiah(totalPengeluaran)}
          </div>
          <div className="text-xs text-red-600 mt-1">
            {filteredTransactions.filter(t => t.tipe === "pengeluaran").length} transaksi
          </div>
        </div>

        <div className={`${labaRugi >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} p-6 rounded-lg border`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 ${labaRugi >= 0 ? "bg-green-600" : "bg-red-600"} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold">{labaRugi >= 0 ? "+" : "−"}</span>
            </div>
            <div className={`text-sm ${labaRugi >= 0 ? "text-green-700" : "text-red-700"}`}>
              {labaRugi >= 0 ? "Laba Bersih" : "Rugi Bersih"}
            </div>
          </div>
          <div className={`font-mono text-xl ${labaRugi >= 0 ? "text-green-700" : "text-red-600"}`}>
            {labaRugi >= 0 ? "" : "−"} Rp {formatRupiah(Math.abs(labaRugi))}
          </div>
          <div className={`text-xs ${labaRugi >= 0 ? "text-green-600" : "text-red-500"} mt-1`}>
            Selisih periode
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-blue-700">Total Transaksi Resmi</div>
          </div>
          <div className="font-mono text-xl text-gray-900">
            {filteredTransactions.length}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Approved + valid only
          </div>
        </div>
      </div>

      {/* Detail Report - LABA RUGI FROM REAL DATA */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Ringkasan Laporan Keuangan</h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: {filteredTransactions.length > 0 
              ? `${new Date(Math.min(...filteredTransactions.map(t => new Date(t.tanggal).getTime()))).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} - ${new Date(Math.max(...filteredTransactions.map(t => new Date(t.tanggal).getTime()))).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`
              : "Tidak ada data"
            }
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Pendapatan Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">PENDAPATAN</h4>
            <div className="space-y-2 ml-4">
              {/* Group by kategori */}
              {Array.from(new Set(filteredTransactions.filter(t => t.tipe === "pemasukan").map(t => t.kategori))).map(kategori => {
                const totalKategori = filteredTransactions
                  .filter(t => t.tipe === "pemasukan" && t.kategori === kategori)
                  .reduce((sum, t) => sum + Number(t.jumlah), 0);
                return (
                  <div key={kategori} className="flex justify-between text-sm">
                    <span className="text-gray-700">{kategori || "Lainnya"}</span>
                    <span className="font-mono text-gray-900">Rp {formatRupiah(totalKategori)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total Pendapatan</span>
                <span className="font-mono text-green-600">Rp {formatRupiah(totalPemasukan)}</span>
              </div>
            </div>
          </div>

          {/* Beban Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">BEBAN / PENGELUARAN</h4>
            <div className="space-y-2 ml-4">
              {Array.from(new Set(filteredTransactions.filter(t => t.tipe === "pengeluaran").map(t => t.kategori))).map(kategori => {
                const totalKategori = filteredTransactions
                  .filter(t => t.tipe === "pengeluaran" && t.kategori === kategori)
                  .reduce((sum, t) => sum + Number(t.jumlah), 0);
                if (totalKategori === 0) return null;
                return (
                  <div key={kategori} className="flex justify-between text-sm">
                    <span className="text-gray-700">{kategori || "Lainnya"}</span>
                    <span className="font-mono text-gray-900">Rp {formatRupiah(totalKategori)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total Beban</span>
                <span className="font-mono text-red-600">Rp {formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>
          </div>

          {/* Laba Rugi */}
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between font-medium">
              <span className="text-gray-900">{labaRugi >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}</span>
              <span className={`font-mono text-xl ${labaRugi >= 0 ? "text-green-600" : "text-red-600"}`}>
                {labaRugi >= 0 ? "" : "−"} Rp {formatRupiah(Math.abs(labaRugi))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Daftar Transaksi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.slice(0, 50).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {t.nomor_invoice || `REF-${String(t.id).padStart(4, "0")}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{t.keterangan}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.kategori || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        t.tipe === "pemasukan" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {t.tipe === "pemasukan" ? "↑ Masuk" : "↓ Keluar"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-mono text-right ${
                      t.tipe === "pemasukan" ? "text-green-600" : "text-red-600"
                    }`}>
                      {t.tipe === "pemasukan" ? "+" : "−"} Rp {formatRupiah(Number(t.jumlah))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Menampilkan 50 dari {filteredTransactions.length} transaksi resmi
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================
// JURNAL CONTENT - REAL DATA
// ==========================
function JurnalContent({ transactions }: { transactions: Transaction[] }) {
  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID").format(num);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Jurnal Umum</h3>
        </div>
        <div className="p-12 text-center text-gray-500">
          Tidak ada transaksi resmi dalam periode ini
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-gray-900">Jurnal Umum</h3>
        <p className="text-sm text-gray-500 mt-1">
          {transactions.length} transaksi
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {t.nomor_invoice || `REF-${String(t.id).padStart(4, "0")}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{t.keterangan}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-1 rounded text-xs ${
                    t.tipe === "pemasukan" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {t.kategori || t.tipe}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-right text-gray-900">
                  {t.tipe === "pengeluaran" ? `Rp ${formatRupiah(Number(t.jumlah))}` : ""}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-right text-gray-900">
                  {t.tipe === "pemasukan" ? `Rp ${formatRupiah(Number(t.jumlah))}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
              <td className="px-4 py-3 text-sm font-mono text-right font-medium text-red-600">
                Rp {formatRupiah(transactions.filter(t => t.tipe === "pengeluaran").reduce((sum, t) => sum + Number(t.jumlah), 0))}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-right font-medium text-green-600">
                Rp {formatRupiah(transactions.filter(t => t.tipe === "pemasukan").reduce((sum, t) => sum + Number(t.jumlah), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ==========================
// LABA RUGI - REAL DATA
// ==========================
type LabaRugiProps = {
  totalPemasukan: number;
  totalPengeluaran: number;
  filteredTransactions: Transaction[];
};

function LabaRugiContent({ totalPemasukan, totalPengeluaran, filteredTransactions }: LabaRugiProps) {
  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID").format(num);
  const labaRugi = totalPemasukan - totalPengeluaran;

  const incomeByCategory = filteredTransactions
    .filter(t => t.tipe === "pemasukan")
    .reduce((acc, t) => {
      const kat = t.kategori || "Lainnya";
      acc[kat] = (acc[kat] || 0) + Number(t.jumlah);
      return acc;
    }, {} as Record<string, number>);

  // Group by kategori for expense breakdown
  const expenseByCategory = filteredTransactions
    .filter(t => t.tipe === "pengeluaran")
    .reduce((acc, t) => {
      const kat = t.kategori || "Lainnya";
      acc[kat] = (acc[kat] || 0) + Number(t.jumlah);
      return acc;
    }, {} as Record<string, number>);

  // Simple text-based display (no recharts to avoid complexity)
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 mb-2">Total Pendapatan</div>
          <div className="font-mono text-2xl text-green-600">
            Rp {formatRupiah(totalPemasukan)}
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="text-sm text-red-700 mb-2">Total Beban</div>
          <div className="font-mono text-2xl text-red-600">
            Rp {formatRupiah(totalPengeluaran)}
          </div>
        </div>

        <div className={`${labaRugi >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} p-6 rounded-lg border`}>
          <div className="text-sm text-gray-700 mb-2">
            {labaRugi >= 0 ? "Laba Bersih" : "Rugi Bersih"}
          </div>
          <div className={`font-mono text-2xl ${labaRugi >= 0 ? "text-green-600" : "text-red-600"}`}>
            {labaRugi >= 0 ? "" : "−"} Rp {formatRupiah(Math.abs(labaRugi))}
          </div>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Rincian Pendapatan per Kategori</h3>
        </div>
        <div className="p-6">
          {Object.keys(incomeByCategory).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(incomeByCategory).map(([kategori, total]) => {
                const percentage = totalPemasukan > 0 ? ((total / totalPemasukan) * 100).toFixed(1) : "0";
                return (
                  <div key={kategori} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-700">{kategori}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-500 h-4 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-40 text-right">
                      <span className="font-mono text-sm">Rp {formatRupiah(total)}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Belum ada data pendapatan</div>
          )}
        </div>
      </div>

      {/* Breakdown by Expense Category */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Rincian Beban per Kategori</h3>
        </div>
        <div className="p-6">
          {Object.keys(expenseByCategory).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([kategori, total]) => {
                  const percentage = totalPengeluaran > 0 ? ((total / totalPengeluaran) * 100).toFixed(1) : "0";
                  return (
                    <div key={kategori} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-gray-700">{kategori}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-red-500 h-4 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-40 text-right">
                        <span className="font-mono text-sm">Rp {formatRupiah(total)}</span>
                        <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Belum ada data beban</div>
          )}
        </div>
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Laporan Laba Rugi (Income Statement)</h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Pendapatan */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">PENDAPATAN</h4>
            <div className="space-y-2 ml-4 text-sm">
              {Array.from(new Set(filteredTransactions.filter(t => t.tipe === "pemasukan").map(t => t.kategori || "Lainnya"))).map(kategori => {
                const total = filteredTransactions
                  .filter(t => t.tipe === "pemasukan" && (t.kategori || "Lainnya") === kategori)
                  .reduce((sum, t) => sum + Number(t.jumlah), 0);
                return (
                  <div key={kategori} className="flex justify-between">
                    <span className="text-gray-700">{kategori}</span>
                    <span className="font-mono text-green-600">Rp {formatRupiah(total)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Pendapatan</span>
                <span className="font-mono">Rp {formatRupiah(totalPemasukan)}</span>
              </div>
            </div>
          </div>

          {/* Beban */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">BEBAN</h4>
            <div className="space-y-2 ml-4 text-sm">
              {Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([kategori, total]) => (
                  <div key={kategori} className="flex justify-between">
                    <span className="text-gray-700">{kategori}</span>
                    <span className="font-mono text-red-600">Rp {formatRupiah(total)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Beban</span>
                <span className="font-mono">Rp {formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>
          </div>

          {/* Laba Rugi */}
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between font-medium text-lg">
              <span className="text-gray-900">{labaRugi >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}</span>
              <span className={`font-mono ${labaRugi >= 0 ? "text-green-600" : "text-red-600"}`}>
                {labaRugi >= 0 ? "" : "−"} Rp {formatRupiah(Math.abs(labaRugi))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

