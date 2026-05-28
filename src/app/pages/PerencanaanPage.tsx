import { useState } from "react";
import { Plus, Calendar, FileText } from "lucide-react";

export function PerencanaanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Perencanaan Keuangan</h1>
          <p className="text-sm text-gray-500">
            Kelola rencana anggaran pemasukan dan pengeluaran
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-not-allowed opacity-50"
          disabled
          title="Fitur dalam pengembangan"
        >
          <Plus className="w-4 h-4" />
          Tambah Rencana
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700">Periode:</span>
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value={new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}>
            {new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}
          </option>
        </select>
      </div>

      {/* Empty State - Development Notice */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Fitur Perencanaan Keuangan
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md mb-4">
            Fitur perencanaan budget dan tracking realiasi sedang dalam pengembangan.
            Anda akan bisa membuat target pemasukan, pengeluaran, dan monitoring progress di sini.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span>Fitur akan segera hadir</span>
          </div>
        </div>

        {/* Coming Soon Features Preview */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Preview Fitur:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">📊</span>
              </div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Target Budget</h5>
              <p className="text-xs text-gray-500">Buat target pemasukan dan pengeluaran per periode</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">📈</span>
              </div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Tracking Progress</h5>
              <p className="text-xs text-gray-500">Monitoring realiasi vs target dengan visual progress</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">📋</span>
              </div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Analisis Variance</h5>
              <p className="text-xs text-gray-500">Analisis selisih antara planning vs actual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}