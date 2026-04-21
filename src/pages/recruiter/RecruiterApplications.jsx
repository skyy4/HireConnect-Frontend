import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../../components/UI';
import { getJobsByRecruiter } from '../../api/jobApi';
import { getByJob, updateStatus } from '../../api/applicationApi';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    if (user?.userId) {
      getJobsByRecruiter(user.userId)
        .then(r => {
          setJobs(r.data);
          if (r.data.length > 0) loadApplications(r.data[0].jobId);
        })
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const loadApplications = async (jobId) => {
    setSelectedJob(jobId);
    setLoadingApps(true);
    try {
      const res = await getByJob(jobId);
      setApplications(res.data);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      const res = await updateStatus(appId, status, '');
      setApplications(prev => prev.map(a => a.applicationId === appId ? res.data : a));
      setToast(`Status updated to ${status.replace('_', ' ')}`);
    } catch {
      setToast('Failed to update status.');
    }
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
              <h3>Select Job</h3>
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
                        {s.replace('_', ' ')}
                        <span className="tab-count">{s === 'ALL' ? applications.length : applications.filter(a => a.status === s).length}</span>
                      </button>
                    ))}
                  </div>

                  {filtered.length === 0 ? (
                    <EmptyState icon="📋" title="No applications" message={`No applications with status: ${filter}`} />
                  ) : (
                    <div className="applications-list">
                      {filtered.map(app => (
                        <div className="app-card" key={app.applicationId}>
                          <div className="app-card-left">
                            <div className="company-logo-sm">{app.candidateId}</div>
                            <div>
                              <h3 className="app-job-title">Candidate #{app.candidateId}</h3>
                              <p className="app-meta">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                              {app.coverLetter && <p className="app-cover">{app.coverLetter.substring(0, 100)}...</p>}
                              {app.resumeUrl && (
                                <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="auth-link" style={{fontSize:'0.85rem'}}>📄 Resume</a>
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
                                  <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>Reject</button>
                                </>
                              )}
                              {app.status === 'INTERVIEW_SCHEDULED' && (
                                <button className="btn-primary btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'OFFERED')}>Extend Offer</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
