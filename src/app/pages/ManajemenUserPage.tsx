import { useEffect, useState } from "react";
import { apiFetch, getStoredUser } from "../../lib/api";
import { useNavigate } from "react-router";

type Role = "admin_sistem" | "pimpinan" | "pengelola_internal";
type Permission =
  | "view_dashboard"
  | "view_reports"
  | "view_pembukuan"
  | "manage_transaksi"
  | "manage_aset"
  | "manage_inventaris"
  | "manage_rekonsiliasi"
  | "manage_perencanaan"
  | "approve_transaction";

const ALL_PERMISSIONS: { key: Permission; label: string; desc: string }[] = [
  {
    key: "view_dashboard",
    label: "Lihat Dashboard",
    desc: "Akses dashboard utama",
  },
  {
    key: "view_reports",
    label: "Lihat Laporan",
    desc: "Akses semua laporan keuangan",
  },
  {
    key: "view_pembukuan",
    label: "Lihat Pembukuan",
    desc: "Akses halaman pembukuan (read-only)",
  },
  {
    key: "manage_transaksi",
    label: "Kelola Transaksi",
    desc: "Input, edit, hapus transaksi",
  },
  {
    key: "manage_aset",
    label: "Kelola Aset Tetap",
    desc: "Input, edit, hapus aset tetap",
  },
  {
    key: "manage_inventaris",
    label: "Kelola Inventaris",
    desc: "Input, edit, hapus inventaris",
  },
  {
    key: "manage_rekonsiliasi",
    label: "Kelola Rekonsiliasi Bank",
    desc: "Input, edit, hapus rekonsiliasi bank",
  },
  {
    key: "manage_perencanaan",
    label: "Kelola Perencanaan",
    desc: "Input, edit, hapus perencanaan",
  },
  {
    key: "approve_transaction",
    label: "Approve Transaksi",
    desc: "Menyetujui/menolak transaksi (khusus Pimpinan)",
  },
];

interface UserRow {
  id: number;
  nama_lengkap: string;
  email: string;
  username: string;
  role: Role;
  permissions: Permission[] | null;
  is_active: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin_sistem: [
    "view_dashboard",
    "view_reports",
    "view_pembukuan",
    "manage_transaksi",
    "manage_aset",
    "manage_inventaris",
    "manage_rekonsiliasi",
    "manage_perencanaan",
    "approve_transaction",
  ],
  pimpinan: [
    "view_dashboard",
    "view_reports",
    "view_pembukuan",
    "approve_transaction",
  ],
  pengelola_internal: [
    "view_dashboard",
    "view_reports",
    "view_pembukuan",
    "manage_transaksi",
    "manage_aset",
    "manage_inventaris",
    "manage_rekonsiliasi",
    "manage_perencanaan",
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin_sistem: "Admin Sistem",
  pimpinan: "Pimpinan",
  pengelola_internal: "Pengelola Internal",
};

const ROLE_BADGE: Record<Role, string> = {
  admin_sistem: "bg-red-100 text-red-700 border-red-200",
  pimpinan: "bg-purple-100 text-purple-700 border-purple-200",
  pengelola_internal: "bg-blue-100 text-blue-700 border-blue-200",
};

export function ManajemenUserPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [permUser, setPermUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [toggleUser, setToggleUser] = useState<UserRow | null>(null);

  const currentUser = getStoredUser();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin_sistem") {
      alert("Akses ditolak. Halaman khusus Admin Sistem.");
      navigate("/", { replace: true });
    }
  }, [navigate, currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/users");

      if (res.status === 403) {
        alert("Akses ditolak. Hanya Admin Sistem yang bisa membuka halaman ini.");
        navigate("/", { replace: true });
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal memuat data user");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Load users error:", err);
      alert("Gagal memuat data user: " + (err?.message || "unknown error"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        u.nama_lengkap.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola akun Admin Sistem, Pimpinan, dan Pengelola Internal
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Tambah User
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari nama / email / username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "" | Role)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Semua Role</option>
          <option value="admin_sistem">Admin Sistem</option>
          <option value="pimpinan">Pimpinan</option>
          <option value="pengelola_internal">Pengelola Internal</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | "active" | "inactive")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <button
          onClick={loadUsers}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data user...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada user ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nama_lengkap}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded border ${ROLE_BADGE[u.role]}`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 border border-green-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600 border border-gray-200">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <button
                          onClick={() => setEditUser(u)}
                          className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100"
                          title="Edit nama, email, role"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPermUser(u)}
                          className="px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100"
                          title="Set permission"
                        >
                          Permission
                        </button>
                        <button
                          onClick={() => setResetUser(u)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                          title="Reset password"
                        >
                          Reset PW
                        </button>
                        <button
                          onClick={() => setToggleUser(u)}
                          className={`px-2 py-1 text-xs rounded border ${
                            u.is_active
                              ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          }`}
                          title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Total: {filtered.length} dari {users.length} user
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            loadUsers();
          }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            loadUsers();
          }}
        />
      )}
      {permUser && (
        <PermissionModal
          user={permUser}
          onClose={() => setPermUser(null)}
          onSuccess={() => {
            setPermUser(null);
            loadUsers();
          }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={() => {
            setResetUser(null);
            loadUsers();
          }}
        />
      )}
      {toggleUser && (
        <ToggleActiveModal
          user={toggleUser}
          onClose={() => setToggleUser(null)}
          onSuccess={() => {
            setToggleUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nama_lengkap, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("pengelola_internal");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const togglePerm = (p: Permission) => {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          nama_lengkap,
          email,
          username,
          password,
          role,
          permissions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal membuat user");
      }

      alert("User berhasil dibuat");
      onSuccess();
    } catch (err: any) {
      alert("Gagal: " + (err?.message || "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Tambah User Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nama Lengkap" required>
          <input
            required
            value={nama_lengkap}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Email" required>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Username" required>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Password" required>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Minimal 8 karakter</p>
        </Field>
        <Field label="Role" required>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="pengelola_internal">Pengelola Internal</option>
            <option value="pimpinan">Pimpinan</option>
            <option value="admin_sistem">Admin Sistem</option>
          </select>
        </Field>
        <Field label="Permissions">
          <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {ALL_PERMISSIONS.map((p) => (
              <label
                key={p.key}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(p.key)}
                  onChange={() => togglePerm(p.key)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {p.label}
                  </div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Buat User"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nama_lengkap, setNama] = useState(user.nama_lengkap);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState<Role>(user.role);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ nama_lengkap, email, username, role }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal mengupdate user");
      }

      alert("User berhasil diupdate");
      onSuccess();
    } catch (err: any) {
      alert("Gagal: " + (err?.message || "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Edit User: ${user.nama_lengkap}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nama Lengkap" required>
          <input
            required
            value={nama_lengkap}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Email" required>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Username" required>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </Field>
        <Field label="Role" required>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="pengelola_internal">Pengelola Internal</option>
            <option value="pimpinan">Pimpinan</option>
            <option value="admin_sistem">Admin Sistem</option>
          </select>
        </Field>
        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
          Edit permission dilakukan di tab "Permission" agar lebih aman.
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PermissionModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  type PermMode = "default" | "custom";

  const isAdmin = user.role === "admin_sistem";
  const initialMode: PermMode =
    isAdmin || user.permissions === null ? "default" : "custom";
  const initialDefault = DEFAULT_ROLE_PERMISSIONS[user.role] ?? [];

  const [mode, setMode] = useState<PermMode>(initialMode);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>(
    initialMode === "custom" ? (user.permissions as Permission[]) : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedPermissions: Permission[] =
    mode === "default" ? initialDefault : customPermissions;

  const toggleCustomPerm = (p: Permission) => {
    setCustomPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
    setConfirmEmpty(false);
    setError(null);
  };

  const enterCustomMode = () => {
    setMode("custom");
    setCustomPermissions(initialDefault);
    setConfirmEmpty(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (customPermissions.length === 0 && !confirmEmpty) {
      setConfirmEmpty(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: customPermissions }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal mengupdate permissions");
      }

      alert("Custom permission berhasil disimpan");
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetToDefault = async () => {
    const ok = window.confirm(
      "Reset permission user ini ke default role? Custom override akan dihapus dan user akan kembali memakai default role."
    );
    if (!ok) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: null }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Gagal mereset permission ke default"
        );
      }

      alert("Permission berhasil direset ke default role");
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={`Permission: ${user.nama_lengkap}`}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className="mb-3 text-sm space-y-1">
        <div>
          <span className="text-gray-500">Role:</span>{" "}
          <span className="font-semibold">{ROLE_LABEL[user.role]}</span>
        </div>

        {isAdmin ? (
          <div className="text-xs bg-yellow-50 border border-yellow-300 text-yellow-800 rounded p-2 mt-2">
            <strong>Admin Sistem otomatis memiliki akses penuh.</strong>{" "}
            Custom permission tidak berlaku untuk role ini. Anda tidak dapat
            membatasi akses Admin Sistem melalui permission override.
          </div>
        ) : mode === "default" ? (
          <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded p-2 mt-2">
            <strong>Mode: Default Role Permission.</strong> User memakai
            permission bawaan role. Untuk mengubah, klik tombol{" "}
            <em>Aktifkan Custom Permission</em> di bawah.
          </div>
        ) : (
          <div className="text-xs bg-orange-50 border border-orange-200 text-orange-800 rounded p-2 mt-2">
            <strong>Mode: Custom Permission Override.</strong> Permission user
            tidak lagi memakai default role. Klik <em>Reset ke Default Role</em>{" "}
            untuk mengembalikan.
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div
          className={`space-y-2 border rounded-lg p-3 max-h-96 overflow-y-auto ${
            isAdmin || mode === "default"
              ? "border-gray-200 bg-gray-50"
              : "border-gray-200"
          }`}
        >
          {ALL_PERMISSIONS.map((p) => {
            const checked =
              isAdmin || displayedPermissions.includes(p.key);
            const disabled = isAdmin || mode === "default";
            return (
              <label
                key={p.key}
                className={`flex items-start gap-2 ${
                  disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCustomPerm(p.key)}
                  disabled={disabled}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {p.label}
                  </div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        {mode === "custom" && customPermissions.length === 0 && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            <strong>Peringatan:</strong> Custom permission kosong akan mengunci
            user keluar dari semua fitur. Klik <em>Simpan</em> sekali lagi untuk
            konfirmasi.
          </div>
        )}

        <div className="flex justify-between items-center gap-2 pt-2">
          <div>
            {mode === "custom" && !isAdmin && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={submitting}
                className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Reset ke Default Role
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {isAdmin ? "Tutup" : "Batal"}
            </button>
            {isAdmin ? null : mode === "default" ? (
              <button
                type="button"
                onClick={enterCustomMode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Aktifkan Custom Permission
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting
                  ? "Menyimpan..."
                  : confirmEmpty
                  ? "Saya Yakin, Simpan"
                  : "Simpan Custom Permission"}
              </button>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      alert("Password minimal 8 karakter");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal mereset password");
      }

      alert(
        "Password berhasil direset. Harap sampaikan password baru ke user secara langsung."
      );
      onSuccess();
    } catch (err: any) {
      alert("Gagal: " + (err?.message || "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={`Reset Password: ${user.nama_lengkap}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
          Masukkan password baru untuk user ini. Pastikan untuk menyampaikannya
          ke user secara langsung via channel aman.
        </div>
        <Field label="Password Baru" required>
          <input
            required
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? "Mereset..." : "Reset Password"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ToggleActiveModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const willActivate = !user.is_active;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: willActivate ? 1 : 0 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal memperbarui status user");
      }

      alert(
        `User berhasil di${willActivate ? "aktifkan" : "nonaktifkan"}`
      );
      onSuccess();
    } catch (err: any) {
      alert("Gagal: " + (err?.message || "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={`${willActivate ? "Aktifkan" : "Nonaktifkan"} User`}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-700">
          Anda akan {willActivate ? "mengaktifkan" : "menonaktifkan"} user:
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
          <div>
            <span className="text-gray-500">Nama:</span>{" "}
            <span className="font-semibold">{user.nama_lengkap}</span>
          </div>
          <div>
            <span className="text-gray-500">Username:</span>{" "}
            <span className="font-semibold">{user.username}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="font-semibold">{user.email}</span>
          </div>
          <div>
            <span className="text-gray-500">Status saat ini:</span>{" "}
            <span className="font-semibold">
              {user.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
        {!willActivate && (
          <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
            User yang dinonaktifkan tidak akan bisa login sampai diaktifkan
            kembali.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
              willActivate
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            {submitting
              ? "Memproses..."
              : willActivate
              ? "Aktifkan"
              : "Nonaktifkan"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
