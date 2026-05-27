import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, CheckCircle, Clock, Calendar, Trash2, Pencil } from "lucide-react";
import { TransactionModal } from "../components/TransactionModal.tsx";
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
};

export function PembukuanPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pemasukan");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  useEffect(() => {
    fetchTransaksi();
  }, []);

  const handleAddData = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = window.confirm(`Yakin ingin menghapus transaksi "${transaction.keterangan}"?\n\nTindakan ini tidak dapat dibatalkan.`);
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

  // Hitung summary dari transactions
  const totalPemasukan = transactions
    .filter((t) => t.tipe === "pemasukan")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);
  const totalPengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.jumlah), 0);
  const netCashFlow = totalPemasukan - totalPengeluaran;
  const countPemasukan = transactions.filter((t) => t.tipe === "pemasukan").length;
  const countPengeluaran = transactions.filter((t) => t.tipe === "pengeluaran").length;

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
      {/* Annotation */}
      <div className="p-6 bg-white border-l-4 border-gray-900 rounded-lg shadow-sm">
        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          📌 HALAMAN 3 — PEMBUKUAN (FITUR UTAMA 1) - UPGRADE: ADVANCED FEATURES
        </h4>
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <div>
            <span className="font-semibold">FUNGSI PEMBUKUAN:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Sistem input dan manajemen seluruh transaksi keuangan perusahaan</li>
              <li>Mendukung multi-kategori untuk organisasi data yang terstruktur</li>
              <li>Real-time update saldo kas dan asset tracking</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">🔍 ADVANCED FILTER (NEW):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Filter by Date:</strong> Custom range picker dengan preset (hari ini, minggu ini, bulan ini)</li>
              <li><strong>Filter by Category:</strong> Multi-select kategori transaksi</li>
              <li><strong>Filter by Type:</strong> Pemasukan/Pengeluaran/Semua</li>
              <li><strong>Filter by Status:</strong> Valid ✅ / Pending ⏳ (untuk transaksi yang perlu approval)</li>
              <li><strong>Search:</strong> Real-time search by no. ref, deskripsi, atau nominal</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">📊 SUMMARY BOX (NEW):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Total Pemasukan:</strong> Sum dari semua pemasukan terfilter</li>
              <li><strong>Total Pengeluaran:</strong> Sum dari semua pengeluaran terfilter</li>
              <li><strong>Net Cash Flow:</strong> Selisih pemasukan - pengeluaran dengan color indicator</li>
              <li>Update real-time saat filter berubah</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">🧾 TRANSACTION STATUS (NEW):</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Valid (✅):</strong> Transaksi sudah di-approve dan masuk ke laporan keuangan</li>
              <li><strong>Pending (⏳):</strong> Menunggu approval dari atasan (workflow system)</li>
              <li>Status badge dengan color-coding untuk visibility</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">TABS KATEGORI:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Pemasukan:</strong> Pendapatan penjualan, jasa, investasi (No. Referensi/Invoice)</li>
              <li><strong>Pengeluaran:</strong> Biaya operasional, gaji, marketing (No. Voucher)</li>
              <li><strong>Kas:</strong> Monitoring saldo awal, mutasi, saldo akhir cash flow</li>
              <li><strong>Aset Tetap:</strong> Fixed assets (gedung, kendaraan) + depresiasi</li>
              <li><strong>Inventaris:</strong> Stock barang, qty, harga satuan, total nilai</li>
              <li><strong>Rekonsiliasi Bank:</strong> Matching saldo per buku vs per bank</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">USER ROLE ACCESS:</span> Admin (full CRUD), Pimpinan (read only + approve pending)
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Pembukuan</h1>
          <p className="text-sm text-gray-500">
            Catat dan kelola semua transaksi keuangan perusahaan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800" onClick={handleAddData}>
            <Plus className="w-4 h-4" />
            Tambah Transaksi
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
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <button 
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Filter className="w-4 h-4" />
              {showAdvancedFilter ? "Hide" : "Show"} Advanced Filter
            </button>
            <select className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
              <option>Semua Periode</option>
              <option>Hari Ini</option>
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>Custom Range</option>
            </select>
            <select className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
              <option>Semua Kategori</option>
              <option>Penjualan</option>
              <option>Jasa</option>
              <option>Investasi</option>
              <option>Lainnya</option>
            </select>
            <select className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
              <option>Semua Status</option>
              <option>✅ Valid</option>
              <option>⏳ Pending</option>
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari no. ref, deskripsi, nominal..."
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Advanced Filter Panel */}
          {showAdvancedFilter && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">🔍 Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Mulai</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      defaultValue="2026-04-01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Akhir</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      defaultValue="2026-04-09"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipe Transaksi</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Semua Tipe</option>
                    <option>Pemasukan</option>
                    <option>Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nominal Min</label>
                  <input 
                    type="text" 
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nominal Max</label>
                  <input 
                    type="text" 
                    placeholder="Rp 999.999.999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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
          {activeTab === "pemasukan" && <PemasukanContent transactions={transactions.filter(t => t.tipe === "pemasukan")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "pengeluaran" && <PengeluaranContent transactions={transactions.filter(t => t.tipe === "pengeluaran")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "kas" && <KasContent />}
          {activeTab === "aset" && <AsetContent />}
          {activeTab === "inventaris" && <InventarisContent />}
          {activeTab === "rekonsiliasi" && <RekonsiliasiContent />}
        </div>
      </div>

      {/* Transaction Modal */}
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
              <td className="py-4 text-sm font-mono text-gray-600">INV-{String(t.id).padStart(4, "0")}</td>
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
              <td className="py-4 text-sm font-mono text-gray-600">VCH-{String(t.id).padStart(4, "0")}</td>
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

function KasContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Saldo Awal</div>
          <div className="font-mono text-gray-900">Rp 425.000.000</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Total Mutasi</div>
          <div className="font-mono text-gray-900">+Rp 25.000.000</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Saldo Akhir</div>
          <div className="font-mono text-gray-900">Rp 450.000.000</div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Tabel mutasi kas akan ditampilkan di sini...
      </div>
    </div>
  );
}

function AsetContent() {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="py-4 text-sm font-mono text-gray-600">AST-001</td>
            <td className="py-4 text-sm text-gray-900">Gedung Kantor</td>
            <td className="py-4 text-sm text-gray-600">Bangunan</td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 2.500.000.000
            </td>
            <td className="py-4 text-sm text-gray-600 text-right font-mono">
              Rp 625.000.000
            </td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 1.875.000.000
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="py-4 text-sm font-mono text-gray-600">AST-002</td>
            <td className="py-4 text-sm text-gray-900">Kendaraan Operasional</td>
            <td className="py-4 text-sm text-gray-600">Kendaraan</td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 450.000.000
            </td>
            <td className="py-4 text-sm text-gray-600 text-right font-mono">
              Rp 180.000.000
            </td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 270.000.000
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function InventarisContent() {
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
            <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase">
              Stok
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Harga Satuan
            </th>
            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">
              Total Nilai
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="py-4 text-sm font-mono text-gray-600">BRG-001</td>
            <td className="py-4 text-sm text-gray-900">Laptop Dell XPS 15</td>
            <td className="py-4 text-sm text-gray-900 text-center">12</td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 18.500.000
            </td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 222.000.000
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="py-4 text-sm font-mono text-gray-600">BRG-002</td>
            <td className="py-4 text-sm text-gray-900">Printer Canon G3000</td>
            <td className="py-4 text-sm text-gray-900 text-center">5</td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 3.200.000
            </td>
            <td className="py-4 text-sm text-gray-900 text-right font-mono">
              Rp 16.000.000
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RekonsiliasiContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">
          Rekonsiliasi Bank - April 2026
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Saldo per Buku</div>
            <div className="font-mono text-gray-900">Rp 450.000.000</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Saldo per Bank</div>
            <div className="font-mono text-gray-900">Rp 452.300.000</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Selisih</div>
            <div className="font-mono text-red-600">Rp 2.300.000</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded">
              Perlu Rekonsiliasi
            </span>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Detail perbedaan dan adjustment akan ditampilkan di sini...
      </div>
    </div>
  );
}