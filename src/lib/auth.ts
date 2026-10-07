export type Role = 'student' | 'teacher' | 'librarian';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  login_id: string;
  role: Role;
  is_active: boolean;
  grade: string | null;
  class_code: string | null;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status = 0, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function send(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(path, { ...options, credentials: 'include' });
  } catch {
    throw new ApiError('Unable to reach the PHP backend. Start the API server and try again.');
  }
}

export async function apiRequest<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    const csrf = await send('/api/auth/csrf', { headers });
    if (!csrf.ok) throw new ApiError('Unable to initialize your session. Check that the PHP server is running.', csrf.status);
    const token = document.cookie.split('; ').find(cookie => cookie.startsWith('XSRF-TOKEN='))?.slice(11);
    if (!token) throw new ApiError('Session cookie is missing. Enable cookies and use the same hostname for React and PHP.');
    headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    headers['Content-Type'] = 'application/json';
  }
  const response = await send(path, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => { throw new ApiError('The API did not return JSON. Check that the PHP server is running and the Vite proxy is configured.', response.status); });
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined' && path !== '/api/auth/me') {
      window.dispatchEvent(new Event('booksphere-session-expired'));
    }
    const message = response.status === 419 ? 'Your session expired. Please try again.'
      : response.status === 429 ? 'Too many attempts. Wait a minute and try again.'
      : response.status >= 500 ? 'The PHP backend encountered a problem. Check its database configuration and server logs.'
      : result.message ?? 'The request could not be completed.';
    throw new ApiError(message, response.status, result.errors);
  }
  return result as T;
}

export const auth = {
  async login(username: string, password: string): Promise<AuthUser> {
    const { user } = await apiRequest<{ user: AuthUser }>('/api/auth/login', { username: username.trim(), password });
    return user;
  },
  async register(data: Record<string, unknown>): Promise<AuthUser> {
    const { user } = await apiRequest<{ user: AuthUser }>('/api/auth/register', data);
    return user;
  },
  async currentUser(): Promise<AuthUser | null> {
    try {
      const { user } = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      return user;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    }
  },
  logout: () => apiRequest<void>('/api/auth/logout', {}),
  forgotPassword: (email: string) => apiRequest<{ message: string }>('/api/auth/forgot-password', { email: email.trim() }),
  resetPassword: (email: string, token: string, password: string, confirmation: string) => apiRequest<{ message: string }>('/api/auth/reset-password', { email, token, password, password_confirmation: confirmation }),
};
