const BASE_URL = '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = getToken() } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
}

export const apiClient = {
  register: (body: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body }),

  getTasks: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request(`/tasks${qs}`);
  },

  createTask: (body: { title: string; description?: string; status?: string }) =>
    request('/tasks', { method: 'POST', body }),

  updateTask: (id: string, body: { title?: string; description?: string; status?: string }) =>
    request(`/tasks/${id}`, { method: 'PUT', body }),

  deleteTask: (id: string) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

  getAdminUsers: () => request('/admin/users'),
  getAdminTasks: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request(`/admin/tasks${qs}`);
  },
};
