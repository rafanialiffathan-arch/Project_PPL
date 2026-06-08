import { Lock, Info } from "lucide-react";
import { Link } from "react-router";

export function RegisterDisabledPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-lg mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">Registrasi Dinonaktifkan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Finsped Express
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Registrasi publik dinonaktifkan untuk keamanan.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Akun hanya dapat dibuat oleh Admin Sistem melalui Admin Panel.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Masuk ke Akun
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              (c) 2026 Finsped Express.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
