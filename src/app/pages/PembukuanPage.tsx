import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Download, CheckCircle, Clock, Calendar, Trash2, Pencil } from "lucide-react";
import { TransactionModal } from "../components/TransactionModal.tsx";
import { AsetModal } from "../components/AsetModal.tsx";
import { InventarisModal } from "../components/InventarisModal.tsx";
import { RekonsiliasiModal } from "../components/RekonsiliasiModal.tsx";
import { apiFetch } from "../../lib/api";

type TabType = "pemasukan" | "pengeluaran" | "kas" | "aset" | "inventaris" | "rekonsiliasi";

type Transaction = {
  id: number;
  tanggal: string;
  keterangan: string;
  kategori: string;
  status: string;
  jumlah: number;
  tipe: string;
  nomor_invoice?: string | null;
};

type Aset = {
  id: number;
  nama_aset: string;
  kategori: string;
  nilai_aset: number;
  tanggal_perolehan: string;
  umur_ekonomis: number;
  status: string;
  akumulasi_depresiasi: number;
  nilai_buku: number;
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

const getDateOnly = (value: string) => value.slice(0, 10);

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function PembukuanPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pemasukan");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pemasukan" | "pengeluaran">("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  // Aset Tetap state
  const [asetList, setAsetList] = useState<Aset[]>([]);
  const [asetLoading, setAsetLoading] = useState(false);
  const [selectedAset, setSelectedAset] = useState<Aset | null>(null);
  const [isAsetModalOpen, setIsAsetModalOpen] = useState(false);

  // Inventaris state
  const [inventarisList, setInventarisList] = useState<any[]>([]);
  const [inventarisLoading, setInventarisLoading] = useState(false);
  const [selectedInventaris, setSelectedInventaris] = useState<any | null>(null);
  const [isInventarisModalOpen, setIsInventarisModalOpen] = useState(false);

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

  // Fetch Aset Tetap
  const fetchAset = async () => {
    setAsetLoading(true);
    try {
      const res = await apiFetch("/aset");
      if (res.ok) {
        const data = await res.json();
        setAsetList(data);
      }
    } catch (err) {
      console.error("Gagal fetch aset:", err);
    } finally {
      setAsetLoading(false);
    }
  };

  // Fetch Inventaris
  const fetchInventaris = async () => {
    setInventarisLoading(true);
    try {
      const res = await apiFetch("/inventaris");
      if (res.ok) {
        const data = await res.json();
        setInventarisList(data);
      }
    } catch (err) {
      console.error("Gagal fetch inventaris:", err);
    } finally {
      setInventarisLoading(false);
    }
  };

  const handleEditAset = (aset: Aset) => {
    setSelectedAset(aset);
    setIsAsetModalOpen(true);
  };

  const handleDeleteAset = async (aset: Aset) => {
    const confirmed = window.confirm(`Yakin ingin menghapus aset "${aset.nama_aset}"?\n\nKlik OK untuk menghapus, atau Cancel untuk membatalkan.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/aset/${aset.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Aset berhasil dihapus!");
        fetchAset();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menghapus aset!");
      }
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    }
  };

  // Inventaris handlers
  const handleEditInventaris = (inventaris: any) => {
    setSelectedInventaris(inventaris);
    setIsInventarisModalOpen(true);
  };

  const handleDeleteInventaris = async (inventaris: any) => {
    const confirmed = window.confirm(`Yakin ingin menghapus "${inventaris.nama_barang}"?\n\nKlik OK untuk menghapus, atau Cancel untuk membatalkan.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/inventaris/${inventaris.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Inventaris berhasil dihapus!");
        fetchInventaris();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menghapus inventaris!");
      }
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    }
  };

  useEffect(() => {
    fetchTransaksi();
    fetchAset();
    fetchInventaris();
  }, []);

  const handleAddData = () => {
    if (activeTab === "aset") {
      // Buka AsetModal untuk tab aset
      setSelectedAset(null);
      setIsAsetModalOpen(true);
    } else if (activeTab === "inventaris") {
      // Buka InventarisModal untuk tab inventaris
      setSelectedInventaris(null);
      setIsInventarisModalOpen(true);
    } else if (activeTab === "rekonsiliasi") {
      // Buka RekonsiliasiModal untuk tab rekonsiliasi bank via RekonsiliasiContent
      // Trigger the modal via a different mechanism - we'll add this
    } else {
      // Buka TransactionModal untuk tab lainnya
      setSelectedTransaction(null);
      setIsModalOpen(true);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = window.confirm(`Yakin ingin menghapus transaksi "${transaction.keterangan}"?\n\nKlik OK untuk menghapus, atau Cancel untuk membatalkan.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/transaksi/${transaction.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Transaksi berhasil dihapus!");
        fetchTransaksi();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menghapus transaksi!");
      }
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    }
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.kategori).filter(Boolean))).sort(),
    [transactions]
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.status).filter(Boolean))).sort(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayKey = toInputDate(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionDate = getDateOnly(transaction.tanggal);
      const transactionAmount = Number(transaction.jumlah);

      if (periodFilter === "today" && transactionDate !== todayKey) return false;
      if (periodFilter === "week" && transactionDate < toInputDate(weekStart)) return false;
      if (periodFilter === "month" && transactionDate < toInputDate(monthStart)) return false;
      if (categoryFilter !== "all" && transaction.kategori !== categoryFilter) return false;
      if (statusFilter !== "all" && transaction.status !== statusFilter) return false;
      if (dateFrom && transactionDate < dateFrom) return false;
      if (dateTo && transactionDate > dateTo) return false;
      if (typeFilter !== "all" && transaction.tipe !== typeFilter) return false;
      if (amountMin && transactionAmount < Number(amountMin)) return false;
      if (amountMax && transactionAmount > Number(amountMax)) return false;

      if (query) {
        const searchable = [
          transaction.keterangan,
          transaction.kategori,
          transaction.status,
          transaction.tipe,
          transaction.nomor_invoice || "",
          String(transaction.jumlah),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [
    amountMax,
    amountMin,
    categoryFilter,
    dateFrom,
    dateTo,
    periodFilter,
    searchQuery,
    statusFilter,
    transactions,
    typeFilter,
  ]);

  // Hitung summary dari transaksi terfilter
  const totalPemasukan = filteredTransactions
    .filter((t) => t.tipe === "pemasukan")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);
  const totalPengeluaran = filteredTransactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);
  const netCashFlow = totalPemasukan - totalPengeluaran;
  const countPemasukan = filteredTransactions.filter((t) => t.tipe === "pemasukan").length;
  const countPengeluaran = filteredTransactions.filter((t) => t.tipe === "pengeluaran").length;

  const handleExport = () => {
    if (activeTab === "aset") {
      if (asetList.length === 0) {
        alert("Belum ada aset untuk diexport.");
        return;
      }
      downloadCsv(
        `finsped-aset-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Nama Aset", "Kategori", "Nilai Aset", "Tanggal Perolehan", "Umur Ekonomis", "Status", "Nilai Buku"],
        asetList.map((aset) => [
          aset.nama_aset,
          aset.kategori,
          Number(aset.nilai_aset),
          aset.tanggal_perolehan,
          aset.umur_ekonomis,
          aset.status,
          Number(aset.nilai_buku || aset.nilai_aset),
        ])
      );
      return;
    }

    if (activeTab === "inventaris") {
      if (inventarisList.length === 0) {
        alert("Belum ada inventaris untuk diexport.");
        return;
      }
      downloadCsv(
        `finsped-inventaris-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Nama Barang", "Kategori", "Jumlah", "Satuan", "Harga Satuan", "Total Nilai", "Status"],
        inventarisList.map((item) => [
          item.nama_barang,
          item.kategori,
          item.jumlah,
          item.satuan,
          Number(item.harga_satuan),
          Number(item.total_nilai),
          item.status,
        ])
      );
      return;
    }

    const rows =
      activeTab === "pemasukan"
        ? filteredTransactions.filter((t) => t.tipe === "pemasukan")
        : activeTab === "pengeluaran"
        ? filteredTransactions.filter((t) => t.tipe === "pengeluaran")
        : filteredTransactions;

    if (rows.length === 0) {
      alert("Belum ada transaksi untuk diexport.");
      return;
    }

    downloadCsv(
      `finsped-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Tanggal", "No Ref", "Keterangan", "Kategori", "Tipe", "Status", "Jumlah"],
      rows.map((t) => [
        t.tanggal,
        t.nomor_invoice || `TRX-${String(t.id).padStart(4, "0")}`,
        t.keterangan,
        t.kategori,
        t.tipe,
        t.status,
        Number(t.jumlah),
      ])
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "pemasukan", label: "Pemasukan" },
    { id: "pengeluaran", label: "Pengeluaran" },
    { id: "kas", label: "Kas" },
    { id: "aset", label: "Aset Tetap" },
    { id: "inventaris", label: "Inventaris" },
    { id: "rekonsiliasi", label: "Rekonsiliasi Bank" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Pembukuan</h1>
          <p className="text-sm text-gray-500">
            Catat dan kelola semua transaksi keuangan perusahaan
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== "rekonsiliasi" && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === "kas" || activeTab === "rekonsiliasi"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
            onClick={handleAddData}
            disabled={activeTab === "kas" || activeTab === "rekonsiliasi"}
          >
            <Plus className="w-4 h-4" />
            {activeTab === "aset"
              ? "Tambah Aset"
              : activeTab === "inventaris"
              ? "Tambah Inventaris"
              : "Tambah Transaksi"}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-gray-900 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {(activeTab === "pemasukan" || activeTab === "pengeluaran" || activeTab === "kas") && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Filter className="w-4 h-4" />
              Filter Lanjutan
            </button>
            <select
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">Semua Periode</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
            </select>
            <select
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. ref, deskripsi, nominal..."
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredTransactions.length} transaksi
            </div>
          </div>

          {/* Advanced Filter Panel */}
          {showAdvancedFilter && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Filter Detail</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Mulai</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Akhir</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipe Transaksi</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "all" | "pemasukan" | "pengeluaran")}
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="pemasukan">Pemasukan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nominal Min</label>
                  <input
                    type="number"
                    min="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nominal Max</label>
                  <input
                    type="number"
                    min="0"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* 📊 SUMMARY BOX (BEFORE TABLE) */}
        {(activeTab === "pemasukan" || activeTab === "pengeluaran") && (
          <div className="px-6 pt-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Pemasukan */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">+</span>
                  </div>
                  <div className="text-xs text-green-700">Total Pemasukan</div>
                </div>
                <div className="font-mono text-xl text-gray-900">
                  Rp {new Intl.NumberFormat("id-ID").format(totalPemasukan)}
                </div>
                <div className="text-xs text-green-600 mt-1">{countPemasukan} transaksi</div>
              </div>

              {/* Total Pengeluaran */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">−</span>
                  </div>
                  <div className="text-xs text-red-700">Total Pengeluaran</div>
                </div>
                <div className="font-mono text-xl text-gray-900">
                  Rp {new Intl.NumberFormat("id-ID").format(totalPengeluaran)}
                </div>
                <div className="text-xs text-red-600 mt-1">{countPengeluaran} transaksi</div>
              </div>

              {/* Net Cash Flow */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">Δ</span>
                  </div>
                  <div className="text-xs text-blue-700">Net Cash Flow</div>
                </div>
                <div className={`font-mono text-xl ${netCashFlow >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {netCashFlow >= 0 ? "+" : "-"} Rp {new Intl.NumberFormat("id-ID").format(Math.abs(netCashFlow))}
                </div>
                <div className="text-xs text-blue-600 mt-1">Selisih periode ini</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pemasukan" && <PemasukanContent transactions={filteredTransactions.filter(t => t.tipe === "pemasukan")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "pengeluaran" && <PengeluaranContent transactions={filteredTransactions.filter(t => t.tipe === "pengeluaran")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "kas" && (
            <KasContent
              transactions={filteredTransactions}
              isLoading={isLoading}
            />
          )}
          {activeTab === "aset" && (
            <AsetContent
              asetList={asetList}
              isLoading={asetLoading}
              onEdit={handleEditAset}
              onDelete={handleDeleteAset}
            />
          )}
          {activeTab === "inventaris" && (
            <InventarisContent
              inventarisList={inventarisList}
              isLoading={inventarisLoading}
              onEdit={handleEditInventaris}
              onDelete={handleDeleteInventaris}
            />
          )}
          {activeTab === "rekonsiliasi" && <RekonsiliasiContent />}
        </div>
      </div>

      {/* Transaction Modal (untuk pemasukan, pengeluaran, kas, inventaris) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTransaction(null); }}
        type={activeTab === "rekonsiliasi" ? "kas" : activeTab}
        editData={selectedTransaction}
        onSuccess={() => {
          console.log("Transaksi berhasil, refresh data...");
          setIsModalOpen(false);
          setSelectedTransaction(null);
          fetchTransaksi();
        }}
      />

      {/* Aset Modal (khusus untuk aset tetap) */}
      <AsetModal
        isOpen={isAsetModalOpen}
        onClose={() => { setIsAsetModalOpen(false); setSelectedAset(null); }}
        editData={selectedAset}
        onSuccess={() => {
          console.log("Aset berhasil disimpan, refresh data...");
          setIsAsetModalOpen(false);
          setSelectedAset(null);
          fetchAset();
        }}
      />

      {/* Inventaris Modal */}
      <InventarisModal
        isOpen={isInventarisModalOpen}
        onClose={() => { setIsInventarisModalOpen(false); setSelectedInventaris(null); }}
        editData={selectedInventaris}
        onSuccess={() => {
          console.log("Inventaris berhasil disimpan, refresh data...");
          setIsInventarisModalOpen(false);
          setSelectedInventaris(null);
          fetchInventaris();
        }}
      />
    </div>
  );
}

type Props = {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function PemasukanContent({ transactions, isLoading, onEdit, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Belum ada data transaksi pemasukan
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">No. Referensi</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="py-4 text-sm text-gray-900">
                {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="py-4 text-sm font-mono text-gray-600">
                {t.nomor_invoice || `INV-${String(t.id).padStart(4, "0")}`}
              </td>
              <td className="py-4 text-sm text-gray-900">{t.keterangan}</td>
              <td className="py-4 text-sm text-gray-600">{t.kategori}</td>
              <td className="py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${t.status === "valid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {t.status === "valid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {t.status === "valid" ? "Valid" : "Pending"}
                </span>
              </td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(t.jumlah))}
              </td>
              <td className="py-4 text-center">
                <button onClick={() => onEdit(t)} className="p-1 text-gray-500 hover:text-gray-900 mr-2" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(t)} className="p-1 text-red-500 hover:text-red-700" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PengeluaranContent({ transactions, isLoading, onEdit, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Belum ada data transaksi pengeluaran
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">No. Voucher</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="py-4 text-sm text-gray-900">
                {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="py-4 text-sm font-mono text-gray-600">
                {t.nomor_invoice || `VCH-${String(t.id).padStart(4, "0")}`}
              </td>
              <td className="py-4 text-sm text-gray-900">{t.keterangan}</td>
              <td className="py-4 text-sm text-gray-600">{t.kategori}</td>
              <td className="py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${t.status === "valid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {t.status === "valid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {t.status === "valid" ? "Valid" : "Pending"}
                </span>
              </td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(t.jumlah))}
              </td>
              <td className="py-4 text-center">
                <button onClick={() => onEdit(t)} className="p-1 text-gray-500 hover:text-gray-900 mr-2" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(t)} className="p-1 text-red-500 hover:text-red-700" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// KasContent Props
type KasProps = {
  transactions: Transaction[];
  isLoading: boolean;
};

function KasContent({ transactions, isLoading }: KasProps) {
  // Hitung dari real transactions
  const totalPemasukan = transactions
    .filter((t) => t.tipe === "pemasukan")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);

  const totalPengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);

  const saldoAwal = 0;
  const totalMutasi = totalPemasukan - totalPengeluaran;
  const saldoAkhir = saldoAwal + totalMutasi;

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("id-ID").format(Math.abs(num));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Saldo Awal</div>
          <div className="font-mono text-xl text-gray-900">
            Rp {formatCurrency(saldoAwal)}
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Total Mutasi</div>
          <div className={`font-mono text-xl ${totalMutasi >= 0 ? "text-green-700" : "text-red-600"}`}>
            {totalMutasi >= 0 ? "+" : "-"} Rp {formatCurrency(totalMutasi)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {transactions.length} transaksi
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Saldo Akhir</div>
          <div className={`font-mono text-xl ${saldoAkhir >= 0 ? "text-gray-900" : "text-red-600"}`}>
            Rp {formatCurrency(saldoAkhir)}
          </div>
        </div>
      </div>

      {/* Tabel Mutasi Kas */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada mutasi kas
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">No. Referensi</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="py-4 text-sm text-gray-900">
                    {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-4 text-sm font-mono text-gray-600">
                    {t.nomor_invoice || `TRX-${String(t.id).padStart(4, "0")}`}
                  </td>
                  <td className="py-4 text-sm text-gray-900">{t.keterangan}</td>
                  <td className="py-4 text-sm text-gray-600">{t.kategori}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      t.tipe === "pemasukan" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {t.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${t.status === "valid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {t.status === "valid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {t.status === "valid" ? "Valid" : "Pending"}
                    </span>
                  </td>
                  <td className={`py-4 text-sm text-right font-mono ${
                    t.tipe === "pemasukan" ? "text-green-700" : "text-red-600"
                  }`}>
                    {t.tipe === "pemasukan" ? "+" : "-"} Rp {formatCurrency(Number(t.jumlah))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// AsetContent Props
type AsetProps = {
  asetList: Aset[];
  isLoading: boolean;
  onEdit: (aset: Aset) => void;
  onDelete: (aset: Aset) => void;
};

function AsetContent({ asetList, isLoading, onEdit, onDelete }: AsetProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (asetList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Belum ada data aset tetap. Klik "Tambah Transaksi" untuk menambah aset.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Kode Aset
            </th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Nama Aset
            </th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Kategori
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Nilai Perolehan
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Akumulasi Depresiasi
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Nilai Buku
            </th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {asetList.map((aset, index) => (
            <tr key={aset.id} className="hover:bg-gray-50">
              <td className="py-4 text-sm font-mono text-gray-600">
                AST-{String(index + 1).padStart(3, "0")}
              </td>
              <td className="py-4 text-sm text-gray-900">{aset.nama_aset}</td>
              <td className="py-4 text-sm text-gray-600 capitalize">{aset.kategori}</td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(aset.nilai_aset))}
              </td>
              <td className="py-4 text-sm text-gray-600 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(aset.akumulasi_depresiasi || 0))}
              </td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(aset.nilai_buku || aset.nilai_aset))}
              </td>
              <td className="py-4 text-center">
                <span className={`inline-flex px-2 py-1 rounded text-xs ${
                  aset.status === "aktif"
                    ? "bg-green-50 text-green-700"
                    : aset.status === "dijual"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {aset.status}
                </span>
              </td>
              <td className="py-4 text-center">
                <button onClick={() => onEdit(aset)} className="p-1 text-gray-500 hover:text-gray-900 mr-2" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(aset)} className="p-1 text-red-500 hover:text-red-700" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// InventarisContent Props
type InventarisProps = {
  inventarisList: any[];
  isLoading: boolean;
  onEdit: (inventaris: any) => void;
  onDelete: (inventaris: any) => void;
};

function InventarisContent({ inventarisList, isLoading, onEdit, onDelete }: InventarisProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (inventarisList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Belum ada data inventaris. Klik "Tambah Transaksi" untuk menambah inventaris.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Kode Barang
            </th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Nama Barang
            </th>
            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
              Kategori
            </th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Stok
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Harga Satuan
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Total Nilai
            </th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {inventarisList.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="py-4 text-sm font-mono text-gray-600">
                BRG-{String(index + 1).padStart(3, "0")}
              </td>
              <td className="py-4 text-sm text-gray-900">{item.nama_barang}</td>
              <td className="py-4 text-sm text-gray-600 capitalize">{item.kategori}</td>
              <td className="py-4 text-sm text-gray-900 text-center">
                {item.jumlah} {item.satuan}
              </td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(item.harga_satuan))}
              </td>
              <td className="py-4 text-sm text-gray-900 text-right font-mono">
                Rp {new Intl.NumberFormat("id-ID").format(Number(item.total_nilai))}
              </td>
              <td className="py-4 text-center">
                <span className={`inline-flex px-2 py-1 rounded text-xs ${
                  item.status === "tersedia"
                    ? "bg-green-50 text-green-700"
                    : item.status === "digunakan"
                    ? "bg-blue-50 text-blue-700"
                    : item.status === "maintenance"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="py-4 text-center">
                <button onClick={() => onEdit(item)} className="p-1 text-gray-500 hover:text-gray-900 mr-2" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(item)} className="p-1 text-red-500 hover:text-red-700" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RekonsiliasiProps = {
  onEdit?: (rekonsiliasi: any) => void;
  onDelete?: (rekonsiliasi: any) => void;
};

function RekonsiliasiContent({ onEdit, onDelete }: RekonsiliasiProps) {
  const [rekonsiliasiList, setRekonsiliasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRekonsiliasi, setSelectedRekonsiliasi] = useState<any | null>(null);

  const fetchRekonsiliasi = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/rekonsiliasi");
      if (res.ok) {
        const data = await res.json();
        setRekonsiliasiList(data);
      }
    } catch (err) {
      console.error("Gagal fetch rekonsiliasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekonsiliasi();
  }, []);

  const handleEditRekonsiliasi = (item: any) => {
    setSelectedRekonsiliasi(item);
    setIsModalOpen(true);
  };

  const handleDeleteRekonsiliasi = async (item: any) => {
    const confirmed = window.confirm(`Yakin ingin menghapus rekonsiliasi "${item.nama_bank}"?\n\nKlik OK untuk menghapus, atau Cancel untuk membatalkan.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/rekonsiliasi/${item.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Rekonsiliasi berhasil dihapus!");
        fetchRekonsiliasi();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal menghapus rekonsiliasi!");
      }
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    }
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("id-ID").format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Calculate summary
  const totalSelisih = rekonsiliasiList.reduce((sum, item) => {
    return sum + (Number(item.saldo_bank) - Number(item.saldo_buku));
  }, 0);

  const sesuaiCount = rekonsiliasiList.filter((item) => item.status === "sesuai").length;
  const selisihCount = rekonsiliasiList.filter((item) => item.status === "selisih").length;

  return (
    <div className="space-y-6">
          {/* Summary & Add Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Total Rekonsiliasi</div>
                <div className="font-mono text-xl text-gray-900">{rekonsiliasiList.length}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 mb-1">Sesuai</div>
                <div className="font-mono text-xl text-green-700">{sesuaiCount}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-700 mb-1">Ada Selisih</div>
                <div className="font-mono text-xl text-red-700">{selisihCount}</div>
              </div>
              <div className={`p-4 rounded-lg ${totalSelisih === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="text-sm text-gray-600 mb-1">Total Selisih</div>
                <div className={`font-mono text-xl ${totalSelisih === 0 ? "text-green-700" : "text-yellow-700"}`}>
                  Rp {formatCurrency(Math.abs(totalSelisih))}
                  {totalSelisih === 0 ? " ✅" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setSelectedRekonsiliasi(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
              Tambah Rekonsiliasi
            </button>
          </div>

      {/* Table */}
      {rekonsiliasiList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada data rekonsiliasi bank. Klik "Tambah" untuk menambah rekonsiliasi.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Bank
                </th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
                  No. Rekening
                </th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo per Buku
                </th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo per Bank
                </th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Selisih
                </th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rekonsiliasiList.map((item) => {
                const selisih = Number(item.saldo_bank) - Number(item.saldo_buku);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-4 text-sm text-gray-900">{item.nama_bank}</td>
                    <td className="py-4 text-sm font-mono text-gray-600">{item.nomor_rekening}</td>
                    <td className="py-4 text-sm text-gray-900 text-right font-mono">
                      Rp {formatCurrency(Number(item.saldo_buku))}
                    </td>
                    <td className="py-4 text-sm text-gray-900 text-right font-mono">
                      Rp {formatCurrency(Number(item.saldo_bank))}
                    </td>
                    <td className={`py-4 text-sm text-right font-mono ${selisih === 0 ? "text-green-700" : "text-red-600"}`}>
                      {selisih === 0 ? "-" : (selisih > 0 ? "+" : "-")} Rp {formatCurrency(Math.abs(selisih))}
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      {new Date(item.tanggal_rekonsiliasi).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", year: "numeric" 
                      })}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        item.status === "sesuai"
                          ? "bg-green-50 text-green-700"
                          : item.status === "selisih"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {item.status === "sesuai" ? "Sesuai" : item.status === "selisih" ? "Selisih" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button onClick={() => handleEditRekonsiliasi(item)} className="p-1 text-gray-500 hover:text-gray-900 mr-2" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRekonsiliasi(item)} className="p-1 text-red-500 hover:text-red-700" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rekonsiliasi Modal */}
      <RekonsiliasiModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedRekonsiliasi(null); }}
        editData={selectedRekonsiliasi}
        onSuccess={() => {
          console.log("Rekonsiliasi berhasil disimpan, refresh data...");
          setIsModalOpen(false);
          setSelectedRekonsiliasi(null);
          fetchRekonsiliasi();
        }}
      />
    </div>
  );
}
