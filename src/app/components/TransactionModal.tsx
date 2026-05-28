import { X, Loader2, Upload, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../lib/api";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "pemasukan" | "pengeluaran" | "kas" | "aset" | "inventaris";
  onSuccess: () => void; // Callback untuk refresh table
  editData?: {
    id: number;
    keterangan: string;
    jumlah: number;
    tipe: string;
    kategori: string;
    status: string;
    tanggal: string;
    nomor_invoice?: string | null;
    bukti_transaksi?: string | null;
  } | null;
}

// Helper: parse date string ke YYYY-MM-DD (timezone-safe)
// Accepts: "2025-08-21" or "2025-08-21T00:00:00.000Z" or "2025-08-21T17:00:00.000Z"
// Returns: "2025-08-21" (always, without Date object conversion)
const parseDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  // If already YYYY-MM-DD format (no T), return as-is
  if (!dateStr.includes("T")) return dateStr;
  // Extract YYYY-MM-DD from ISO string by splitting on T
  // This avoids timezone issues from new Date().toISOString()
  return dateStr.split("T")[0];
};

// Helper: get today's date as YYYY-MM-DD in LOCAL timezone (not UTC)
// Avoids timezone shift for users not in UTC+0
const getLocalDateString = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper: format number for display with thousand separators (id-ID locale)
// Input: 4242000000 → Output: "4.242.000.000"
// Input: 1000000 → Output: "1.000.000"
const formatNumberDisplay = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return "";
  return new Intl.NumberFormat("id-ID").format(Math.floor(num));
};

// Helper: parse display string to raw number
// Input: "4.242.000.000" → Output: 4242000000
// Input: "4242000000" → Output: 4242000000
// Input: "4242000000.00" → Output: 4242000000 (strips .00)
const parseAmountFromDisplay = (display: string): number => {
  if (!display || !display.trim()) return 0;
  // Remove all non-digits (dots, spaces, "Rp", etc.)
  const cleanDigits = display.replace(/[^\d]/g, "");
  if (!cleanDigits) return 0;
  return parseInt(cleanDigits, 10);
};

// Max value for DECIMAL(15,2): 99,999,999,999,999.99
const MAX_AMOUNT = 9999999999999;

export function TransactionModal({ 
  isOpen, 
  onClose, 
  type, 
  onSuccess,
  editData 
}: TransactionModalProps) {
  const isEditMode = Boolean(editData);
  const [tanggal, setTanggal] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{
    tanggal?: string;
    description?: string;
    amount?: string;
    category?: string;
  }>({});

  // Set default tanggal to today in local timezone
  useEffect(() => {
    if (!editData) {
      setTanggal(getLocalDateString());
    }
  }, [isOpen, editData]);

  // Fill form when editing
  useEffect(() => {
    if (editData) {
      // parseDateForInput already handles both YYYY-MM-DD and ISO strings
      setTanggal(parseDateForInput(editData.tanggal));
      setInvoiceNumber(editData.nomor_invoice ?? "");
      setDescription(editData.keterangan ?? "");
      setAmount(formatNumberDisplay(editData.jumlah ?? 0));
      setCategory(editData.kategori ?? "");
      setStatus(editData.status ?? "pending");
    } else {
      // Reset form when adding new - use local timezone-safe date
      setTanggal(getLocalDateString());
      setInvoiceNumber("");
      setDescription("");
      setAmount("");
      setCategory("");
      setStatus("pending");
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const titles = isEditMode
    ? {
        pemasukan: "Edit Pemasukan",
        pengeluaran: "Edit Pengeluaran",
        kas: "Edit Transaksi Kas",
        aset: "Edit Aset Tetap",
        inventaris: "Edit Inventaris",
      }
    : {
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
    // Parse the display value and re-format with thousand separators
    const rawNumber = parseAmountFromDisplay(value);
    if (rawNumber > 0) {
      setAmount(formatNumberDisplay(rawNumber));
    } else {
      setAmount(value); // Allow typing initially, format on blur or next digit
    }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB!");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak valid! Gunakan JPG, PNG, atau PDF.");
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB!");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak valid! Gunakan JPG, PNG, atau PDF.");
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    // Validation
    if (!tanggal) {
      newErrors.tanggal = "Tanggal wajib diisi";
    }
    if (!description.trim()) {
      newErrors.description = "Deskripsi wajib diisi";
    }
    const rawAmount = parseAmountFromDisplay(amount);
    if (!amount.trim()) {
      newErrors.amount = "Nominal wajib diisi";
    } else if (rawAmount <= 0) {
      newErrors.amount = "Nominal harus berupa angka positif";
    } else if (rawAmount > MAX_AMOUNT) {
      newErrors.amount = `Nominal terlalu besar (maks Rp ${formatNumberDisplay(MAX_AMOUNT)})`;
    }
    if (!category) {
      newErrors.category = "Kategori wajib dipilih";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('tanggal', tanggal);
      formData.append('keterangan', description);
      formData.append('jumlah', String(rawAmount));
      formData.append('tipe', type);
      formData.append('kategori', category);
      formData.append('status', status);
      if (invoiceNumber) {
        formData.append('nomor_invoice', invoiceNumber);
      }
      if (selectedFile) {
        formData.append('bukti_transaksi', selectedFile);
      }

      const endpoint = editData 
        ? `/transaksi/upload/${editData.id}` 
        : '/transaksi/upload';
      const method = editData ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menyimpan transaksi!");
        return;
      }

      // Success
      setDescription("");
      setAmount("");
      setCategory("");
      setSuggestedCategory("");
      setSelectedFile(null);
      setErrors({});
      setUploadProgress(100);
      onClose();
      onSuccess(); // Refresh table
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsLoading(false);
    }
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
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                No. {type === "pemasukan" ? "Invoice" : "Voucher"} *
              </label>
              <input
                type="text"
                name="invoiceNumber"
                placeholder={type === "pemasukan" ? "INV-2026-001" : "VCH-2026-001"}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
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

          {/* Existing bukti_transaksi display */}
          {isEditMode && editData?.bukti_transaksi && !selectedFile && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📎</span>
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Bukti tersimpan: {editData.bukti_transaksi.split("/").pop()}
                  </p>
                  <p className="text-xs text-green-600">File lama tidak berubah kecuali upload baru</p>
                </div>
              </div>
              <a
                href={`http://localhost:5000${editData.bukti_transaksi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Lihat bukti
              </a>
            </div>
          )}

          {/* Upload Bukti Transaksi */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {isEditMode ? "Upload Bukti Baru (Opsional)" : "Upload Bukti Transaksi"}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              id="file-upload"
            />
            {!selectedFile ? (
              <label 
                htmlFor="file-upload"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer block"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Klik untuk upload atau drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG (max 5MB)
                </p>
              </label>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{editData ? 'Update Transaksi' : 'Simpan Transaksi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}