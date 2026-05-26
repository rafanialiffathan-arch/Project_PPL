import { Download, FileText, TrendingUp, TrendingDown, FileSpreadsheet, Filter } from "lucide-react";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ReportType = "jurnal" | "buku-besar" | "laporan-keuangan" | "neraca" | "laba-rugi";

export function LaporanPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("laporan-keuangan");

  const reports: { id: ReportType; label: string }[] = [
    { id: "jurnal", label: "Jurnal Umum" },
    { id: "buku-besar", label: "Buku Besar" },
    { id: "laporan-keuangan", label: "Laporan Keuangan" },
    { id: "neraca", label: "Neraca" },
    { id: "laba-rugi", label: "Laba Rugi" },
  ];

  return (
    <div className="space-y-6">
      {/* Annotation */}
      <div className="p-6 bg-white border-l-4 border-gray-900 rounded-lg shadow-sm">
        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          📌 HALAMAN 4 — LAPORAN KEUANGAN (FITUR UTAMA 2)
        </h4>
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <div>
            <span className="font-semibold">JENIS LAPORAN:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Jurnal Umum:</strong> Catatan kronologis semua transaksi (Debit-Kredit) dengan no. referensi</li>
              <li><strong>Buku Besar:</strong> Rekapitulasi per akun (Kas, Bank, Piutang, Hutang, dll) dengan running balance</li>
              <li><strong>Laporan Keuangan:</strong> Comprehensive financial summary (Aset, Liabilitas, Ekuitas) dengan comparison</li>
              <li><strong>Neraca (Balance Sheet):</strong> Posisi keuangan di titik waktu tertentu (Assets = Liabilities + Equity)</li>
              <li><strong>Laba Rugi (Income Statement):</strong> Performa keuangan periode tertentu (Pendapatan - Beban = Laba/Rugi)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">FUNGSI FILTER:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Periode:</strong> Bulan ini, Kuartal, Tahun, atau Custom date range (dari-sampai)</li>
              <li><strong>Format:</strong> Summary view atau Detail view dengan drill-down capability</li>
              <li><strong>Comparison:</strong> Period-over-period analysis (MoM, YoY)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">FUNGSI EXPORT:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>PDF:</strong> Professional format untuk presentasi & print (dengan header perusahaan)</li>
              <li><strong>Excel:</strong> Editable format untuk analisis lanjutan & data manipulation</li>
              <li><strong>Auto-naming:</strong> File format: "Laporan_[Jenis]_[Periode]_[Tanggal].pdf/xlsx"</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">INSIGHT & ANALYTICS:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Trend indicators (naik/turun) dengan persentase perubahan</li>
              <li>Financial ratios otomatis (Liquidity, Profitability, Solvency)</li>
              <li>Alert untuk anomali atau threshold violation</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">USER ROLE ACCESS:</span> Admin & Pimpinan (full access ke semua laporan)
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500">
            Generate dan export laporan keuangan perusahaan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            <FileText className="w-4 h-4" />
            Generate Laporan
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
        <span className="text-sm text-gray-700">Periode Laporan:</span>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Bulan Ini (April 2026)</option>
          <option>Kuartal I 2026</option>
          <option>Tahun 2026</option>
          <option>Custom Range</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-sm text-gray-500">sampai</span>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Report Content */}
      {activeReport === "laporan-keuangan" && <LaporanKeuanganContent />}
      {activeReport === "jurnal" && <JurnalContent />}
      {activeReport === "buku-besar" && <BukuBesarContent />}
      {activeReport === "neraca" && <NeracaContent />}
      {activeReport === "laba-rugi" && <LabaRugiContent />}
    </div>
  );
}

function LaporanKeuanganContent() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Total Aset</div>
          <div className="text-gray-900 font-mono mb-2">
            Rp 3.250.000.000
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+8.5% dari periode lalu</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Total Liabilitas</div>
          <div className="text-gray-900 font-mono mb-2">
            Rp 850.000.000
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingDown className="w-3 h-3" />
            <span>-3.2% dari periode lalu</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Total Ekuitas</div>
          <div className="text-gray-900 font-mono mb-2">
            Rp 2.400.000.000
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+12.8% dari periode lalu</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Laba Bersih</div>
          <div className="text-gray-900 font-mono mb-2">
            Rp 110.000.000
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+25.3% dari periode lalu</span>
          </div>
        </div>
      </div>

      {/* Main Report */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">
            Ringkasan Laporan Keuangan
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: 1 April 2026 - 9 April 2026
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Aset Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">ASET</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Kas dan Setara Kas</span>
                <span className="font-mono text-gray-900">Rp 450.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Piutang Usaha</span>
                <span className="font-mono text-gray-900">Rp 125.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Persediaan</span>
                <span className="font-mono text-gray-900">Rp 85.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Aset Tetap</span>
                <span className="font-mono text-gray-900">Rp 2.590.000.000</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total Aset</span>
                <span className="font-mono text-gray-900">Rp 3.250.000.000</span>
              </div>
            </div>
          </div>

          {/* Liabilitas Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">LIABILITAS</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Hutang Usaha</span>
                <span className="font-mono text-gray-900">Rp 320.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Hutang Bank</span>
                <span className="font-mono text-gray-900">Rp 450.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Liabilitas Lainnya</span>
                <span className="font-mono text-gray-900">Rp 80.000.000</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total Liabilitas</span>
                <span className="font-mono text-gray-900">Rp 850.000.000</span>
              </div>
            </div>
          </div>

          {/* Ekuitas Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">EKUITAS</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Modal Disetor</span>
                <span className="font-mono text-gray-900">Rp 2.000.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Laba Ditahan</span>
                <span className="font-mono text-gray-900">Rp 290.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Laba Periode Berjalan</span>
                <span className="font-mono text-gray-900">Rp 110.000.000</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total Ekuitas</span>
                <span className="font-mono text-gray-900">Rp 2.400.000.000</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between font-medium">
              <span className="text-gray-900">TOTAL LIABILITAS & EKUITAS</span>
              <span className="font-mono text-gray-900">Rp 3.250.000.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JurnalContent() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-gray-900">Jurnal Umum</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                No. Ref
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Keterangan
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Debit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Kredit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">09 Apr 2026</td>
              <td className="px-6 py-4 text-sm font-mono text-gray-600">JU-045</td>
              <td className="px-6 py-4 text-sm text-gray-900">
                Kas<br />
                <span className="text-gray-500 ml-4">Pendapatan Penjualan</span>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-900 text-right">
                15.500.000<br />
                <span className="text-white">-</span>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-900 text-right">
                <span className="text-white">-</span><br />
                15.500.000
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BukuBesarContent() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-gray-900">Buku Besar</h3>
        <select className="mt-4 px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Kas</option>
          <option>Bank</option>
          <option>Piutang</option>
          <option>Hutang</option>
          <option>Pendapatan</option>
          <option>Beban</option>
        </select>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Detail transaksi buku besar akan ditampilkan di sini...
        </p>
      </div>
    </div>
  );
}

function NeracaContent() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-gray-900">Neraca (Balance Sheet)</h3>
        <p className="text-sm text-gray-500 mt-1">Per 9 April 2026</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">ASET</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Aset Lancar</span>
                <span className="font-mono">660.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Aset Tetap</span>
                <span className="font-mono">2.590.000.000</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Aset</span>
                <span className="font-mono">3.250.000.000</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-4">LIABILITAS & EKUITAS</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Liabilitas</span>
                <span className="font-mono">850.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Ekuitas</span>
                <span className="font-mono">2.400.000.000</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total</span>
                <span className="font-mono">3.250.000.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabaRugiContent() {
  // Data for charts
  const expenseData = [
    { name: "Gaji", value: 140000000, color: "#EF4444" },
    { name: "Operasional", value: 45000000, color: "#F59E0B" },
    { name: "Marketing", value: 23000000, color: "#3B82F6" },
    { name: "Lainnya", value: 10000000, color: "#6B7280" },
  ];

  const profitData = [
    { month: "Jan", pendapatan: 280, beban: 195, laba: 85 },
    { month: "Feb", pendapatan: 295, beban: 205, laba: 90 },
    { month: "Mar", pendapatan: 310, beban: 215, laba: 95 },
    { month: "Apr", pendapatan: 328, beban: 218, laba: 110 },
  ];

  return (
    <div className="space-y-6">
      {/* Export Options Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-blue-900">📤 Export Options:</span>
          <p className="text-xs text-blue-700">Download laporan dalam format profesional</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 text-sm">
            <Download className="w-4 h-4 text-blue-700" />
            <span className="text-blue-900">PDF</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 text-sm">
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            <span className="text-green-900">Excel</span>
          </button>
        </div>
      </div>

      {/* 📊 VISUAL REPORTS - CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-gray-900 mb-1">📊 Breakdown Pengeluaran by Kategori</h4>
          <p className="text-xs text-gray-500 mb-4">Pie Chart - Komposisi Beban (Juta Rupiah)</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Profit Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-gray-900 mb-1">📈 Grafik Laba Rugi Trend</h4>
          <p className="text-xs text-gray-500 mb-4">Bar Chart - Perbandingan 4 Bulan Terakhir (Juta Rp)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="pendapatan" name="Pendapatan" fill="#10B981" />
              <Bar dataKey="beban" name="Beban" fill="#EF4444" />
              <Bar dataKey="laba" name="Laba" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Laporan Laba Rugi Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">
            Laporan Laba Rugi (Income Statement)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: 1 April 2026 - 9 April 2026
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">PENDAPATAN</h4>
            <div className="space-y-2 ml-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Pendapatan Penjualan</span>
                <span className="font-mono text-gray-900">Rp 250.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pendapatan Jasa</span>
                <span className="font-mono text-gray-900">Rp 78.000.000</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Pendapatan</span>
                <span className="font-mono">Rp 328.000.000</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">BEBAN</h4>
            <div className="space-y-2 ml-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Beban Gaji</span>
                <span className="font-mono text-gray-900">Rp 140.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Beban Operasional</span>
                <span className="font-mono text-gray-900">Rp 45.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Beban Marketing</span>
                <span className="font-mono text-gray-900">Rp 23.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Beban Lainnya</span>
                <span className="font-mono text-gray-900">Rp 10.000.000</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Beban</span>
                <span className="font-mono">Rp 218.000.000</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between font-medium text-lg">
              <span className="text-gray-900">LABA BERSIH</span>
              <span className="font-mono text-green-600">Rp 110.000.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}