export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  activeRole?: string;
}

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('seapedia_token') : null;

export const getUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('seapedia_user');
  return raw ? JSON.parse(raw) : null;
};

export const setAuth = (token: string, user: AuthUser) => {
  localStorage.setItem('seapedia_token', token);
  localStorage.setItem('seapedia_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('seapedia_token');
  localStorage.removeItem('seapedia_user');
};

export const isLoggedIn = () => !!getToken();

export const getActiveRole = () => getUser()?.activeRole;
