import api from './axiosConfig';

export const getNotificationsByUser = (userId) => api.get(`/notifications/user/${userId}`);
export const getUnreadNotifications = (userId) => api.get(`/notifications/user/${userId}/unread`);
export const countUnread = (userId) => api.get(`/notifications/user/${userId}/count`);
export const markAsRead = (notificationId) => api.patch(`/notifications/${notificationId}/read`);
export const markAllRead = (userId) => api.patch(`/notifications/user/${userId}/read-all`);
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);

// ── Messaging (Recruiter ↔ Candidate) ──
export const sendMessage = (message) => api.post('/messages', message);
export const getMessageById = (messageId) => api.get(`/messages/${messageId}`);
export const getConversation = (userId1, userId2) => api.get('/messages/conversation', { params: { userId1, userId2 } });
export const getApplicationThread = (applicationId) => api.get(`/messages/application/${applicationId}`);
export const getInbox = (userId) => api.get(`/messages/inbox/${userId}`);
export const getSentMessages = (userId) => api.get(`/messages/sent/${userId}`);
export const markMessageRead = (messageId) => api.patch(`/messages/${messageId}/read`);
export const countUnreadMessages = (userId) => api.get(`/messages/unread/count/${userId}`);
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
