export type AuthUser = {
  id: number;
  nama?: string;
  nama_lengkap?: string;
  username?: string;
  email?: string;
  role?: string;
};

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'token';
const USER_KEY = 'auth_user';

// Simpan token ke localStorage
export const saveToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY);

export const removeToken = () =>
  localStorage.removeItem(TOKEN_KEY);

export const saveUser = (user: AuthUser) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const removeStoredUser = () =>
  localStorage.removeItem(USER_KEY);

export const clearAuth = () => {
  removeToken();
  removeStoredUser();
};

// Helper fetch dengan Authorization header otomatis
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAuth();
  }

  return response;
}
