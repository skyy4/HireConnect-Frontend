import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let refreshQueue = [];

const AUTH_STORAGE_KEYS = ['token', 'refreshToken'];

const unwrapApiResponse = (payload) => (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload
  ? payload.data
  : payload);

export const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const persistAuthSession = ({ token, refreshToken }) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const refreshAuthSession = async (refreshToken) => {
  const response = await axios.post(getRefreshEndpoint(), { refreshToken });
  response.data = unwrapApiResponse(response.data);
  return response;
};

const flushRefreshQueue = (token) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const getRefreshEndpoint = () => `${api.defaults.baseURL.replace(/\/$/, '')}/auth/refresh`;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await refreshAuthSession(refreshToken);
        const nextToken = refreshRes.data?.token;
        const nextRefresh = refreshRes.data?.refreshToken;

        if (!nextToken) {
          flushRefreshQueue(null);
          clearAuthStorage();
          window.location.href = '/login';
          return Promise.reject(new Error('No access token returned from refresh endpoint'));
        }

        persistAuthSession({ token: nextToken, refreshToken: nextRefresh });

        flushRefreshQueue(nextToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushRefreshQueue(null);
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      clearAuthStorage();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
