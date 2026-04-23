import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="legacy-dashboard-page">
      <nav className="navbar">
        <div className="legacy-dashboard-brand">
          <div className="legacy-dashboard-logo">
            <span className="legacy-dashboard-logo-text">A</span>
          </div>
          <h2 className="legacy-dashboard-brand-title">Aura</h2>
        </div>
        <div className="legacy-dashboard-nav-actions">
          <span className="badge">{role === 'RECRUITER' ? 'Recruiter' : 'Candidate'} Focus</span>
          <button className="btn-secondary legacy-dashboard-logout" onClick={handleLogout}>
            Depart
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        <header className="legacy-dashboard-header">
          <h1 className="legacy-dashboard-title">
            Good afternoon.
          </h1>
          <p className="legacy-dashboard-subtitle">
            Here is your clarity overview for today.
          </p>
        </header>

        <section className="legacy-dashboard-section">
          <h3 className="legacy-dashboard-section-title">
            {role === 'RECRUITER' ? 'Active Requisitions' : 'Current Applications'}
          </h3>
          <div className="legacy-dashboard-grid">

            {/* Card 1 */}
            <div className="surface-card">
              <div className="legacy-dashboard-card-head">
                <h2 className="legacy-dashboard-card-title">Senior React Engineer</h2>
                <span className="legacy-dashboard-status-dot legacy-dashboard-status-dot-green"></span>
              </div>
              <p className="legacy-dashboard-card-text">
                {role === 'RECRUITER' ? '3 candidates awaiting review. Last updated 2 hours ago.' : 'Application submitted. Awaiting interview schedule.'}
              </p>
              <button className="btn-secondary">View Details</button>
            </div>

            {/* Card 2 */}
            <div className="surface-card">
              <div className="legacy-dashboard-card-head">
                <h2 className="legacy-dashboard-card-title">Product Designer</h2>
                <span className="legacy-dashboard-status-dot legacy-dashboard-status-dot-amber"></span>
              </div>
              <p className="legacy-dashboard-card-text">
                {role === 'RECRUITER' ? 'Interview scheduled for tomorrow at 10:00 AM.' : 'Technical assessment pending submission.'}
              </p>
              <button className="btn-secondary">View Details</button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
