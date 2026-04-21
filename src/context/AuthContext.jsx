import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            token,
            userId: decoded.userId,
            email: decoded.sub || decoded.email,
            role: decoded.role,
          });
        } else {
          localStorage.clear();
        }
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback((authResponse) => {
    localStorage.setItem('token', authResponse.token);
    if (authResponse.refreshToken) {
      localStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    try {
      const decoded = jwtDecode(authResponse.token);
      const u = {
        token: authResponse.token,
        userId: decoded.userId,
        email: decoded.sub || decoded.email,
        role: decoded.role,
      };
      setUser(u);
      return u;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
