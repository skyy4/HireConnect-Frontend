import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotifications, markAllRead } from '../api/notificationApi';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user?.userId) {
      getUnreadNotifications(user.userId)
        .then(r => setNotifications(r.data))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    if (user?.userId) {
      await markAllRead(user.userId);
      setNotifications([]);
    }
  };

  const isRecruiter = user?.role === 'RECRUITER';

  const candidateLinks = [
    { to: '/jobs', label: 'Browse Jobs' },
    { to: '/applications', label: 'My Applications' },
    { to: '/interviews', label: 'Interviews' },
    { to: '/profile', label: 'Profile' },
  ];

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard' },
    { to: '/recruiter/jobs', label: 'My Jobs' },
    { to: '/recruiter/applications', label: 'Applications' },
    { to: '/recruiter/interviews', label: 'Interviews' },
    { to: '/recruiter/analytics', label: 'Analytics' },
    { to: '/recruiter/subscription', label: 'Subscription' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Admin' },
    { to: '/jobs', label: 'Marketplace' },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : (isRecruiter ? recruiterLinks : candidateLinks);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isRecruiter ? '/recruiter/dashboard' : '/jobs'} className="navbar-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="12.01"/>
            </svg>
          </div>
          <span className="brand-name">HireConnect</span>
        </Link>

        <div className="navbar-links desktop-only">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <span className={`role-badge ${user?.role?.toLowerCase()}`}>
            {user?.role}
          </span>

          {/* Notifications */}
          <div className="notif-wrapper" ref={notifRef}>
            <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifications.length > 0 && (
                <span className="notif-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>
              )}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <button className="text-btn" onClick={handleMarkAllRead}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-empty">No new notifications</div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div className="notif-item" key={n.notificationId}>
                      <div className="notif-dot"></div>
                      <div>
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-time">{n.type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button className="btn-logout" onClick={handleLogout}>Logout</button>

          {/* Mobile menu toggle */}
          <button className="icon-btn mobile-only" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
