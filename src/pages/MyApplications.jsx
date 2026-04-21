import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../components/UI';
import { getByCandidate, withdrawApplication } from '../api/applicationApi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_ORDER = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.userId) {
      getByCandidate(user.userId)
        .then(r => setApplications(r.data))
        .catch(() => setApplications([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await withdrawApplication(appId, user.userId);
      setApplications(prev => prev.map(a => a.applicationId === appId ? {...a, status: 'WITHDRAWN'} : a));
      setToast('Application withdrawn.');
    } catch {
      setToast('Failed to withdraw.');
    }
  };

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);

  const statusCount = (s) => applications.filter(a => a.status === s).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Applications</h1>
            <p>Track all your job applications in one place</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/jobs')}>Browse More Jobs</button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{applications.length}</span>
            <span className="stat-label">Total Applied</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('SHORTLISTED')}</span>
            <span className="stat-label">Shortlisted</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('INTERVIEW_SCHEDULED')}</span>
            <span className="stat-label">Interviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('OFFERED')}</span>
            <span className="stat-label">Offers</span>
          </div>
        </div>

        {/* Pipeline tracker */}
        <div className="pipeline-bar">
          {STATUS_ORDER.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`pipeline-step ${statusCount(s) > 0 ? 'has-items' : ''}`}>
                <span className="pipeline-num">{statusCount(s)}</span>
                <span className="pipeline-label">{s.replace('_', ' ')}</span>
              </div>
              {i < STATUS_ORDER.length - 1 && <div className="pipeline-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {['ALL', ...STATUS_ORDER, 'WITHDRAWN'].map(s => (
            <button
              key={s}
              className={`tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s.replace('_', ' ')}
              {s !== 'ALL' && <span className="tab-count">{applications.filter(a => a.status === s).length}</span>}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No applications yet"
            message={filter === 'ALL' ? "Start applying to jobs to track them here." : `No applications with status: ${filter}`}
            action={filter === 'ALL' && <button className="btn-primary" onClick={() => navigate('/jobs')}>Find Jobs</button>}
          />
        ) : (
          <div className="applications-list">
            {filtered.map(app => (
              <div className="app-card" key={app.applicationId}>
                <div className="app-card-left">
                  <div className="company-logo-sm">{app.jobId}</div>
                  <div>
                    <h3 className="app-job-title">Job #{app.jobId}</h3>
                    <p className="app-meta">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                    {app.coverLetter && (
                      <p className="app-cover">{app.coverLetter.substring(0, 80)}...</p>
                    )}
                  </div>
                </div>
                <div className="app-card-right">
                  <StatusBadge status={app.status} />
                  <div className="app-actions">
                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/jobs/${app.jobId}`)}>
                      View Job
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/interviews?appId=${app.applicationId}`)}>
                      Interviews
                    </button>
                    {(app.status === 'APPLIED' || app.status === 'SHORTLISTED') && (
                      <button className="btn-danger btn-sm" onClick={() => handleWithdraw(app.applicationId)}>
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
