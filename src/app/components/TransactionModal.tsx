import { X } from "lucide-react";
import { useState } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "pemasukan" | "pengeluaran" | "kas" | "aset" | "inventaris";
}

export function TransactionModal({ isOpen, onClose, type }: TransactionModalProps) {
  const [description, setDescription] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    category?: string;
  }>({});

  if (!isOpen) return null;

  const titles = {
    pemasukan: "Tambah Pemasukan",
    pengeluaran: "Tambah Pengeluaran",
    kas: "Tambah Transaksi Kas",
    aset: "Tambah Aset Tetap",
    inventaris: "Tambah Inventaris",
  };

  // Automated auto-categorization
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    if (errors.description) {
      setErrors(prev => {
        const { description, ...rest } = prev;
        return rest;
      });
    }
    
    // Auto-categorization logic (simulated AI)
    const lowerDesc = value.toLowerCase();
    if (lowerDesc.includes("grab") || lowerDesc.includes("gojek") || lowerDesc.includes("taxi")) {
      setSuggestedCategory("Transport");
    } else if (lowerDesc.includes("gaji") || lowerDesc.includes("salary")) {
      setSuggestedCategory("Gaji & Tunjangan");
    } else if (lowerDesc.includes("listrik") || lowerDesc.includes("air") || lowerDesc.includes("internet")) {
      setSuggestedCategory("Utilitas");
    } else if (lowerDesc.includes("iklan") || lowerDesc.includes("marketing") || lowerDesc.includes("ads")) {
      setSuggestedCategory("Marketing");
    } else if (lowerDesc.includes("penjualan") || lowerDesc.includes("invoice")) {
      setSuggestedCategory("Penjualan Produk");
    } else if (lowerDesc.includes("kantor") || lowerDesc.includes("supplies") || lowerDesc.includes("atk")) {
      setSuggestedCategory("Operasional");
    } else {
      setSuggestedCategory("");
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (errors.amount) {
      setErrors(prev => {
        const { amount, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (errors.category) {
      setErrors(prev => {
        const { category, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: typeof errors = {};

    // Validation
    if (!description.trim()) {
      newErrors.description = "Deskripsi wajib diisi";
    }
    if (!amount.trim()) {
      newErrors.amount = "Nominal wajib diisi";
    } else if (isNaN(Number(amount.replace(/\D/g, "")))) {
      newErrors.amount = "Nominal harus berupa angka";
    }
    if (!category) {
      newErrors.category = "Kategori wajib dipilih";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Success - close modal
    alert("Transaksi berhasil ditambahkan! (Simulasi)");
    setDescription("");
    setAmount("");
    setCategory("");
    setSuggestedCategory("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">{titles[type]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                defaultValue="2026-04-09"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                No. {type === "pemasukan" ? "Invoice" : "Voucher"} *
              </label>
              <input
                type="text"
                placeholder={type === "pemasukan" ? "INV-2026-001" : "VCH-2026-001"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Pilih Kategori</option>
              {type === "pemasukan" && (
                <>
                  <option>Penjualan Produk</option>
                  <option>Jasa Konsultasi</option>
                  <option>Pendapatan Investasi</option>
                  <option>Lainnya</option>
                </>
              )}
              {type === "pengeluaran" && (
                <>
                  <option>Gaji & Tunjangan</option>
                  <option>Operasional</option>
                  <option>Marketing</option>
                  <option>Utilitas</option>
                  <option>Lainnya</option>
                </>
              )}
              {type === "kas" && (
                <>
                  <option>Kas Masuk</option>
                  <option>Kas Keluar</option>
                  <option>Transfer Antar Kas</option>
                </>
              )}
              {type === "aset" && (
                <>
                  <option>Tanah & Bangunan</option>
                  <option>Kendaraan</option>
                  <option>Peralatan Kantor</option>
                  <option>Mesin & Peralatan</option>
                </>
              )}
              {type === "inventaris" && (
                <>
                  <option>Barang Jadi</option>
                  <option>Bahan Baku</option>
                  <option>Barang Dalam Proses</option>
                </>
              )}
            </select>
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Deskripsi *
            </label>
            <textarea
              rows={3}
              placeholder="Masukkan deskripsi transaksi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
            {suggestedCategory && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    💡 Saran Kategori (AI)
                  </p>
                  <p className="text-xs text-blue-700">
                    Sistem menyarankan kategori: <strong>{suggestedCategory}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Klik untuk apply atau pilih kategori manual di dropdown atas
                  </p>
                </div>
              </div>
            )}
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Nominal *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            {type === "inventaris" && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            )}

            {type === "aset" && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Umur Ekonomis (Tahun)
                </label>
                <input
                  type="number"
                  placeholder="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Upload Bukti Transaksi
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <p className="text-sm text-gray-600">
                Klik untuk upload atau drag & drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG (max 5MB)
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              onClick={handleSubmit}
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}