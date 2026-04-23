/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { EmptyState, LoadingSpinner, Toast, Alert } from '../components/UI';
import { deleteNotification, getNotificationsByUser, markAllRead, markAsRead } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

// Icon map for notification types
const TYPE_ICON = {
  APPLICATION: '📋',
  INTERVIEW: '🗓️',
  OFFER: '🎉',
  REJECTION: '📩',
  MESSAGE: '💬',
  SYSTEM: '⚙️',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    if (!user?.userId) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    try {
      setError('');
      const res = await getNotificationsByUser(user.userId);
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
      setError('Unable to fetch notifications right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filtered = useMemo(() => {
    if (tab === 'UNREAD') return notifications.filter((n) => !n.isRead);
    if (tab === 'READ')   return notifications.filter((n) =>  n.isRead);
    return notifications;
  }, [notifications, tab]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ));
    } catch { setToast('Could not mark notification as read.'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(user.userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setToast('All notifications marked as read.');
    } catch { setToast('Could not mark all as read.'); }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    } catch { setToast('Could not delete notification.'); }
  };

  const TAB_ITEMS = [
    { value: 'ALL',    label: 'All',    count: notifications.length },
    { value: 'UNREAD', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
    { value: 'READ',   label: 'Read',   count: notifications.filter(n =>  n.isRead).length },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        <div className="page-header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with application changes, interviews, and platform alerts.</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-primary" onClick={handleMarkAllRead}>
              ✓ Mark all read ({unreadCount})
            </button>
          )}
        </div>

        <Alert type="error" message={error} />

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {TAB_ITEMS.map(({ value, label, count }) => (
            <button
              key={value}
              className={`tab${tab === value ? ' active' : ''}`}
              onClick={() => setTab(value)}
            >
              {label}
              <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            message={
              tab === 'ALL'
                ? 'You are all caught up — nothing new here.'
                : `No ${tab.toLowerCase()} notifications to show.`
            }
          />
        ) : (
          <div className="notif-page-list">
            {filtered.map((n) => {
              const icon = TYPE_ICON[n.type] || '🔔';
              return (
                <div
                  key={n.notificationId}
                  className={`notif-page-card${!n.isRead ? ' unread' : ''}`}
                >
                  <div className="notif-type-icon">{icon}</div>

                  <div className="notif-page-body">
                    <p className="notif-page-type">{n.type || 'Notification'}</p>
                    <p className="notif-page-msg">{n.message}</p>
                    <p className="notif-page-time">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                    </p>
                  </div>

                  <div className="notif-page-actions">
                    <span className={`status-badge ${n.isRead ? 'status-paused' : 'status-shortlisted'}`}>
                      {n.isRead ? 'Read' : 'New'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {!n.isRead && (
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleMarkRead(n.notificationId)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(n.notificationId)}
                        style={{ fontSize: '0.78rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
