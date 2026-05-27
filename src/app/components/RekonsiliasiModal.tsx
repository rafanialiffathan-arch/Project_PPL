import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";

interface Rekonsiliasi {
  id?: number;
  nama_bank: string;
  nomor_rekening: string;
  saldo_buku: number;
  saldo_bank: number;
  tanggal_rekonsiliasi: string;
  status: string;
  catatan: string;
}

interface RekonsiliasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Rekonsiliasi | null;
  onSuccess?: () => void;
}

export function RekonsiliasiModal({ isOpen, onClose, editData, onSuccess }: RekonsiliasiModalProps) {
  const [nama_bank, setNamaBank] = useState("");
  const [nomor_rekening, setNomorRekening] = useState("");
  const [saldo_buku, setSaldoBuku] = useState("");
  const [saldo_bank, setSaldoBank] = useState("");
  const [tanggal_rekonsiliasi, setTanggal] = useState("");
  const [status, setStatus] = useState("pending");
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opened with different data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setNamaBank(editData.nama_bank || "");
        setNomorRekening(editData.nomor_rekening || "");
        setSaldoBuku(String(editData.saldo_buku ?? ""));
        setSaldoBank(String(editData.saldo_bank ?? ""));
        setTanggal(editData.tanggal_rekonsiliasi ?? "");
        setStatus(editData.status || "pending");
        setCatatan(editData.catatan ?? "");
      } else {
        setNamaBank("");
        setNomorRekening("");
        setSaldoBuku("");
        setSaldoBank("");
        setTanggal(new Date().toISOString().split("T")[0]);
        setStatus("pending");
        setCatatan("");
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  // Calculate preview selisih
  const selisihPreview = Number(saldo_bank || 0) - Number(saldo_buku || 0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!nama_bank.trim()) newErrors.nama_bank = "Nama bank wajib diisi";
    if (!nomor_rekening.trim()) newErrors.nomor_rekening = "Nomor rekening wajib diisi";
    if (!saldo_buku || isNaN(Number(saldo_buku))) newErrors.saldo_buku = "Saldo buku wajib diisi (angka)";
    if (!saldo_bank || isNaN(Number(saldo_bank))) newErrors.saldo_bank = "Saldo bank wajib diisi (angka)";
    if (!tanggal_rekonsiliasi) newErrors.tanggal_rekonsiliasi = "Tanggal wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nama_bank,
        nomor_rekening,
        saldo_buku: Number(saldo_buku),
        saldo_bank: Number(saldo_bank),
        tanggal_rekonsiliasi,
        status,
        catatan,
      };

      const url = editData?.id ? `/rekonsiliasi/${editData.id}` : "/rekonsiliasi";
      const method = editData?.id ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Rekonsiliasi berhasil disimpan!");
        onSuccess?.();
        onClose();
      } else {
        alert(data.message || "Gagal menyimpan rekonsiliasi");
      }
    } catch (err) {
      console.error("Error saving rekonsiliasi:", err);
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("id-ID").format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editData ? "Edit Rekonsiliasi Bank" : "Tambah Rekonsiliasi Bank"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Bank *
              </label>
              <input
                type="text"
                value={nama_bank}
                onChange={(e) => setNamaBank(e.target.value)}
                placeholder="Bank Central Asia"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.nama_bank ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.nama_bank && (
                <p className="text-sm text-red-500 mt-1">{errors.nama_bank}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Rekening *
              </label>
              <input
                type="text"
                value={nomor_rekening}
                onChange={(e) => setNomorRekening(e.target.value)}
                placeholder="123-456-7890"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.nomor_rekening ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.nomor_rekening && (
                <p className="text-sm text-red-500 mt-1">{errors.nomor_rekening}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo per Buku *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={saldo_buku}
                  onChange={(e) => setSaldoBuku(e.target.value)}
                  placeholder="0"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono ${
                    errors.saldo_buku ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.saldo_buku && (
                <p className="text-sm text-red-500 mt-1">{errors.saldo_buku}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo per Bank *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={saldo_bank}
                  onChange={(e) => setSaldoBank(e.target.value)}
                  placeholder="0"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono ${
                    errors.saldo_bank ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.saldo_bank && (
                <p className="text-sm text-red-500 mt-1">{errors.saldo_bank}</p>
              )}
            </div>
          </div>

          {/* Selisih Preview */}
          {saldo_buku && saldo_bank && (
            <div className={`p-4 rounded-lg border ${
              selisihPreview === 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Selisih Preview</div>
                <div className={`font-mono font-semibold ${
                  selisihPreview === 0 ? "text-green-700" : "text-red-600"
                }`}>
                  Rp {formatCurrency(Math.abs(selisihPreview))}
                  {selisihPreview === 0 ? " SESUAI" : " SELISIH"}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Rekonsiliasi *
              </label>
              <input
                type="date"
                value={tanggal_rekonsiliasi}
                onChange={(e) => setTanggal(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.tanggal_rekonsiliasi ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.tanggal_rekonsiliasi && (
                <p className="text-sm text-red-500 mt-1">{errors.tanggal_rekonsiliasi}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status (Auto-calculated)
              </label>
              <select
                value={status}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              >
                <option value="pending">Pending</option>
                <option value="sesuai">Sesuai</option>
                <option value="selisih">Selisih</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                * Status dihitung otomatis dari selisih
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Rekonsiliasi"}
          </button>
        </div>
      </div>
    </div>
  );
}