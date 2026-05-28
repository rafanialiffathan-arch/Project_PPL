import { User, Mail, Building, Shield, Save, Key, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { removeToken } from "../../lib/api";

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Annotation */}
      <div className="p-6 bg-white border-l-4 border-gray-900 rounded-lg shadow-sm">
        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          📌 HALAMAN 5 — PROFILE / SETTINGS
        </h4>
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <div>
            <span className="font-semibold">FUNGSI PROFILE:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Informasi Pribadi:</strong> Nama lengkap, username, email, nomor telepon, alamat</li>
              <li><strong>Foto Profile:</strong> Upload/change avatar user (max 2MB, format JPG/PNG)</li>
              <li><strong>Informasi Perusahaan:</strong> Nama perusahaan, alamat kantor untuk header laporan</li>
              <li><strong>Edit Profile:</strong> Update data dengan validasi real-time & konfirmasi</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">KEAMANAN AKUN:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Change Password:</strong> Memerlukan password lama + konfirmasi password baru</li>
              <li><strong>Password Requirements:</strong> Min. 8 karakter, kombinasi huruf besar/kecil + angka</li>
              <li><strong>Two-Factor Auth (2FA):</strong> Enable/disable untuk extra security layer</li>
              <li><strong>Session Management:</strong> Logout dari semua device secara remote</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">ROLE & PERMISSION:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li><strong>Current Role:</strong> Administrator atau Pimpinan (read-only untuk analisis)</li>
              <li><strong>Access Control:</strong> Daftar permission yang dimiliki user saat ini</li>
              <li><strong>Audit Trail:</strong> Log aktivitas user (login, update data, generate laporan)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">AKTIVITAS TERAKHIR:</span>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>History login dengan timestamp, IP address, dan device info</li>
              <li>Track perubahan data penting untuk compliance & security audit</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">LOGOUT:</span> Clear session, redirect ke Login page dengan aman
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Pengaturan Profile</h1>
          <p className="text-sm text-gray-500">
            Kelola informasi akun dan preferensi Anda
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Menu */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg">
            <User className="w-5 h-5" />
            <span>Informasi Pribadi</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Key className="w-5 h-5" />
            <span>Keamanan</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Shield className="w-5 h-5" />
            <span>Role & Permission</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">Admin User</h3>
                <p className="text-sm text-gray-500 mb-3">Administrator</p>
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Ubah Foto Profile
                </button>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    defaultValue="Admin User"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    defaultValue="adminuser"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="admin@accountech.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  defaultValue="+62 812 3456 7890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  defaultValue="PT AccounTech Indonesia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  rows={3}
                  defaultValue="Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Ubah Password</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Lama
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Role & Permissions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">
              Role & Permission
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Role Saat Ini
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Akses penuh ke semua fitur sistem
                  </div>
                </div>
                <div className="px-3 py-1 bg-gray-900 text-white rounded text-sm">
                  Administrator
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Permission yang Dimiliki:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Kelola Perencanaan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Input Pembukuan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Generate Laporan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Kelola User</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Export Data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Lihat Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">
              Aktivitas Terakhir
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-gray-900">Login ke sistem</div>
                  <div className="text-xs text-gray-500">09 Apr 2026, 08:30 WIB</div>
                </div>
                <div className="text-xs text-gray-500">IP: 192.168.1.1</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-gray-900">Update laporan keuangan</div>
                  <div className="text-xs text-gray-500">08 Apr 2026, 16:45 WIB</div>
                </div>
                <div className="text-xs text-gray-500">IP: 192.168.1.1</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-gray-900">Input transaksi baru</div>
                  <div className="text-xs text-gray-500">08 Apr 2026, 14:20 WIB</div>
                </div>
                <div className="text-xs text-gray-500">IP: 192.168.1.1</div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <h3 className="text-gray-900 mb-2">Keluar dari Akun</h3>
            <p className="text-sm text-gray-500 mb-4">
              Anda akan keluar dari sistem dan diarahkan ke halaman login
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin logout?")) {
                  // Clear all auth data from localStorage
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  // Redirect to login page
                  navigate("/login", { replace: true });
                }
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout dari Sistem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}