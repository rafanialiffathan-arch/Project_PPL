import { User, Mail, Building, Shield, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { getUser } from "../../lib/api";

export function ProfilePage() {
  const [user, setUser] = useState<{ id: number; nama: string; role: string } | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-medium mb-2">Tidak ada data pengguna</h3>
        <p className="text-sm text-gray-500">Silakan login terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">{user.nama || 'User'}</h3>
                <p className="text-sm text-gray-500 capitalize">{user.role || 'Pengguna'}</p>
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mt-2">
                  Ubah Foto Profile
                </button>
              </div>
            </div>

            {/* Form Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={user.nama || ''}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Belum tersedia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
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
                  placeholder="Belum tersedia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  placeholder="Belum tersedia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  placeholder="Belum tersedia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  rows={3}
                  placeholder="Belum tersedia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Info: Update profile not available */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Fitur update profil belum tersedia. Hubungi administrator untuk mengubah data akun.
              </p>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Ubah Password</h3>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Fitur ubah password belum tersedia. Hubungi administrator untuk mengubah password.
              </p>
            </div>
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
                <div className="px-3 py-1 bg-gray-900 text-white rounded text-sm capitalize">
                  {user.role || 'Pengguna'}
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

          {/* Activity Log - Empty State */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">
              Aktivitas Terakhir
            </h3>
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-sm text-gray-500">
                Riwayat aktivitas akan ditampilkan di sini setelah data tersedia.
              </p>
            </div>
          </div>

          {/* NOTE: Logout tersedia di sidebar */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 text-center">
              💡 Untuk keluar dari akun, gunakan tombol <strong>"Keluar"</strong> di sidebar kiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}