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
    <div style={{ paddingBottom: '4rem' }}>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--timber-light)' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}>A</span>
          </div>
          <h2 style={{ fontSize: '1.25rem' }}>Aura</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span className="badge">{role === 'RECRUITER' ? 'Recruiter' : 'Candidate'} Focus</span>
          <button className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleLogout}>
            Depart
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Good afternoon.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Here is your clarity overview for today.
          </p>
        </header>

        <section style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
            {role === 'RECRUITER' ? 'Active Requisitions' : 'Current Applications'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* Card 1 */}
            <div className="surface-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Senior React Engineer</h2>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-matcha)', flexShrink: 0, marginTop: '0.5rem' }}></span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                {role === 'RECRUITER' ? '3 candidates awaiting review. Last updated 2 hours ago.' : 'Application submitted. Awaiting interview schedule.'}
              </p>
              <button className="btn-secondary">View Details</button>
            </div>

            {/* Card 2 */}
            <div className="surface-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Product Designer</h2>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-terra)', flexShrink: 0, marginTop: '0.5rem' }}></span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
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
