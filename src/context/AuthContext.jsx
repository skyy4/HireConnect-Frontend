/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { clearAuthStorage, persistAuthSession, refreshAuthSession } from '../api/axiosConfig';

const AuthContext = createContext(null);

const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    return !decoded.exp || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const getInitialUser = () => {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) return null;

  try {
    const decoded = jwtDecode(token);
    return {
      token,
      userId: decoded.userId,
      email: decoded.sub || decoded.email,
      role: decoded.role,
    };
  } catch {
    clearAuthStorage();
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getInitialUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && !isTokenExpired(token)) {
        if (mounted) {
          setUser(getInitialUser());
          setLoading(false);
        }
        return;
      }

      if (refreshToken) {
        try {
          const response = await refreshAuthSession(refreshToken);
          const authResponse = response.data;
          const decoded = jwtDecode(authResponse.token);
          persistAuthSession(authResponse);

          if (mounted) {
            setUser({
              token: authResponse.token,
              userId: decoded.userId,
              email: decoded.sub || decoded.email,
              role: decoded.role,
            });
          }
          return;
        } catch {
          clearAuthStorage();
        }
      }

      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    };

    syncSession().finally(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback((authResponse) => {
    persistAuthSession(authResponse);
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
      clearAuthStorage();
      return null;
    }
  }, []);

  const signOut = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
