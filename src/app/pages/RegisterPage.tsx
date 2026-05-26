import { Link, useNavigate } from "react-router";
import { UserPlus, Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useState } from "react";

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const form = e.target as HTMLFormElement;
    const nama_lengkap = (form.elements.namedItem("nama_lengkap") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    // Validasi password match
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok!");
      return;
    }

    // Validasi password strength
    if (password.length < 8) {
      setError("Password minimal 8 karakter!");
      return;
    }

    // Map role ke format backend
    const roleValue = role === "Administrator" ? "admin" : "pimpinan";

    setIsLoading(true);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nama_lengkap,
          email,
          username,
          password,
          role: roleValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registrasi gagal!");
        return;
      }

      setSuccess(data.message || "Registrasi berhasil!");
      
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setError("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Annotation */}
        <div className="mb-6 p-6 bg-white border-l-4 border-gray-900 rounded shadow-sm">
          <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
            📌 HALAMAN REGISTER - PENDAFTARAN USER BARU
          </h4>
          <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
            <div>
              <span className="font-semibold">FUNGSI INPUT:</span>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li><strong>Nama Lengkap:</strong> Identitas lengkap user untuk sistem</li>
                <li><strong>Email:</strong> Email valid untuk notifikasi & recovery password</li>
                <li><strong>Username:</strong> Username unik untuk login (3-20 karakter)</li>
                <li><strong>Role:</strong> Administrator (full access) / Pimpinan (view only)</li>
                <li><strong>Password:</strong> Min 8 karakter, kombinasi huruf & angka</li>
                <li><strong>Confirm Password:</strong> Validasi kecocokan password</li>
              </ul>
            </div>
            <div>
              <span className="font-semibold">VALIDASI REGISTER:</span>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li>Email & username harus unique (tidak boleh duplicate)</li>
                <li>Password strength meter (weak/medium/strong)</li>
                <li>Konfirmasi syarat & ketentuan wajib dicentang</li>
              </ul>
            </div>
            <div>
              <span className="font-semibold">USER FLOW:</span> Register Success → Email Verification → Login
            </div>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-lg mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">Daftar Akun Baru</h1>
            <p className="text-sm text-gray-500 mt-1">
              Buat akun AccounTech Enterprise
            </p>
          </div>

          {/* Form */}
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                {success}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama_lengkap"
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@company.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Pimpinan">Pimpinan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="w-4 h-4 mt-1 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Saya menyetujui syarat dan ketentuan yang berlaku
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Daftar Sekarang"
                )}
              </button>
            </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-gray-900 font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}