import { Link, useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import { saveToken, saveUser, apiFetch } from "../../lib/api";

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const identifier = (form.elements.namedItem("identifier") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      // Save token
      saveToken(data.token);
      
      // Save user data from login response
      if (data.user) {
        saveUser(data.user);
      }
      
      navigate("/");
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Annotation */}
        <div className="mb-6 p-6 bg-white border-l-4 border-gray-900 rounded shadow-sm">
          <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
            📌 HALAMAN LOGIN - AUTHENTICATION
          </h4>
          <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
            <div>
              <span className="font-semibold">FUNGSI INPUT:</span>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li><strong>Email/Username:</strong> Identifikasi user yang akan login ke sistem</li>
                <li><strong>Password:</strong> Autentikasi keamanan akun (min. 8 karakter)</li>
                <li><strong>Remember Me:</strong> Menyimpan session login untuk akses cepat</li>
              </ul>
            </div>
            <div>
              <span className="font-semibold">VALIDASI LOGIN:</span>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li>Sistem validasi email format & password strength</li>
                <li>Maximum 3x failed login attempts → akun temporary lock</li>
                <li>Session timeout setelah 30 menit inactive</li>
                <li>Two-factor authentication (2FA) untuk admin</li>
              </ul>
            </div>
            <div>
              <span className="font-semibold">USER FLOW:</span> Login Success → Redirect ke Dashboard
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-lg mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">AccounTech Enterprise</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sistem Akuntansi Keuangan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email / Username
              </label>
              <input
                type="text"
                name="identifier"
                placeholder="admin@accountech.com atau username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-gray-900 hover:underline">
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Masuk
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link to="/register" className="text-gray-900 font-medium hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2026 AccounTech Enterprise. Grade Production Level.
          </p>
        </div>
      </div>
    </div>
  );
}
