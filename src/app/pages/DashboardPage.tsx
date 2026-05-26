import { TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import { useState } from "react";
import { TransactionModal } from "../components/TransactionModal.tsx"; 
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock data for charts
const monthlyData = [
  { id: "nov-2025", month: "Nov", pemasukan: 250, pengeluaran: 180 },
  { id: "des-2025", month: "Des", pemasukan: 280, pengeluaran: 200 },
  { id: "jan-2026", month: "Jan", pemasukan: 290, pengeluaran: 195 },
  { id: "feb-2026", month: "Feb", pemasukan: 310, pengeluaran: 205 },
  { id: "mar-2026", month: "Mar", pemasukan: 295, pengeluaran: 210 },
  { id: "apr-2026", month: "Apr", pemasukan: 328, pengeluaran: 218 },
];

const categoryData = [
  { id: "cat-1", name: "Gaji", value: 42 },
  { id: "cat-2", name: "Operasional", value: 28 },
  { id: "cat-3", name: "Marketing", value: 18 },
  { id: "cat-4", name: "Lainnya", value: 12 },
];

const COLORS = ["#111827", "#4B5563", "#9CA3AF", "#D1D5DB"];

export function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pemasukan" | "pengeluaran">("pemasukan");
  const navigate = useNavigate();

  const handleAddTransaction = (type: "pemasukan" | "pengeluaran") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Annotation */}
      <div className="p-6 bg-white border-l-4 border-gray-900 rounded-lg shadow-sm">
        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          📌 HALAMAN 2 — SMART DASHBOARD (UPGRADE: AI-POWERED INSIGHTS)
        </h4>
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <div>
            <span className="font-semibold">🧠 SMART FEATURES (PEMBEDA UTAMA):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Financial Insight Panel:</strong> Analisis otomatis dengan AI yang memberikan insight keuangan real-time (bukan sekadar menampilkan angka)</li>
              <li><strong>Trend Analysis:</strong> Line chart tren dengan prediksi pola keuangan berbasis machine learning</li>
              <li><strong>Cash Flow Forecast:</strong> Prediksi saldo & laba/rugi masa depan berdasarkan historical data</li>
              <li><strong>Quick Action Buttons:</strong> Aksi cepat tanpa pindah halaman (modal popup) untuk efisiensi maksimal</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">💡 INSIGHT PANEL (AUTO ANALYSIS):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Sistem otomatis menganalisis pola pengeluaran dan memberikan warning/rekomendasi</li>
              <li>Deteksi anomali (misalnya: "Pengeluaran meningkat 25% dari bulan lalu")</li>
              <li>Kategori insight: Trend, Warning, Recommendation, Opportunity</li>
              <li>Visual color-coded: Info (biru), Warning (kuning), Alert (merah), Success (hijau)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">🔮 CASH FLOW FORECAST:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Prediksi saldo akhir bulan berdasarkan rata-rata 3 bulan terakhir</li>
              <li>Early warning system: "Kemungkinan defisit dalam 2 minggu"</li>
              <li>Confidence level indicator (tingkat akurasi prediksi)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">⚡ QUICK ACTION (UX EXCELLENCE):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Floating action buttons di dashboard untuk tambah pemasukan/pengeluaran</li>
              <li>Modal popup dengan auto-categorization (tidak pindah halaman)</li>
              <li>Mengurangi friction dari 3 klik menjadi 1 klik</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">PEMBEDA DARI APLIKASI BIASA:</span> Sistem ini BUKAN hanya pencatatan, tapi SMART ADVISOR yang membantu pengambilan keputusan bisnis
          </div>
        </div>
      </div>

      {/* Page Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Smart Financial Dashboard</h1>
          <p className="text-sm text-gray-500">
            AI-powered insights & predictions • April 2026
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAddTransaction("pemasukan")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span>
            Tambah Pemasukan
          </button>
          <button
            onClick={() => handleAddTransaction("pengeluaran")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl leading-none">−</span>
            Tambah Pengeluaran
          </button>
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* 💡 SMART FINANCIAL INSIGHT PANEL - AI POWERED */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Smart Financial Insights</h3>
            <p className="text-xs text-gray-600">Analisis Otomatis oleh AI • Update real-time</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insight 1 - Warning */}
          <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">⚠️ Pengeluaran Meningkat</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Pengeluaran bulan ini naik <strong>25%</strong> dibanding bulan lalu.
                  Kategori terbesar: <strong>Operasional (45%)</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Insight 2 - Recommendation */}
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">💼 Rekomendasi</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Kurangi pengeluaran kategori <strong>Marketing</strong> sebesar 15% untuk mencapai target laba bulan depan.
                </p>
              </div>
            </div>
          </div>

          {/* Insight 3 - Alert */}
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">🚨 Cash Flow Negatif</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Cash flow bulan ini <strong>-Rp 12 juta</strong>. Estimasi defisit dalam <strong>2 minggu</strong> jika pola ini berlanjut.
                </p>
              </div>
            </div>
          </div>

          {/* Insight 4 - Success */}
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">✅ Target Tercapai</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Pemasukan melampaui target sebesar <strong>112%</strong>. Pertahankan strategi penjualan saat ini!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 TREND ANALYSIS & 🔮 CASH FLOW FORECAST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Analysis - Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1 flex items-center gap-2">
              📈 Trend Analysis
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">AI Powered</span>
            </h3>
            <p className="text-sm text-gray-500">Prediksi tren 6 bulan ke depan berdasarkan machine learning</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
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
              <Line
                type="monotone"
                dataKey="pemasukan"
                name="Pemasukan"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pengeluaran"
                name="Pengeluaran"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Insight:</strong> Tren pemasukan menunjukkan pertumbuhan konsisten (+11.2% per bulan).
              Pengeluaran relatif stabil dengan sedikit peningkatan di Q2.
            </p>
          </div>
        </div>

        {/* Cash Flow Forecast */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1 flex items-center gap-2">
              🔮 Cash Flow Forecast
            </h3>
            <p className="text-sm text-gray-500">Prediksi 30 hari ke depan</p>
          </div>
          
          <div className="space-y-4">
            {/* Predicted Balance */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Prediksi Saldo Akhir Bulan</div>
              <div className="text-xl font-mono text-gray-900 mb-2">Rp 485.000.000</div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-700">+Rp 35 juta dari saat ini</span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Confidence Level</span>
                  <span className="font-semibold text-blue-700">87%</span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full mt-1">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: "87%" }} />
                </div>
              </div>
            </div>

            {/* Predicted Profit */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Prediksi Laba Bulan Depan</div>
              <div className="text-xl font-mono text-gray-900 mb-2">Rp 115.000.000</div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-700">+4.5% dari bulan ini</span>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ON TRACK
                  </span>
                </div>
              </div>
            </div>

            {/* Early Warning */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="text-xs font-semibold text-gray-900 mb-1">Early Warning</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Jika pengeluaran terus naik 5%/minggu, kemungkinan cash flow negatif pada <strong>minggu ke-3 Mei</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1">
              Tren Pemasukan & Pengeluaran
            </h3>
            <p className="text-sm text-gray-500">6 bulan terakhir (Juta Rupiah)</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
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
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#111827" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1">
              Distribusi Pengeluaran
            </h3>
            <p className="text-sm text-gray-500">Per kategori</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={(entry) => `${entry.value}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx] }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="text-gray-900 font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  09 Apr 2026
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Penjualan Produk - Invoice #INV-0045
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Penjualan
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                    Pemasukan
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  +Rp 15.500.000
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  08 Apr 2026
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Pembayaran Gaji Karyawan
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Gaji
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
                    Pengeluaran
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  -Rp 28.000.000
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  07 Apr 2026
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Biaya Marketing Digital - Meta Ads
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Marketing
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
                    Pengeluaran
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  -Rp 5.750.000
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  06 Apr 2026
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Penjualan Jasa Konsultasi
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Jasa
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                    Pemasukan
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  +Rp 12.000.000
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  05 Apr 2026
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Pembelian Supplies Kantor
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Operasional
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
                    Pengeluaran
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  -Rp 3.250.000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button className="text-sm text-gray-700 hover:text-gray-900">
            Lihat semua transaksi →
          </button>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
      />
    </div>
  );
}