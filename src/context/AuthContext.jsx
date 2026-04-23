/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const getInitialUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 <= Date.now()) {
      localStorage.clear();
      return null;
    }

    return {
      token,
      userId: decoded.userId,
      email: decoded.sub || decoded.email,
      role: decoded.role,
    };
  } catch {
    localStorage.clear();
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getInitialUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
