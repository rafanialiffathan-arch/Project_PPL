import { Building, Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch, AuthUser, getStoredUser, saveUser } from "../../lib/api";

const getRoleLabel = (role?: string) => {
  if (role === "admin") return "Administrator";
  if (role === "pimpinan") return "Pimpinan";
  return role || "User";
};

const getDisplayName = (user: AuthUser | null) =>
  user?.nama_lengkap || user?.nama || user?.username || "-";

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(!getStoredUser());

  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch("/auth/me");

        if (res.ok) {
          const data = await res.json();
          saveUser(data);
          if (active) setUser(data);
        } else if (res.status === 401) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-gray-500">Memuat data akun...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Profile</h1>
        <p className="text-sm text-gray-500">
          Informasi akun yang sedang login
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-gray-900 mb-1">{getDisplayName(user)}</h3>
            <p className="text-sm text-gray-500">{getRoleLabel(user?.role)}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Informasi Akun</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Nama Lengkap</div>
                <div className="text-sm text-gray-900">{getDisplayName(user)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Username</div>
                <div className="text-sm text-gray-900">{user?.username || "-"}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <div className="text-sm text-gray-900">{user?.email || "-"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Role</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getRoleLabel(user?.role)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Role akun dari database
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 bg-gray-900 text-white rounded text-sm">
                {user?.role || "-"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Perusahaan</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Building className="w-5 h-5" />
              Finsped Express
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
