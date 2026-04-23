import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countUnread, getUnreadNotifications, markAllRead } from '../api/notificationApi';
import { NAV_LINKS_BY_ROLE, HOME_PATH_BY_ROLE } from '../config/navigation';

const isLinkActive = (pathname, link) => {
  if (pathname === link.to) return true;
  return pathname.startsWith(`${link.to}/`);
};

// Role label map
const ROLE_LABELS = { CANDIDATE: 'Candidate', RECRUITER: 'Recruiter', ADMIN: 'Admin', GUEST: 'Guest' };

// Inline SVG icons
const IconBell = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMessage = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);

  const role = user?.role || 'GUEST';
  const links = useMemo(() => NAV_LINKS_BY_ROLE[role] || NAV_LINKS_BY_ROLE.GUEST, [role]);
  const homePath = HOME_PATH_BY_ROLE[role] || '/';
  const showMessaging = user && (role === 'CANDIDATE' || role === 'RECRUITER');

  // Scroll detection for shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Load notifications
  useEffect(() => {
    if (!user?.userId) { setNotifications([]); setUnreadCount(0); return; }
    const load = async () => {
      try {
        const [countRes, listRes] = await Promise.all([
          countUnread(user.userId),
          getUnreadNotifications(user.userId),
        ]);
        setUnreadCount(Number(countRes?.data || 0));
        setNotifications(Array.isArray(listRes?.data) ? listRes.data : []);
      } catch {
        setUnreadCount(0); setNotifications([]);
      }
    };
    load();
  }, [user?.userId]);

  // Close notif on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { signOut(); navigate('/login'); };

  const handleMarkAllRead = async () => {
    if (!user?.userId) return;
    try {
      await markAllRead(user.userId);
      setNotifications([]); setUnreadCount(0);
    } catch { /* keep existing */ }
  };

  // User initials avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <div className="navbar-inner">

        {/* Brand */}
        <Link to={homePath} className="navbar-brand" aria-label="HireConnect home">
          <div className="brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="nb" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.95"/>
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.9"/>
                </linearGradient>
              </defs>
              <circle cx="32" cy="22" r="8" stroke="url(#nb)" strokeWidth="3.5" fill="none"/>
              <path d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="url(#nb)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="9"  cy="16" r="3.5" fill="url(#nb)"/>
              <circle cx="55" cy="16" r="3.5" fill="url(#nb)"/>
              <circle cx="9"  cy="48" r="3.5" fill="url(#nb)"/>
              <circle cx="55" cy="48" r="3.5" fill="url(#nb)"/>
              <line x1="12" y1="17" x2="22" y2="21" stroke="url(#nb)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="52" y1="17" x2="42" y2="21" stroke="url(#nb)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="47" x2="22" y2="41" stroke="url(#nb)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="52" y1="47" x2="42" y2="41" stroke="url(#nb)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">HireConnect</span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar-links desktop-only" aria-label="Primary navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link${isLinkActive(location.pathname, l) ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="navbar-actions">

          {/* Role badge */}
          {user?.role && (
            <span className={`role-badge role-badge--${role.toLowerCase()}`} title={`Logged in as ${ROLE_LABELS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          )}

          {/* Messages icon */}
          {showMessaging && (
            <Link to="/messages" className={`nb-icon-btn${isLinkActive(location.pathname, { to: '/messages' }) ? ' nb-icon-btn--active' : ''}`} aria-label="Messages">
              <IconMessage />
            </Link>
          )}

          {/* Notifications bell */}
          {user?.userId && (
            <div className="notif-wrapper" ref={notifRef}>
              <button
                className={`nb-icon-btn${notifOpen ? ' nb-icon-btn--active' : ''}`}
                onClick={() => setNotifOpen(prev => !prev)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown" role="menu">
                  <div className="notif-header">
                    <span className="notif-header-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="text-btn" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <span className="notif-empty-icon">🔔</span>
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 5).map((n) => (
                        <div className="notif-item" key={n.notificationId} role="menuitem">
                          <div className="notif-dot" />
                          <div className="notif-item-content">
                            <p className="notif-msg">{n.message}</p>
                            <p className="notif-time">{n.type}</p>
                          </div>
                        </div>
                      ))}
                      <div className="notif-footer">
                        <button className="text-btn" onClick={() => { setNotifOpen(false); navigate('/notifications'); }}>
                          View all notifications →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Avatar / Auth buttons */}
          {user ? (
            <div className="nb-user-menu">
              <div className="nb-avatar" title={user.name || user.email}>{initials}</div>
              <button className="nb-logout-btn" onClick={handleLogout} aria-label="Logout">
                <IconLogout />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="nb-auth-btns">
              <Link to="/login" className="btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="nb-icon-btn mobile-only"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          <div className="mobile-menu-section">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`mobile-nav-link${isLinkActive(location.pathname, l) ? ' active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
            {showMessaging && (
              <Link to="/messages" className={`mobile-nav-link${isLinkActive(location.pathname, { to: '/messages' }) ? ' active' : ''}`}>
                💬 Messages
              </Link>
            )}
            {user?.userId && (
              <Link to="/notifications" className={`mobile-nav-link${isLinkActive(location.pathname, { to: '/notifications' }) ? ' active' : ''}`}>
                🔔 Notifications {unreadCount > 0 && <span className="mobile-notif-badge">{unreadCount}</span>}
              </Link>
            )}
          </div>
          {user && (
            <div className="mobile-menu-footer">
              <button className="mobile-nav-link mobile-nav-button mobile-logout" onClick={handleLogout}>
                <IconLogout /> Logout
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
