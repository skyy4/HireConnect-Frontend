import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    APPLIED: { label: 'Applied', cls: 'status-applied' },
    SHORTLISTED: { label: 'Shortlisted', cls: 'status-shortlisted' },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', cls: 'status-interview' },
    OFFERED: { label: 'Offered', cls: 'status-offered' },
    REJECTED: { label: 'Rejected', cls: 'status-rejected' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'status-withdrawn' },
    ACTIVE: { label: 'Active', cls: 'status-active' },
    PAUSED: { label: 'Paused', cls: 'status-paused' },
    CLOSED: { label: 'Closed', cls: 'status-closed' },
    SCHEDULED: { label: 'Scheduled', cls: 'status-interview' },
    CONFIRMED: { label: 'Confirmed', cls: 'status-offered' },
    RESCHEDULED: { label: 'Rescheduled', cls: 'status-shortlisted' },
    CANCELLED: { label: 'Cancelled', cls: 'status-rejected' },
    FREE: { label: 'Free', cls: 'status-paused' },
    PROFESSIONAL: { label: 'Professional', cls: 'status-shortlisted' },
    ENTERPRISE: { label: 'Enterprise', cls: 'status-offered' },
  };
  const info = map[status] || { label: status || 'Unknown', cls: 'status-applied' };
  return <span className={`status-badge ${info.cls}`}>{info.label}</span>;
}

export function LoadingSpinner({ size = 32 }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading">
      <div className="spinner" style={{ width: size, height: size }}></div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-line"></div>
      ))}
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

export function Alert({ type = 'info', message }) {
  if (!message) return null;
  return <div className={`app-alert app-alert-${type}`}>{message}</div>;
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  busy = false,
  danger = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {message && <p className="muted confirm-modal-copy">{message}</p>}
      <div className="btn-row confirm-modal-actions">
        <button className="btn-secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button onClick={onClose} aria-label="Close notification">x</button>
    </div>
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && <div className="card-header"><h3>{title}</h3></div>}
      <div className="card-body">{children}</div>
    </section>
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

export function PageTransition({ children }) {
  return <div className="page-transition">{children}</div>;
}
