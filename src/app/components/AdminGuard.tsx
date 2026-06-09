import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getStoredUser, clearAuth } from "../../lib/api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = getStoredUser();
      if (!user) {
        clearAuth();
        navigate("/login", { replace: true });
        return;
      }
      if (user.role !== "admin_sistem") {
        alert("Akses ditolak. Halaman khusus Admin Sistem.");
        navigate("/", { replace: true });
        return;
      }
    } catch {
      clearAuth();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
}
