import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    APPLIED: { label: 'Applied', cls: 'status-applied' },
    SHORTLISTED: { label: 'Shortlisted', cls: 'status-shortlisted' },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', cls: 'status-interview' },
    OFFERED: { label: 'Offered', cls: 'status-offered' },
    REJECTED: { label: 'Rejected', cls: 'status-rejected' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'status-withdrawn' },
    // Job statuses
    ACTIVE: { label: 'Active', cls: 'status-active' },
    PAUSED: { label: 'Paused', cls: 'status-paused' },
    CLOSED: { label: 'Closed', cls: 'status-closed' },
    // Interview statuses
    SCHEDULED: { label: 'Scheduled', cls: 'status-interview' },
    CONFIRMED: { label: 'Confirmed', cls: 'status-offered' },
    RESCHEDULED: { label: 'Rescheduled', cls: 'status-shortlisted' },
    CANCELLED: { label: 'Cancelled', cls: 'status-rejected' },
    // Subscription
    FREE: { label: 'Free', cls: 'status-paused' },
    PROFESSIONAL: { label: 'Professional', cls: 'status-shortlisted' },
    ENTERPRISE: { label: 'Enterprise', cls: 'status-offered' },
  };
  const info = map[status] || { label: status, cls: 'status-applied' };
  return <span className={`status-badge ${info.cls}`}>{info.label}</span>;
}

export function LoadingSpinner({ size = 32 }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" style={{ width: size, height: size }}></div>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-header"><h3>{title}</h3></div>}
      <div className="card-body">{children}</div>
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', children, ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ type = 'info', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}
