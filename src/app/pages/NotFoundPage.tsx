import { Link } from "react-router";
import { AlertCircle } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-gray-600" />
        </div>
        <h1 className="text-gray-900 mb-4">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8">
          Halaman yang Anda cari tidak dapat ditemukan.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
