import { X, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";

interface AsetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback untuk refresh table
  editData?: {
    id: number;
    nama_aset: string;
    kategori: string;
    nilai_aset: number;
    tanggal_perolehan: string;
    umur_ekonomis: number;
    status: string;
    akumulasi_depresiasi?: number;
    nilai_buku?: number;
  } | null;
}

// Helper: Format ISO datetime ke YYYY-MM-DD untuk input date
const getToday = (): string => new Date().toISOString().split('T')[0] as string;

const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return getToday();
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] as string;
  } catch {
    return getToday();
  }
};

export function AsetModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  editData 
}: AsetModalProps) {
  const [namaAset, setNamaAset] = useState("");
  const [kategori, setKategori] = useState("");
  const [nilaiAset, setNilaiAset] = useState("");
  const [tanggalPerolehan, setTanggalPerolehan] = useState("");
  const [umurEkonomis, setUmurEkonomis] = useState("");
  const [status, setStatus] = useState("aktif");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    namaAset?: string;
    kategori?: string;
    nilaiAset?: string;
    tanggalPerolehan?: string;
    umurEkonomis?: string;
  }>({});

  // Set default tanggal to today
  useEffect(() => {
    setTanggalPerolehan(getToday());
  }, [isOpen]);

  // Fill form when editing
  useEffect(() => {
    const today = getToday();
    
    if (editData) {
      setNamaAset(editData.nama_aset ?? "");
      setKategori(editData.kategori ?? "");
      setNilaiAset(String(editData.nilai_aset ?? ""));
      setTanggalPerolehan(formatDateForInput(editData.tanggal_perolehan ?? null));
      setUmurEkonomis(String(editData.umur_ekonomis ?? ""));
      setStatus(editData.status ?? "aktif");
    } else {
      // Reset form when adding new
      setNamaAset("");
      setKategori("");
      setNilaiAset("");
      setTanggalPerolehan(today);
      setUmurEkonomis("");
      setStatus("aktif");
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    // Validation
    if (!namaAset.trim()) {
      newErrors.namaAset = "Nama aset wajib diisi";
    }
    if (!nilaiAset.trim()) {
      newErrors.nilaiAset = "Nilai aset wajib diisi";
    } else if (isNaN(Number(nilaiAset.replace(/\D/g, "")))) {
      newErrors.nilaiAset = "Nilai aset harus berupa angka";
    }
    if (!tanggalPerolehan) {
      newErrors.tanggalPerolehan = "Tanggal perolehan wajib diisi";
    }
    if (!umurEkonomis.trim()) {
      newErrors.umurEkonomis = "Umur ekonomis wajib diisi";
    } else if (isNaN(Number(umurEkonomis)) || Number(umurEkonomis) <= 0) {
      newErrors.umurEkonomis = "Umur ekonomis harus berupa angka positif";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nama_aset: namaAset,
        kategori: kategori || "lainnya",
        nilai_aset: Number(nilaiAset.replace(/\D/g, "")),
        tanggal_perolehan: tanggalPerolehan,
        umur_ekonomis: Number(umurEkonomis),
        status: status,
      };

      const endpoint = editData 
        ? `/aset/${editData.id}` 
        : '/aset';
      const method = editData ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menyimpan aset!");
        return;
      }

      // Success - reset form and close
      setNamaAset("");
      setKategori("");
      setNilaiAset("");
      setUmurEkonomis("");
      setErrors({});
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
          <h2 className="text-lg font-semibold text-gray-900">
            {editData ? "Edit Aset Tetap" : "Tambah Aset Tetap"}
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
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Nama Aset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Aset *
            </label>
            <input
              type="text"
              value={namaAset}
              onChange={(e) => {
                setNamaAset(e.target.value);
                if (errors.namaAset) setErrors(prev => ({ ...prev, namaAset: undefined }));
              }}
              placeholder="Contoh: Gedung Kantor Pusat"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                errors.namaAset ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.namaAset && (
              <p className="text-sm text-red-500 mt-1">{errors.namaAset}</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">Pilih Kategori</option>
              <option value="tanah_bangunan">Tanah & Bangunan</option>
              <option value="kendaraan">Kendaraan</option>
              <option value="peralatan_kantor">Peralatan Kantor</option>
              <option value="mesin_peralatan">Mesin & Peralatan</option>
              <option value="elektronik">Elektronik</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          {/* Grid: Tanggal & Umur Ekonomis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal Perolehan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Perolehan *
              </label>
              <input
                type="date"
                value={tanggalPerolehan}
                onChange={(e) => {
                  setTanggalPerolehan(e.target.value);
                  if (errors.tanggalPerolehan) setErrors(prev => ({ ...prev, tanggalPerolehan: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.tanggalPerolehan ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.tanggalPerolehan && (
                <p className="text-sm text-red-500 mt-1">{errors.tanggalPerolehan}</p>
              )}
            </div>

            {/* Umur Ekonomis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umur Ekonomis (Tahun) *
              </label>
              <input
                type="number"
                value={umurEkonomis}
                onChange={(e) => {
                  setUmurEkonomis(e.target.value);
                  if (errors.umurEkonomis) setErrors(prev => ({ ...prev, umurEkonomis: undefined }));
                }}
                placeholder="5"
                min="1"
                max="50"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  errors.umurEkonomis ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.umurEkonomis && (
                <p className="text-sm text-red-500 mt-1">{errors.umurEkonomis}</p>
              )}
            </div>
          </div>

          {/* Nilai Aset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nilai Perolehan (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={nilaiAset}
                onChange={(e) => {
                  setNilaiAset(e.target.value);
                  if (errors.nilaiAset) setErrors(prev => ({ ...prev, nilaiAset: undefined }));
                }}
                placeholder="0"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono ${
                  errors.nilaiAset ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.nilaiAset && (
              <p className="text-sm text-red-500 mt-1">{errors.nilaiAset}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="aktif">Aktif</option>
              <option value="dijual">Dijual</option>
              <option value="dihapuskan">Dihapuskan</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm">
                <p className="font-medium text-blue-900">Informasi Depresiasi</p>
                <p className="text-blue-700 mt-1">
                  Depresiasi akan dihitung otomatis berdasarkan umur ekonomis.
                  Nilai buku = Nilai Perolehan - Akumulasi Depresiasi.
                </p>
              </div>
            </div>
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
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  {editData ? <CheckCircle className="w-4 h-4" /> : null}
                  <span>{editData ? "Update Aset" : "Simpan Aset"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
