import api from './axiosConfig';

export const getNotificationsByUser = (userId) => api.get(`/notifications/user/${userId}`);
export const getUnreadNotifications = (userId) => api.get(`/notifications/user/${userId}/unread`);
export const countUnread = (userId) => api.get(`/notifications/user/${userId}/count`);
export const markAsRead = (notificationId) => api.patch(`/notifications/${notificationId}/read`);
export const markAllRead = (userId) => api.patch(`/notifications/user/${userId}/read-all`);
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);
