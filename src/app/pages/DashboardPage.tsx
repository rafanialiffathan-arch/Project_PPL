import { TrendingUp, TrendingDown, FileText, Download, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { TransactionModal } from "../components/TransactionModal.tsx"; 
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
import { apiFetch, hasPermission, getStoredUser } from "../../lib/api";

// ==========================
// TYPES
// ==========================
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
export function DashboardPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pemasukan" | "pengeluaran">("pemasukan");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transactions
  useEffect(() => {
    const fetchTransaksi = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch("/transaksi");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error("Gagal fetch transaksi:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransaksi();
  }, []);

  // Refresh transactions after modal close
  const handleRefreshTransactions = async () => {
    try {
      const res = await apiFetch("/transaksi");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Gagal refresh transaksi:", err);
    }
  };

  // Compute summary from transactions
  const computedData = useMemo(() => {
    const totalPemasukan = transactions
      .filter((t) => t.tipe === "pemasukan")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);

    const totalPengeluaran = transactions
      .filter((t) => t.tipe === "pengeluaran")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);

    const netCashFlow = totalPemasukan - totalPengeluaran;
    const jumlahTransaksi = transactions.length;

    // Group by month for chart
    const monthlyMap = new Map<string, { month: string; date: Date; pemasukan: number; pengeluaran: number }>();
    
    transactions.forEach((t) => {
      const date = new Date(t.tanggal);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthLabel, date, pemasukan: 0, pengeluaran: 0 });
      }
      
      const entry = monthlyMap.get(monthKey)!;
      if (t.tipe === "pemasukan") {
        entry.pemasukan += Number(t.jumlah);
      } else {
        entry.pengeluaran += Number(t.jumlah);
      }
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
      .map(([, v]) => ({
        month: v.month,
        monthRaw: v.month.split(" ")[0], // e.g. "Jan"
        pemasukan: Math.round(v.pemasukan / 1000000 * 10) / 10, // Convert to jutaan with 1 decimal
        pengeluaran: Math.round(v.pengeluaran / 1000000 * 10) / 10,
      }));

    // Group by category for expense breakdown
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.tipe === "pengeluaran")
      .forEach((t) => {
        const kat = t.kategori || "Lainnya";
        categoryMap.set(kat, (categoryMap.get(kat) || 0) + Number(t.jumlah));
      });

    const totalExpense = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: totalExpense > 0 ? Math.round((value / totalExpense) * 100 * 10) / 10 : 0,
        amount: value,
      }))
      .sort((a, b) => b.value - a.value);

    // Recent transactions (sorted by tanggal desc)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 10);

    // Find insights
    let insightData: {
      warning: { has: boolean; message: string };
      recommendation: { has: boolean; message: string };
      alert: { has: boolean; message: string };
      success: { has: boolean; message: string };
    } = {
      warning: { has: false, message: "" },
      recommendation: { has: false, message: "" },
      alert: { has: false, message: "" },
      success: { has: false, message: "" },
    };

    if (transactions.length > 0) {
      // Get current month and previous month data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);
      
      const currentMonthTx = transactions.filter(t => t.tanggal.startsWith(currentMonth));
      const lastMonthTx = transactions.filter(t => t.tanggal.startsWith(lastMonth));

      const currentExpense = currentMonthTx.filter(t => t.tipe === "pengeluaran").reduce((s, t) => s + Number(t.jumlah), 0);
      const lastExpense = lastMonthTx.filter(t => t.tipe === "pengeluaran").reduce((s, t) => s + Number(t.jumlah), 0);

      // Alert if cash flow negative
      if (netCashFlow < 0) {
        insightData.alert = {
          has: true,
          message: `Cash flow saat ini negatif Rp ${new Intl.NumberFormat("id-ID").format(Math.abs(netCashFlow))}. Perlu strategi untuk meningkatkan pemasukan.`
        };
      }

      // Warning if expense increased
      if (lastExpense > 0 && currentExpense > lastExpense * 1.1) {
        const percentIncrease = Math.round(((currentExpense - lastExpense) / lastExpense) * 100);
        insightData.warning = {
          has: true,
          message: `Pengeluaran bulan ini naik ${percentIncrease}% dibanding kemarin. Kategori terbesar: ${categoryData[0]?.name || "N/A"} (${categoryData[0]?.value || 0}%)`
        };
      }

      // Success if profit target met
      if (totalPemasukan > 0 && netCashFlow > 0) {
        insightData.success = {
          has: true,
          message: `Keuntungan bersih Rp ${new Intl.NumberFormat("id-ID").format(netCashFlow)}. Pertahankan pertumbuhan ini!`
        };
      }

      // Recommendation if expense > income (guard: avoid division by zero)
      if (totalPemasukan > 0 && totalPengeluaran > totalPemasukan * 0.9) {
        insightData.recommendation = {
          has: true,
          message: `Pengeluaran sudah ${Math.round((totalPengeluaran / totalPemasukan) * 100)}% dari pemasukan. Pertimbangkan efisiensi di kategori ${categoryData[0]?.name || "beban utama"}.`
        };
      }
    }

    return {
      totalPemasukan,
      totalPengeluaran,
      netCashFlow,
      jumlahTransaksi,
      monthlyData,
      categoryData,
      recentTransactions,
      insightData,
    };
  }, [transactions]);

  const formatRupiah = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + " M";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + " jt";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + " rb";
    }
    return num.toString();
  };

  const formatRupiahFull = (num: number) => new Intl.NumberFormat("id-ID").format(num);

  const handleAddTransaction = (type: "pemasukan" | "pengeluaran") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      alert("Belum ada transaksi untuk diexport.");
      return;
    }

    downloadCsv(
      `finsped-dashboard-transaksi-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Tanggal", "No Ref", "Keterangan", "Kategori", "Tipe", "Status", "Jumlah"],
      transactions.map((t) => [
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

  const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-900" />
          <p className="mt-4 text-sm text-gray-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Smart Financial Dashboard</h1>
          <p className="text-sm text-gray-500">
            Real-time data • {computedData.jumlahTransaksi} transaksi
          </p>
        </div>
        <div className="flex gap-3">
          {hasPermission(getStoredUser(), "manage_transaksi") && (
            <>
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
            </>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Pemasukan</div>
              <div className="text-sm text-gray-400">Semua periode</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-green-600">
            Rp {formatRupiah(computedData.totalPemasukan)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {transactions.filter(t => t.tipe === "pemasukan").length} transaksi
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Pengeluaran</div>
              <div className="text-sm text-gray-400">Semua periode</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-red-600">
            Rp {formatRupiah(computedData.totalPengeluaran)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {transactions.filter(t => t.tipe === "pengeluaran").length} transaksi
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg border ${computedData.netCashFlow >= 0 ? "border-green-200" : "border-red-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${computedData.netCashFlow >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              <span className={`text-lg ${computedData.netCashFlow >= 0 ? "text-green-700" : "text-red-700"}`}>
                {computedData.netCashFlow >= 0 ? "+" : "−"}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500">{computedData.netCashFlow >= 0 ? "Laba Bersih" : "Rugi Bersih"}</div>
              <div className="text-sm text-gray-400">Net Cash Flow</div>
            </div>
          </div>
          <div className={`font-mono text-2xl ${computedData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {computedData.netCashFlow >= 0 ? "" : "−"} Rp {formatRupiah(Math.abs(computedData.netCashFlow))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Transaksi</div>
              <div className="text-sm text-gray-400">Semua tipe</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-blue-600">
            {computedData.jumlahTransaksi}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {transactions.filter(t => t.status === "valid").length} valid, {transactions.filter(t => t.status === "pending").length} pending
          </div>
        </div>
      </div>

      {/* 💡 SMART FINANCIAL INSIGHT PANEL - REAL DATA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Smart Financial Insights</h3>
            <p className="text-xs text-gray-600">Analisis Otomatis • Update real-time</p>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada data transaksi untuk dianalisis.</p>
            <p className="text-sm mt-2">Tambahkan transaksi pertama untuk melihat insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Insight - Warning */}
            {computedData.insightData.warning.has && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">⚠️ {computedData.insightData.warning.has ? "Pengeluaran Meningkat" : "Overspending Alert"}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {computedData.insightData.warning.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight - Recommendation */}
            {computedData.insightData.recommendation.has && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">💼 Rekomendasi</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {computedData.insightData.recommendation.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight - Alert */}
            {computedData.insightData.alert.has && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-5 h-5 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">🚨 Cash Flow Negatif</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {computedData.insightData.alert.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight - Success */}
            {computedData.insightData.success.has && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">✅ Target Tercapai</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {computedData.insightData.success.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📈 TREND ANALYSIS & 🔮 CASH FLOW FORECAST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Analysis - Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1 flex items-center gap-2">
              📈 Trend Analysis
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">Real Data</span>
            </h3>
            <p className="text-sm text-gray-500">Pemasukan & Pengeluaran per bulan (dalam Juta)</p>
          </div>
          {computedData.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={computedData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value} jt`, ""]}
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
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              Belum ada data untuk ditampilkan
            </div>
          )}
          {computedData.monthlyData.length > 1 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Insight:</strong> {computedData.netCashFlow >= 0 ? "Tren positif dengan laba bersih." : "Perlu perhatian pada pengeluaran."} Total {computedData.jumlahTransaksi} transaksi dalam periode ini.
              </p>
            </div>
          )}
        </div>

        {/* Cash Flow Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1 flex items-center gap-2">
              💰 Saldo Summary
            </h3>
            <p className="text-sm text-gray-500">Ringkasan keuangan</p>
          </div>
          
          <div className="space-y-4">
            {/* Current Balance Summary */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Total Saldo</div>
              <div className="text-xl font-mono text-gray-900 mb-2">
                Rp {formatRupiah(computedData.netCashFlow)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {computedData.netCashFlow >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Positif Rp {formatRupiah(computedData.netCashFlow)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-700">Negatif Rp {formatRupiah(Math.abs(computedData.netCashFlow))}</span>
                  </>
                )}
              </div>
            </div>

            {/* Net Cash Flow */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Net Cash Flow</div>
              <div className={`text-xl font-mono ${computedData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"} mb-2`}>
                {computedData.netCashFlow >= 0 ? "+" : "−"} Rp {formatRupiahFull(computedData.netCashFlow)}
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 ${computedData.netCashFlow >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} rounded text-xs font-semibold`}>
                    {computedData.netCashFlow >= 0 ? "SURPLUS" : "DEFICIT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <div className="text-xs font-semibold text-gray-900 mb-2">Quick Stats</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Avg. Pemasukan:</span>
                      <span className="font-mono">
                        Rp {computedData.jumlahTransaksi > 0 && transactions.filter(t => t.tipe === "pemasukan").length > 0 
                          ? formatRupiah(computedData.totalPemasukan / transactions.filter(t => t.tipe === "pemasukan").length)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Pengeluaran:</span>
                      <span className="font-mono">
                        Rp {computedData.jumlahTransaksi > 0 && transactions.filter(t => t.tipe === "pengeluaran").length > 0 
                          ? formatRupiah(computedData.totalPengeluaran / transactions.filter(t => t.tipe === "pengeluaran").length)
                          : 0}
                      </span>
                    </div>
                  </div>
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
            <p className="text-sm text-gray-500">Per bulan (dalam Juta Rupiah)</p>
          </div>
          {computedData.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={computedData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value} jt`, ""]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              Belum ada data untuk ditampilkan
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-1">
              Distribusi Pengeluaran
            </h3>
            <p className="text-sm text-gray-500">Per kategori</p>
          </div>
          {computedData.categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={computedData.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {computedData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {computedData.categoryData.slice(0, 5).map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Belum ada data pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions - REAL DATA */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-gray-900">Transaksi Terbaru</h3>
            <p className="text-sm text-gray-500">
              {computedData.recentTransactions.length} transaksi ditampilkan
            </p>
          </div>
          <button
            onClick={() => navigate("/pembukuan")}
            className="text-sm text-gray-700 hover:text-gray-900"
          >
            Lihat semua transaksi →
          </button>
        </div>
        {computedData.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {computedData.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(t.tanggal).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", year: "numeric" 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {t.nomor_invoice || `REF-${String(t.id).padStart(4, "0")}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {t.keterangan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {t.kategori || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        t.status === "valid" 
                          ? "bg-green-50 text-green-700" 
                          : t.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                        {t.status === "valid" ? "Valid" : t.status === "pending" ? "Pending" : t.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${
                      t.tipe === "pemasukan" ? "text-green-600" : "text-red-600"
                    }`}>
                      {t.tipe === "pemasukan" ? "+" : "−"} Rp {formatRupiahFull(Number(t.jumlah))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p>Belum ada transaksi.</p>
            <p className="text-sm mt-2">Mulai dengan menambah transaksi pertama.</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        onSuccess={handleRefreshTransactions}
      />
    </div>
  );
}
