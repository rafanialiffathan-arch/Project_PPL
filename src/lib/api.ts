const BASE_URL = 'http://localhost:5000/api';

// Simpan token ke localStorage
export const saveToken = (token: string) =>
  localStorage.setItem('token', token);

export const getToken = () =>
  localStorage.getItem('token');

export const removeToken = () =>
  localStorage.removeItem('token');

// Helper fetch dengan Authorization header otomatis
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      // Jangan set Content-Type untuk FormData — browser auto-set dengan boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
