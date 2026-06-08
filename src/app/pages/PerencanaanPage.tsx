import { Calendar, FileText, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type Plan = {
  id: number;
  nama_plan: string;
  target: number | string;
  deadline?: string | null;
  created_at?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function PerencanaanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [namaPlan, setNamaPlan] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/perencanaan");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error("Gagal fetch perencanaan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const summary = useMemo(() => {
    const totalTarget = plans.reduce((sum, plan) => sum + Number(plan.target || 0), 0);
    const plansWithDeadline = plans.filter((plan) => plan.deadline);
    const nearestDeadline = plansWithDeadline
      .map((plan) => plan.deadline!)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

    return {
      totalTarget,
      totalPlan: plans.length,
      nearestDeadline,
    };
  }, [plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericTarget = Number(target);
    if (!namaPlan.trim() || Number.isNaN(numericTarget) || numericTarget <= 0) {
      alert("Nama rencana dan target wajib diisi dengan benar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/perencanaan", {
        method: "POST",
        body: JSON.stringify({
          nama_plan: namaPlan.trim(),
          target: numericTarget,
          deadline: deadline || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Gagal menambah rencana.");
        return;
      }

      setNamaPlan("");
      setTarget("");
      setDeadline("");
      setShowForm(false);
      await fetchPlans();
    } catch {
      alert("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-900" />
          <p className="mt-4 text-sm text-gray-500">Memuat data perencanaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Perencanaan Keuangan</h1>
          <p className="text-sm text-gray-500">
            Rencana keuangan yang tersimpan di database
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Tambah Rencana
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Rencana
            </label>
            <input
              type="text"
              value={namaPlan}
              onChange={(e) => setNamaPlan(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target
            </label>
            <input
              type="number"
              min="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Rencana"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Total Target</div>
          <div className="text-gray-900 font-mono">
            Rp {formatCurrency(summary.totalTarget)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Jumlah Rencana</div>
          <div className="text-gray-900 font-mono">{summary.totalPlan}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Deadline Terdekat</div>
          <div className="text-gray-900">{formatDate(summary.nearestDeadline)}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-500" />
          <h3 className="text-gray-900">Daftar Rencana</h3>
        </div>

        {plans.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Belum ada data perencanaan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama Rencana
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dibuat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {plan.nama_plan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                      Rp {formatCurrency(Number(plan.target || 0))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(plan.deadline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(plan.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
