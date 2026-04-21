import api from './axiosConfig';

export const register = (data) => api.post('/auth/register', data);
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = (token) => api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
export const refreshToken = (refreshToken) => api.post('/auth/refresh', { refreshToken });
export const validateToken = (token) => api.get(`/auth/validate?token=${token}`);
export const getUserById = (userId) => api.get(`/auth/user/${userId}`);
