import { Plus, Calendar, TrendingUp, TrendingDown } from "lucide-react";

export function PerencanaanPage() {
  return (
    <div className="space-y-6">
      {/* Annotation */}
      <div className="p-6 bg-white border-l-4 border-gray-900 rounded-lg shadow-sm">
        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          📌 HALAMAN PERENCANAAN KEUANGAN (BUDGETING)
        </h4>
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <div>
            <span className="font-semibold">FUNGSI PERENCANAAN:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Sistem budgeting untuk merencanakan target pemasukan & pengeluaran per periode</li>
              <li>Monitoring realisasi vs target dengan progress bar visual</li>
              <li>Analisis variance (selisih) antara planning vs actual</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">SUMMARY CARDS:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Target Pemasukan:</strong> Total rencana pendapatan + progress realisasi (%)</li>
              <li><strong>Target Pengeluaran:</strong> Budget biaya operasional + spending rate</li>
              <li><strong>Estimasi Laba:</strong> Projected profit dengan indikator on track/off track</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">RENCANA PEMASUKAN & PENGELUARAN:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Breakdown planning per kategori (Penjualan, Jasa, Gaji, Operasional, dll)</li>
              <li>Perbandingan target vs realisasi dengan persentase achievement</li>
              <li>Clickable untuk edit/adjust budget per item</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">HISTORICAL COMPARISON TABLE:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Tracking perbandingan planning vs realisasi bulan-bulan sebelumnya</li>
              <li>Status indicator (Tercapai, On Track, Off Track)</li>
              <li>Analisis tren untuk forecasting periode selanjutnya</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">USER ROLE ACCESS:</span> Admin (full edit), Pimpinan (view & approve)
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Perencanaan Keuangan</h1>
          <p className="text-sm text-gray-500">
            Kelola rencana anggaran pemasukan dan pengeluaran
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />
          Tambah Rencana
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700">Periode:</span>
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" defaultValue="April 2026">
          <option>Januari 2026</option>
          <option>Februari 2026</option>
          <option>Maret 2026</option>
          <option>April 2026</option>
          <option>Mei 2026</option>
          <option>Juni 2026</option>
        </select>
        <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
          Custom Range
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Target Pemasukan</div>
          <div className="text-gray-900 font-mono mb-3">
            Rp 75.000.000
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "82%" }}
              />
            </div>
            <span className="text-gray-600 font-mono">82%</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Realisasi: Rp 61.500.000
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Target Pengeluaran</div>
          <div className="text-gray-900 font-mono mb-3">
            Rp 50.000.000
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full"
                style={{ width: "74%" }}
              />
            </div>
            <span className="text-gray-600 font-mono">74%</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Realisasi: Rp 37.000.000
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Estimasi Laba</div>
          <div className="text-gray-900 font-mono mb-3">
            Rp 25.000.000
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <TrendingUp className="w-4 h-4" />
            <span>On track dengan target</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Aktual: Rp 24.500.000
          </div>
        </div>
      </div>

      {/* Planning Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Planning */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-gray-900">Rencana Pemasukan</h3>
            <button className="text-sm text-gray-700 hover:text-gray-900">
              + Tambah
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Penjualan Produk</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 45.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Target: Rp 45M</span>
                <span>•</span>
                <span>Realisasi: Rp 38M (84%)</span>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Jasa Konsultasi</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 20.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Target: Rp 20M</span>
                <span>•</span>
                <span>Realisasi: Rp 16M (80%)</span>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Pendapatan Lainnya</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 10.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Target: Rp 10M</span>
                <span>•</span>
                <span>Realisasi: Rp 7.5M (75%)</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-700">Total</span>
            <span className="font-mono text-gray-900">Rp 75.000.000</span>
          </div>
        </div>

        {/* Expense Planning */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-gray-900">Rencana Pengeluaran</h3>
            <button className="text-sm text-gray-700 hover:text-gray-900">
              + Tambah
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Gaji & Tunjangan</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 28.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Budget: Rp 28M</span>
                <span>•</span>
                <span>Realisasi: Rp 28M (100%)</span>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Operasional</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 12.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Budget: Rp 12M</span>
                <span>•</span>
                <span>Realisasi: Rp 5.5M (46%)</span>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Marketing</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 7.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Budget: Rp 7M</span>
                <span>•</span>
                <span>Realisasi: Rp 3M (43%)</span>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Lain-lain</span>
                <span className="text-sm font-mono text-gray-900">
                  Rp 3.000.000
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Budget: Rp 3M</span>
                <span>•</span>
                <span>Realisasi: Rp 0.5M (17%)</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-700">Total</span>
            <span className="font-mono text-gray-900">Rp 50.000.000</span>
          </div>
        </div>
      </div>

      {/* Historical Comparison */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Perbandingan Historis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bulan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Target Pemasukan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Realisasi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Target Pengeluaran
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Realisasi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">April 2026</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                  75.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                  61.500.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                  50.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                  37.000.000
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                    On Track
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Maret 2026</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  70.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  72.500.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  48.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  45.000.000
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                    Tercapai
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Februari 2026</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  68.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  65.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  45.000.000
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                  42.500.000
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded">
                    95%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}