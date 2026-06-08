import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterDisabledPage } from "./pages/RegisterDisabledPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PerencanaanPage } from "./pages/PerencanaanPage";
import { PembukuanPage } from "./pages/PembukuanPage";
import { LaporanPage } from "./pages/LaporanPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    // Route /register tetap ada di router agar URL yang di-bookmark
    // tidak 404 (yang bisa membingungkan), tapi halaman hanya menampilkan
    // pesan bahwa registrasi publik dinonaktifkan.
    path: "/register",
    Component: RegisterDisabledPage,
  },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "perencanaan", Component: PerencanaanPage },
      { path: "pembukuan", Component: PembukuanPage },
      { path: "laporan", Component: LaporanPage },
      { path: "profile", Component: ProfilePage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
