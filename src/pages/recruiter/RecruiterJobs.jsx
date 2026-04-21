import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../../components/UI';
import { getJobsByRecruiter, updateJobStatus, deleteJob } from '../../api/jobApi';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user?.userId) {
      getJobsByRecruiter(user.userId)
        .then(r => setJobs(r.data))
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleStatusChange = async (jobId, status) => {
    try {
      const res = await updateJobStatus(jobId, status);
      setJobs(prev => prev.map(j => j.jobId === jobId ? res.data : j));
      setToast(`Job ${status.toLowerCase()}.`);
    } catch {
      setToast('Failed to update status.');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.jobId !== jobId));
      setToast('Job deleted.');
    } catch {
      setToast('Failed to delete job.');
    }
  };

  const filtered = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Job Postings</h1>
            <p>Manage all your job listings</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/recruiter/jobs/new')}>
            + Post New Job
          </button>
        </div>

        <div className="tabs">
          {['ALL', 'ACTIVE', 'PAUSED', 'CLOSED'].map(s => (
            <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s} <span className="tab-count">{s === 'ALL' ? jobs.length : jobs.filter(j => j.status === s).length}</span>
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No jobs yet"
            message={filter === 'ALL' ? "Post your first job to start receiving applications." : `No ${filter.toLowerCase()} jobs.`}
            action={filter === 'ALL' && <button className="btn-primary" onClick={() => navigate('/recruiter/jobs/new')}>Post a Job</button>}
          />
        ) : (
          <div className="jobs-manager-list">
            {filtered.map(job => (
              <div className="job-manager-card" key={job.jobId}>
                <div className="job-manager-info">
                  <div>
                    <h3>{job.title}</h3>
                    <p className="muted">{job.location || 'Remote'} · {job.type?.replace('_', ' ')} · {job.category}</p>
                    <p className="muted">Posted {new Date(job.postedAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="job-manager-actions">
                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/recruiter/jobs/${job.jobId}/applications`)}>
                    Applications
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/recruiter/jobs/${job.jobId}/edit`)}>
                    Edit
                  </button>
                  {job.status === 'ACTIVE' && (
                    <button className="btn-secondary btn-sm" onClick={() => handleStatusChange(job.jobId, 'PAUSED')}>Pause</button>
                  )}
                  {job.status === 'PAUSED' && (
                    <button className="btn-secondary btn-sm" onClick={() => handleStatusChange(job.jobId, 'ACTIVE')}>Activate</button>
                  )}
                  {job.status !== 'CLOSED' && (
                    <button className="btn-secondary btn-sm" onClick={() => handleStatusChange(job.jobId, 'CLOSED')}>Close</button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(job.jobId)}>Delete</button>
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
