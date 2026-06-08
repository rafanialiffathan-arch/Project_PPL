import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Inventaris = {
  id?: number;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  harga_satuan: number;
  total_nilai?: number;
  tanggal_masuk: string;
  kondisi: string;
  status: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editData: Inventaris | null;
  onSuccess: () => void;
};

export function InventarisModal({ isOpen, onClose, editData, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("elektronik");
  const [jumlah, setJumlah] = useState("");
  const [satuan, setSatuan] = useState("unit");
  const [hargaSatuan, setHargaSatuan] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  const [kondisi, setKondisi] = useState("baik");
  const [status, setStatus] = useState("tersedia");

  // Total nilai auto-calculate
  const totalNilai = Number(jumlah || 0) * Number(hargaSatuan || 0);

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setNamaBarang(editData.nama_barang || "");
        setKategori(editData.kategori || "elektronik");
        setJumlah(String(editData.jumlah || ""));
        setSatuan(editData.satuan || "unit");
        setHargaSatuan(String(editData.harga_satuan || ""));
        setTanggalMasuk(editData.tanggal_masuk ? formatDateForInput(editData.tanggal_masuk) : getToday());
        setKondisi(editData.kondisi ?? "baik");
        setStatus(editData.status ?? "tersedia");
      } else {
        // Reset form for new entry
        setNamaBarang("");
        setKategori("elektronik");
        setJumlah("");
        setSatuan("unit");
        setHargaSatuan("");
        setTanggalMasuk(getToday());
        setKondisi("baik");
        setStatus("tersedia");
      }
      setError("");
    }
  }, [isOpen, editData]);

  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return getToday();
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0] ?? getToday();
  };

  const getToday = (): string => {
    return new Date().toISOString().split("T")[0] ?? "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi
    if (!namaBarang.trim()) {
      setError("Nama barang wajib diisi!");
      return;
    }
    if (!jumlah || Number(jumlah) <= 0) {
      setError("Jumlah harus lebih dari 0!");
      return;
    }
    if (!hargaSatuan || Number(hargaSatuan) <= 0) {
      setError("Harga satuan harus lebih dari 0!");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nama_barang: namaBarang.trim(),
        kategori,
        jumlah: Number(jumlah),
        satuan,
        harga_satuan: Number(hargaSatuan),
        tanggal_masuk: tanggalMasuk,
        kondisi,
        status,
      };

      const res = await apiFetch(
        editData?.id ? `/inventaris/${editData.id}` : "/inventaris",
        {
          method: editData?.id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal menyimpan inventaris!");
        return;
      }

      onSuccess();
    } catch {
      setError("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {editData?.id ? "Edit Inventaris" : "Tambah Inventaris"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Nama Barang */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Laptop Dell XPS 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="elektronik">Elektronik</option>
                <option value="furniture">Furniture</option>
                <option value="kendaraan">Kendaraan</option>
                <option value="perlengkapan">Perlengkapan Kantor</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {/* Jumlah & Satuan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan
                </label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="unit">Unit</option>
                  <option value="pcs">Pcs</option>
                  <option value="box">Box</option>
                  <option value="lembar">Lembar</option>
                  <option value="meter">Meter</option>
                  <option value="kg">Kg</option>
                  <option value="liter">Liter</option>
                </select>
              </div>
            </div>

            {/* Harga Satuan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Satuan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={hargaSatuan}
                onChange={(e) => setHargaSatuan(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono"
                required
              />
            </div>

            {/* Total Nilai (Auto-calculate) */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total Nilai</div>
              <div className="font-mono text-xl text-gray-900">
                Rp {new Intl.NumberFormat("id-ID").format(totalNilai)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ({jumlah || 0} {satuan} × Rp {new Intl.NumberFormat("id-ID").format(Number(hargaSatuan || 0))})
              </div>
            </div>

            {/* Tanggal Masuk */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Masuk
              </label>
              <input
                type="date"
                value={tanggalMasuk}
                onChange={(e) => setTanggalMasuk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {/* Kondisi & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kondisi
                </label>
                <select
                  value={kondisi}
                  onChange={(e) => setKondisi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="baik">Baik</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="digunakan">Digunakan</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="dibuang">Dibuang</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{editData?.id ? "Update" : "Simpan"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
