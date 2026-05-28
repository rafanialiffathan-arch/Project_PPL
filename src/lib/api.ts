const BASE_URL = 'http://localhost:5000/api';

// Token management
export const saveToken = (token: string) =>
  localStorage.setItem('token', token);

export const getToken = () =>
  localStorage.getItem('token');

export const removeToken = () =>
  localStorage.removeItem('token');

// User management
export const saveUser = (user: { id: number; nama: string; role: string }) =>
  localStorage.setItem('user', JSON.stringify(user));

export const getUser = (): { id: number; nama: string; role: string } | null => {
  const data = localStorage.getItem('user');
  return data ? JSON.parse(data) : null;
};

export const removeUser = () =>
  localStorage.removeItem('user');

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
