import React, { createContext, useContext, useState } from 'react';
import { apiUrl } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('vendorPulseUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { message: 'Unexpected server response.' };

      if (res.ok) {
        setUser(data);
        localStorage.setItem('vendorPulseUser', JSON.stringify(data));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Authentication failed.' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Server connection failed.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vendorPulseUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
