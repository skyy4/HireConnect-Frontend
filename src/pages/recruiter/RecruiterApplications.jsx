/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../../components/UI';
import { getJobsByRecruiter } from '../../api/jobApi';
import { getByJob, updateStatus } from '../../api/applicationApi';
import { getCandidateByUserId } from '../../api/profileApi';
import { useAuth } from '../../context/AuthContext';

/** Convert relative /uploads/... path → full API-gateway URL */
const getResumeFullUrl = (resumeUrl) => {
  if (!resumeUrl) return null;
  if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) return resumeUrl;
  const gatewayBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1\/?$/, '');
  return `${gatewayBase}${resumeUrl}`;
};

/** Return initials from a full name */
const initials = (name) =>
  name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

export default function RecruiterApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  // Map: candidateId (userId) → profile { fullName, headline, ... }
  const [profileMap, setProfileMap] = useState({});

  /** Fetch candidate profiles for a list of applications */
  const fetchProfiles = useCallback(async (apps) => {
    const uniqueIds = [...new Set(apps.map(a => a.candidateId))];
    const entries = await Promise.allSettled(
      uniqueIds.map(uid => getCandidateByUserId(uid).then(r => [uid, r.data]))
    );
    const map = {};
    entries.forEach(r => {
      if (r.status === 'fulfilled') {
        const [uid, data] = r.value;
        map[uid] = data;
      }
    });
    setProfileMap(prev => ({ ...prev, ...map }));
  }, []);

  const loadApplications = useCallback(async (jobId) => {
    setSelectedJob(jobId);
    setLoadingApps(true);
    try {
      const res = await getByJob(jobId);
      const apps = res.data || [];
      setApplications(apps);
      if (apps.length > 0) fetchProfiles(apps);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }, [fetchProfiles]);

  useEffect(() => {
    if (!user?.userId) { setLoading(false); return; }
    getJobsByRecruiter(user.userId)
      .then(async (r) => {
        setJobs(r.data);
        if (r.data.length > 0) await loadApplications(r.data[0].jobId);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [loadApplications, user?.userId]);

  const handleStatusUpdate = async (appId, status) => {
    try {
      const res = await updateStatus(appId, status, '');
      setApplications(prev => prev.map(a => a.applicationId === appId ? res.data : a));
      setToast(`Status updated to ${status.replace(/_/g, ' ')}`);
    } catch {
      setToast('Failed to update status.');
    }
  };

  const getCandidateName = (candidateId) => {
    const p = profileMap[candidateId];
    if (!p) return `Candidate #${candidateId}`;
    return p.fullName || p.firstName
      ? [p.firstName, p.lastName].filter(Boolean).join(' ') || p.fullName
      : `Candidate #${candidateId}`;
  };

  const getCandidateHeadline = (candidateId) => {
    const p = profileMap[candidateId];
    return p?.headline || p?.currentTitle || '';
  };

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>All Applications</h1>
            <p>Review and manage applications across all your job postings</p>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="split-layout">
            {/* Job selector */}
            <div className="split-sidebar">
              <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Select Job
              </h3>
              {jobs.length === 0 ? (
                <p className="muted">No jobs posted yet.</p>
              ) : jobs.map(job => (
                <button
                  key={job.jobId}
                  className={`job-selector-btn ${selectedJob === job.jobId ? 'active' : ''}`}
                  onClick={() => loadApplications(job.jobId)}
                >
                  <span>{job.title}</span>
                  <StatusBadge status={job.status} />
                </button>
              ))}
            </div>

            {/* Applications panel */}
            <div className="split-main">
              {!selectedJob ? (
                <EmptyState icon="👈" title="Select a job" message="Choose a job from the left to view its applications." />
              ) : loadingApps ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="tabs">
                    {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'].map(s => (
                      <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s.replace(/_/g, ' ')}
                        <span className="tab-count">{s === 'ALL' ? applications.length : applications.filter(a => a.status === s).length}</span>
                      </button>
                    ))}
                  </div>

                  {filtered.length === 0 ? (
                    <EmptyState icon="📋" title="No applications" message={`No applications with status: ${filter.replace(/_/g, ' ')}`} />
                  ) : (
                    <div className="applications-list">
                      {filtered.map(app => {
                        const name = getCandidateName(app.candidateId);
                        const headline = getCandidateHeadline(app.candidateId);
                        const abbr = initials(name);
                        return (
                          <div className="app-card" key={app.applicationId}>
                            <div className="app-card-left">
                              <div className="company-logo-sm" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                {abbr}
                              </div>
                              <div>
                                <h3 className="app-job-title">{name}</h3>
                                {headline && <p className="app-meta" style={{ marginBottom: '0.25rem' }}>{headline}</p>}
                                <p className="app-meta">Applied {new Date(app.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                {app.coverLetter && (
                                  <p className="app-cover">{app.coverLetter.substring(0, 120)}{app.coverLetter.length > 120 ? '...' : ''}</p>
                                )}
                                {app.resumeUrl && (
                                  <a href={getResumeFullUrl(app.resumeUrl)} target="_blank" rel="noreferrer" className="auth-link" style={{ fontSize: '0.85rem' }}>
                                    📄 View Resume
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="app-card-right">
                              <StatusBadge status={app.status} />
                              <div className="app-actions">
                                {app.status === 'APPLIED' && (
                                  <>
                                    <button className="btn-primary btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'SHORTLISTED')}>Shortlist</button>
                                    <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>Reject</button>
                                  </>
                                )}
                                {app.status === 'SHORTLISTED' && (
                                  <>
                                    <button className="btn-primary btn-sm" onClick={() => navigate(`/recruiter/jobs/${selectedJob}/applications`)}>
                                      Schedule Interview
                                    </button>
                                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}>
                                      Message
                                    </button>
                                    <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>Reject</button>
                                  </>
                                )}
                                {app.status === 'INTERVIEW_SCHEDULED' && (
                                  <>
                                    <button className="btn-primary btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'OFFERED')}>Extend Offer</button>
                                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}>
                                      Message
                                    </button>
                                  </>
                                )}
                                {app.status === 'OFFERED' && (
                                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}>
                                    Message
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
