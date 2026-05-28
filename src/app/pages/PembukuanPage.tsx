// Helper: format YYYY-MM-DD string ke "28 Mei 2026" (id-ID) without Date object
// Avoids timezone shift from new Date(tanggal).toLocaleDateString()
const formatDateDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  // dateStr should be YYYY-MM-DD from DATE_FORMAT in SQL
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr; // fallback to raw if unexpected format
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${day} ${monthNames[month - 1]} ${year}`;
};

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, CheckCircle, Clock, Calendar, Trash2, Pencil, RefreshCw } from "lucide-react";
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

export function PembukuanPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pemasukan");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

      {/* Page Header - REDESIGN */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span>Pembukuan</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">📒 Pembukuan</h1>
            <p className="text-gray-300 text-sm">
              Catat dan kelola semua transaksi keuangan perusahaan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === "kas" || activeTab === "rekonsiliasi"
                  ? "bg-white/10 text-white/50 cursor-not-allowed border border-white/20"
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
              }`}
              onClick={handleAddData}
              disabled={activeTab === "kas" || activeTab === "rekonsiliasi"}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Tambah Transaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - REDESIGN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const icons: Record<string, string> = {
              pemasukan: "💰",
              pengeluaran: "💸",
              kas: "🏦",
              aset: "🏢",
              inventaris: "📦",
              rekonsiliasi: "📋",
            };
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{icons[tab.id]}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filters - REDESIGN */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <button 
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showAdvancedFilter 
                  ? "bg-gray-900 text-white" 
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              {showAdvancedFilter ? "Sembunyikan" : "Filter Lanjutan"}
            </button>
            <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option>Semua Periode</option>
              <option>Hari Ini</option>
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>Custom Range</option>
            </select>
            <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option>Semua Kategori</option>
              <option>Penjualan</option>
              <option>Jasa</option>
              <option>Investasi</option>
              <option>Lainnya</option>
            </select>
            <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option>Semua Status</option>
              <option>✅ Valid</option>
              <option>⏳ Pending</option>
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari no. ref, deskripsi, nominal..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Advanced Filter Panel - REDESIGN */}
          {showAdvancedFilter && (
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  🔍 Filter Lanjutan
                </h4>
                <button className="text-xs text-gray-500 hover:text-gray-700">Reset</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Tanggal Mulai</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue="2026-04-01"
                    />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Tanggal Akhir</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue="2026-04-09"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Tipe</label>
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option>Semua</option>
                    <option>Pemasukan</option>
                    <option>Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Nominal Min</label>
                  <input 
                    type="text" 
                    placeholder="Rp 0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Nominal Max</label>
                  <input 
                    type="text" 
                    placeholder="Rp 999.999.999"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium shadow-lg shadow-emerald-500/30 transition-all">
                    Terapkan Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 📊 SUMMARY BOX (BEFORE TABLE) - REDESIGN */}
        {(activeTab === "pemasukan" || activeTab === "pengeluaran") && (
          <div className="px-6 pt-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Pemasukan */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <span className="text-white text-lg">💰</span>
                    </div>
                    <div className="text-sm font-medium text-green-800">Total Pemasukan</div>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">{countPemasukan} transaksi</span>
                </div>
                <div className="font-mono text-2xl font-bold text-green-700">
                  Rp {new Intl.NumberFormat("id-ID").format(totalPemasukan)}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                  <span>📈</span>
                  <span>Pendapatan bulan ini</span>
                </div>
              </div>

              {/* Total Pengeluaran */}
              <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                      <span className="text-white text-lg">💸</span>
                    </div>
                    <div className="text-sm font-medium text-red-800">Total Pengeluaran</div>
                  </div>
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">{countPengeluaran} transaksi</span>
                </div>
                <div className="font-mono text-2xl font-bold text-red-700">
                  Rp {new Intl.NumberFormat("id-ID").format(totalPengeluaran)}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <span>📉</span>
                  <span>Biaya bulan ini</span>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                netCashFlow >= 0 
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200" 
                  : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                      netCashFlow >= 0 
                        ? "bg-emerald-500 shadow-emerald-500/30" 
                        : "bg-orange-500 shadow-orange-500/30"
                    }`}>
                      <span className="text-white text-lg">{netCashFlow >= 0 ? "📊" : "⚠️"}</span>
                    </div>
                    <div className={`text-sm font-medium ${netCashFlow >= 0 ? "text-emerald-800" : "text-orange-800"}`}>
                      Net Cash Flow
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    netCashFlow >= 0 
                      ? "bg-emerald-200 text-emerald-800" 
                      : "bg-orange-200 text-orange-800"
                  }`}>
                    {netCashFlow >= 0 ? "Positif ✅" : "Negatif ⚠️"}
                  </span>
                </div>
                <div className={`font-mono text-2xl font-bold ${
                  netCashFlow >= 0 ? "text-emerald-700" : "text-orange-700"
                }`}>
                  {netCashFlow >= 0 ? "+" : "-"} Rp {new Intl.NumberFormat("id-ID").format(Math.abs(netCashFlow))}
                </div>
                <div className={`flex items-center gap-1 mt-2 text-xs ${
                  netCashFlow >= 0 ? "text-emerald-600" : "text-orange-600"
                }`}>
                  <span>{netCashFlow >= 0 ? "🎉" : "📊"}</span>
                  <span>{netCashFlow >= 0 ? "Keuntungan bersih" : "Rugi bersih"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pemasukan" && <PemasukanContent transactions={transactions.filter(t => t.tipe === "pemasukan")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "pengeluaran" && <PengeluaranContent transactions={transactions.filter(t => t.tipe === "pengeluaran")} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />}
          {activeTab === "kas" && (
            <KasContent
              transactions={transactions}
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
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data pemasukan...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">💰</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Transaksi Pemasukan</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
          Tambahkan transaksi pemasukan pertama Anda dengan klik tombol "Tambah Transaksi"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Referensi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nominal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-emerald-50/50 transition-colors group">
                <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                  {formatDateDisplay(t.tanggal)}
                </td>
                <td className="px-4 py-4 text-sm font-mono text-emerald-700 bg-emerald-50/50">
                  {t.nomor_invoice || `INV-${String(t.id).padStart(4, "0")}`}
                </td>
                <td className="px-4 py-4 text-sm text-gray-800">{t.keterangan}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{t.kategori}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    t.status === "valid" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  }`}>
                    {t.status === "valid" ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {t.status === "valid" ? "Valid" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-green-700 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(t.jumlah))}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(t)} 
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" 
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(t)} 
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PengeluaranContent({ transactions, isLoading, onEdit, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data pengeluaran...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">💸</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Transaksi Pengeluaran</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
          Tambahkan transaksi pengeluaran pertama Anda dengan klik tombol "Tambah Transaksi"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Voucher</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nominal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-red-50/50 transition-colors group">
                <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                  {formatDateDisplay(t.tanggal)}
                </td>
                <td className="px-4 py-4 text-sm font-mono text-red-700 bg-red-50/50">
                  {t.nomor_invoice || `VCH-${String(t.id).padStart(4, "0")}`}
                </td>
                <td className="px-4 py-4 text-sm text-gray-800">{t.keterangan}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{t.kategori}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    t.status === "valid" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  }`}>
                    {t.status === "valid" ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {t.status === "valid" ? "Valid" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-red-700 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(t.jumlah))}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(t)} 
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" 
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(t)} 
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data kas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Boxes - REDESIGN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🏦</span>
              </div>
              <span className="text-sm font-medium text-blue-800">Saldo Awal</span>
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-blue-700">
            Rp {formatCurrency(saldoAwal)}
          </div>
        </div>
        <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
          totalMutasi >= 0 
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200" 
            : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalMutasi >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}>
                <span className="text-white text-sm">{totalMutasi >= 0 ? "📈" : "📉"}</span>
              </div>
              <span className={`text-sm font-medium ${totalMutasi >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                Total Mutasi
              </span>
            </div>
            <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
              {transactions.length} transaksi
            </span>
          </div>
          <div className={`font-mono text-2xl font-bold ${totalMutasi >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {totalMutasi >= 0 ? "+" : "-"} Rp {formatCurrency(totalMutasi)}
          </div>
        </div>
        <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
          saldoAkhir >= 0 
            ? "bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200" 
            : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                saldoAkhir >= 0 ? "bg-violet-500" : "bg-orange-500"
              }`}>
                <span className="text-white text-sm">💰</span>
              </div>
              <span className={`text-sm font-medium ${saldoAkhir >= 0 ? "text-violet-800" : "text-orange-800"}`}>
                Saldo Akhir
              </span>
            </div>
          </div>
          <div className={`font-mono text-2xl font-bold ${saldoAkhir >= 0 ? "text-violet-700" : "text-orange-700"}`}>
            Rp {formatCurrency(saldoAkhir)}
          </div>
        </div>
      </div>

      {/* Tabel Mutasi Kas - REDESIGN */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🏦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Mutasi Kas</h3>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
            Mutasi kas akan muncul setelah ada transaksi pemasukan atau pengeluaran
          </p>
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
                    {formatDateDisplay(t.tanggal)}
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
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data aset tetap...</p>
      </div>
    );
  }

  if (asetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🏢</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Aset Tetap</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
          Tambahkan aset tetap pertama Anda dengan klik tombol "Tambah Transaksi"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode Aset</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Aset</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nilai Perolehan</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Akumulasi Depresiasi</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nilai Buku</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {asetList.map((aset, index) => (
              <tr key={aset.id} className="hover:bg-violet-50/50 transition-colors group">
                <td className="px-4 py-4 text-sm font-mono text-violet-700 bg-violet-50/50">
                  AST-{String(index + 1).padStart(3, "0")}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 font-medium">{aset.nama_aset}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">{aset.kategori}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(aset.nilai_aset))}
                </td>
                <td className="px-4 py-4 text-sm text-red-600 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(aset.akumulasi_depresiasi || 0))}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-violet-700 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(aset.nilai_buku || aset.nilai_aset))}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                    aset.status === "aktif"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : aset.status === "dijual"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {aset.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(aset)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(aset)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data inventaris...</p>
      </div>
    );
  }

  if (inventarisList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Inventaris</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
          Tambahkan inventaris pertama Anda dengan klik tombol "Tambah Transaksi"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode Barang</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Barang</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stok</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga Satuan</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Nilai</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventarisList.map((item, index) => (
              <tr key={item.id} className="hover:bg-amber-50/50 transition-colors group">
                <td className="px-4 py-4 text-sm font-mono text-amber-700 bg-amber-50/50">
                  BRG-{String(index + 1).padStart(3, "0")}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.nama_barang}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">{item.kategori}</span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="font-medium text-gray-900">{item.jumlah}</span>
                  <span className="text-gray-500 text-xs ml-1">{item.satuan}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(item.harga_satuan))}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-amber-700 text-right font-mono">
                  Rp {new Intl.NumberFormat("id-ID").format(Number(item.total_nilai))}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                    item.status === "tersedia"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : item.status === "digunakan"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : item.status === "maintenance"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Memuat data rekonsiliasi...</p>
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
      {/* Summary & Add Button - REDESIGN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <span className="text-sm font-medium text-cyan-800">Total Rekonsiliasi</span>
          </div>
          <div className="font-mono text-2xl font-bold text-cyan-700">{rekonsiliasiList.length}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">✅</span>
            </div>
            <span className="text-sm font-medium text-green-800">Sesuai</span>
          </div>
          <div className="font-mono text-2xl font-bold text-green-700">{sesuaiCount}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <span className="text-sm font-medium text-red-800">Ada Selisih</span>
          </div>
          <div className="font-mono text-2xl font-bold text-red-700">{selisihCount}</div>
        </div>
        <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
          totalSelisih === 0 
            ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200" 
            : "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              totalSelisih === 0 ? "bg-green-500" : "bg-yellow-500"
            }`}>
              <span className="text-white text-sm">{totalSelisih === 0 ? "🎉" : "📊"}</span>
            </div>
            <span className={`text-sm font-medium ${totalSelisih === 0 ? "text-green-800" : "text-yellow-800"}`}>
              Total Selisih
            </span>
          </div>
          <div className={`font-mono text-2xl font-bold ${totalSelisih === 0 ? "text-green-700" : "text-yellow-700"}`}>
            Rp {formatCurrency(Math.abs(totalSelisih))}
          </div>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            onClick={() => { setSelectedRekonsiliasi(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Rekonsiliasi
          </button>
        </div>
      </div>

      {/* Table - REDESIGN */}
      {rekonsiliasiList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Rekonsiliasi Bank</h3>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
            Tambahkan rekonsiliasi bank pertama Anda dengan klik tombol "Tambah Rekonsiliasi"
          </p>
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
