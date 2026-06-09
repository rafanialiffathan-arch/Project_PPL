import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  apiFetch,
  AuthUser,
  clearAuth,
  getStoredUser,
  getToken,
  saveUser,
} from "../../lib/api";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Perencanaan", href: "/perencanaan", icon: FileText },
  { name: "Pembukuan", href: "/pembukuan", icon: BookOpen },
  { name: "Laporan", href: "/laporan", icon: BarChart3 },
  { name: "Profile", href: "/profile", icon: User },
];

const adminNavigation = [
  { name: "Manajemen User", href: "/admin/users", icon: Users },
];

const getRoleLabel = (role?: string) => {
  if (role === "admin_sistem") return "Admin Sistem";
  if (role === "pimpinan") return "Pimpinan";
  if (role === "pengelola_internal") return "Pengelola Internal";
  if (role === "admin") return "Administrator";
  return role || "User";
};

const getDisplayName = (user: AuthUser | null) =>
  user?.nama_lengkap || user?.nama || user?.username || "Memuat akun";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const fetchCurrentUser = async () => {
      try {
        const res = await apiFetch("/auth/me");

        if (res.ok) {
          const user = await res.json();
          saveUser(user);
          if (active) setCurrentUser(user);
          return;
        }

        if (res.status === 401) {
          clearAuth();
          navigate("/login", { replace: true });
        }
      } catch {
        if (!getToken()) {
          navigate("/login", { replace: true });
        }
      }
    };

    fetchCurrentUser();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  if (!getToken()) {
    return null;
  }

  const navItems = useMemo(
    () => [
      ...baseNavigation,
      ...(currentUser?.role === "admin_sistem" ? adminNavigation : []),
    ],
    [currentUser?.role]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          {sidebarOpen && (
            <div className="font-bold">
              Finsped
              <span className="text-xs block text-gray-500">Express</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-gray-500">Finsped Express</div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{getDisplayName(currentUser)}</div>
              <div className="text-xs text-gray-500">{getRoleLabel(currentUser?.role)}</div>
            </div>
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
