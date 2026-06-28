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

type TransactionSummary = {
  official: {
    income: number;
    expense: number;
    net: number;
    count: number;
  };
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
    count: number;
  }>;
  by_category: Array<{
    kategori: string;
    income: number;
    expense: number;
    net: number;
    count: number;
  }>;
  pending: { count: number };
  rejected: { count: number };
};

const emptySummary: TransactionSummary = {
  official: { income: 0, expense: 0, net: 0, count: 0 },
  monthly: [],
  by_category: [],
  pending: { count: 0 },
  rejected: { count: 0 },
};

const isOfficialStatus = (status: string) => {
  const normalized = (status || "").toLowerCase();
  return normalized === "approved" || normalized === "valid";
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
  const [summary, setSummary] = useState<TransactionSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        apiFetch("/transaksi/summary"),
        apiFetch("/transaksi"),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      } else {
        setSummary(emptySummary);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Gagal fetch dashboard:", err);
      setSummary(emptySummary);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch status-aware financial summary and recent transactions
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh transactions and summary after modal close
  const handleRefreshTransactions = async () => {
    await fetchDashboardData();
  };

  // Compute official dashboard data from backend summary.
  // Official financial numbers follow ADR-005: approved + valid legacy only.
  const computedData = useMemo(() => {
    const officialTransactions = transactions.filter((t) => isOfficialStatus(t.status));
    const totalPemasukan = Number(summary.official.income) || 0;
    const totalPengeluaran = Number(summary.official.expense) || 0;
    const netCashFlow = Number(summary.official.net) || 0;
    const jumlahTransaksi = Number(summary.official.count) || 0;
    const pendingCount = Number(summary.pending.count) || 0;
    const rejectedCount = Number(summary.rejected.count) || 0;
    const incomeCount = officialTransactions.filter((t) => t.tipe === "pemasukan").length;
    const expenseCount = officialTransactions.filter((t) => t.tipe === "pengeluaran").length;

    const monthlyData = summary.monthly.map((m) => {
      const [year, month] = m.month.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      const monthLabel = date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });

      return {
        month: monthLabel,
        monthRaw: monthLabel.split(" ")[0],
        pemasukan: Math.round((Number(m.income) || 0) / 1000000 * 10) / 10,
        pengeluaran: Math.round((Number(m.expense) || 0) / 1000000 * 10) / 10,
      };
    });

    const totalExpense = summary.by_category.reduce((sum, item) => sum + (Number(item.expense) || 0), 0);
    const categoryData = summary.by_category
      .filter((item) => (Number(item.expense) || 0) > 0)
      .map((item) => {
        const amount = Number(item.expense) || 0;
        return {
          name: item.kategori || "Lainnya",
          value: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0,
          amount,
        };
      })
      .sort((a, b) => b.value - a.value);

    // Recent transactions remain monitoring data and show status badges.
    // They are not used for official financial totals.
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 10);

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

    if (jumlahTransaksi > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

      const currentMonthSummary = summary.monthly.find((m) => m.month === currentMonth);
      const lastMonthSummary = summary.monthly.find((m) => m.month === lastMonth);
      const currentExpense = Number(currentMonthSummary?.expense || 0);
      const lastExpense = Number(lastMonthSummary?.expense || 0);

      if (netCashFlow < 0) {
        insightData.alert = {
          has: true,
          message: `Cash flow resmi negatif Rp ${new Intl.NumberFormat("id-ID").format(Math.abs(netCashFlow))}. Pending dan rejected tidak termasuk angka ini.`
        };
      }

      if (lastExpense > 0 && currentExpense > lastExpense * 1.1) {
        const percentIncrease = Math.round(((currentExpense - lastExpense) / lastExpense) * 100);
        insightData.warning = {
          has: true,
          message: `Pengeluaran resmi bulan ini naik ${percentIncrease}% dibanding bulan lalu. Kategori terbesar: ${categoryData[0]?.name || "N/A"} (${categoryData[0]?.value || 0}%)`
        };
      }

      if (totalPemasukan > 0 && netCashFlow > 0) {
        insightData.success = {
          has: true,
          message: `Laba/cash flow resmi Rp ${new Intl.NumberFormat("id-ID").format(netCashFlow)} berdasarkan transaksi approved + valid.`
        };
      }

      if (totalPemasukan > 0 && totalPengeluaran > totalPemasukan * 0.9) {
        insightData.recommendation = {
          has: true,
          message: `Pengeluaran resmi sudah ${Math.round((totalPengeluaran / totalPemasukan) * 100)}% dari pemasukan resmi. Pertimbangkan efisiensi di kategori ${categoryData[0]?.name || "beban utama"}.`
        };
      }
    }

    return {
      totalPemasukan,
      totalPengeluaran,
      netCashFlow,
      jumlahTransaksi,
      pendingCount,
      rejectedCount,
      incomeCount,
      expenseCount,
      monthlyData,
      categoryData,
      recentTransactions,
      insightData,
    };
  }, [summary, transactions]);

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

  const handleExport = async () => {
    try {
      const res = await apiFetch("/transaksi?status=approved");
      if (!res.ok) {
        alert("Gagal mengambil transaksi resmi untuk export.");
        return;
      }

      const officialTransactions: Transaction[] = await res.json();
      if (officialTransactions.length === 0) {
        alert("Belum ada transaksi resmi untuk diexport.");
        return;
      }

      downloadCsv(
        `finsped-dashboard-official-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Tanggal", "No Ref", "Keterangan", "Kategori", "Tipe", "Status", "Jumlah"],
        officialTransactions.map((t) => [
          t.tanggal,
          t.nomor_invoice || `REF-${String(t.id).padStart(4, "0")}`,
          t.keterangan,
          t.kategori || "",
          t.tipe,
          t.status,
          Number(t.jumlah),
        ])
      );
    } catch (err) {
      console.error("Gagal export dashboard official:", err);
      alert("Gagal export transaksi resmi.");
    }
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
            Angka resmi • {computedData.jumlahTransaksi} transaksi approved + valid
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <strong>Scope angka resmi:</strong> hanya transaksi <span className="font-semibold">approved + valid legacy</span>. Pending hanya monitoring approval dan rejected hanya histori audit.
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
              <div className="text-sm text-gray-400">Approved + Valid</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-green-600">
            Rp {formatRupiah(computedData.totalPemasukan)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {computedData.incomeCount} transaksi resmi
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Pengeluaran</div>
              <div className="text-sm text-gray-400">Approved + Valid</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-red-600">
            Rp {formatRupiah(computedData.totalPengeluaran)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {computedData.expenseCount} transaksi resmi
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
              <div className="text-sm text-gray-400">Approved + Valid</div>
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
              <div className="text-xs text-gray-500">Pending Approval</div>
              <div className="text-sm text-gray-400">Monitoring</div>
            </div>
          </div>
          <div className="font-mono text-2xl text-blue-600">
            {computedData.pendingCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {computedData.rejectedCount} rejected history
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
            <p className="text-xs text-gray-600">Analisis resmi • Approved + Valid only</p>
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
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">Official</span>
            </h3>
            <p className="text-sm text-gray-500">Pemasukan & Pengeluaran resmi per bulan (dalam Juta)</p>
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
                <strong>Insight:</strong> {computedData.netCashFlow >= 0 ? "Tren resmi positif." : "Perlu perhatian pada pengeluaran resmi."} Total {computedData.jumlahTransaksi} transaksi official dalam periode ini.
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
            <p className="text-sm text-gray-500">Approved + Valid, tanpa pending/rejected</p>
          </div>

          <div className="space-y-4">
            {/* Current Balance Summary */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Total Saldo Resmi</div>
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
                        Rp {computedData.incomeCount > 0
                          ? formatRupiah(computedData.totalPemasukan / computedData.incomeCount)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Pengeluaran:</span>
                      <span className="font-mono">
                        Rp {computedData.expenseCount > 0
                          ? formatRupiah(computedData.totalPengeluaran / computedData.expenseCount)
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
            <p className="text-sm text-gray-500">Official per bulan (dalam Juta Rupiah)</p>
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
            <p className="text-sm text-gray-500">Pengeluaran official per kategori</p>
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
              {computedData.recentTransactions.length} transaksi monitoring ditampilkan
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
                        isOfficialStatus(t.status)
                          ? "bg-green-50 text-green-700"
                          : t.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                        {isOfficialStatus(t.status) ? "Official" : t.status === "pending" ? "Pending" : t.status}
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
