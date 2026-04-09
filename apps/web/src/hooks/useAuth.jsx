import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      // Decode JWT payload (không verify — chỉ để hiển thị)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { username: payload.username };
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
