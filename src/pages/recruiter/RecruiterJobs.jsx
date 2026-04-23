import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState, Toast, Alert, Modal } from '../../components/UI';
import { getJobsByRecruiter, updateJobStatus, deleteJob } from '../../api/jobApi';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null);
  const [closingJob, setClosingJob] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      setError('');
      getJobsByRecruiter(user.userId)
        .then(r => setJobs(r.data))
        .catch(() => {
          setJobs([]);
          setError('Unable to load your job postings right now.');
        })
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

  const handleDelete = async () => {
    if (!deleteTarget?.jobId) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget.jobId);
      setJobs(prev => prev.filter(j => j.jobId !== deleteTarget.jobId));
      setToast('Job deleted.');
    } catch {
      setToast('Failed to delete job.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleConfirmClose = async () => {
    if (!closeTarget?.jobId) return;
    setClosingJob(true);
    await handleStatusChange(closeTarget.jobId, 'CLOSED');
    setClosingJob(false);
    setCloseTarget(null);
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

        <Alert type="error" message={error} />

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
                    <button className="btn-secondary btn-sm" onClick={() => setCloseTarget(job)}>Close</button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => setDeleteTarget(job)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(closeTarget)}
        onClose={() => (closingJob ? null : setCloseTarget(null))}
        title="Close Job Listing"
      >
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Close <strong>{closeTarget?.title || 'this job'}</strong>? It will stop appearing to candidates in active listings.
        </p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn-secondary" onClick={() => setCloseTarget(null)} disabled={closingJob}>Cancel</button>
          <button className="btn-danger" onClick={handleConfirmClose} disabled={closingJob}>
            {closingJob ? 'Closing...' : 'Close Job'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        title="Delete Job Posting"
      >
        <p className="muted" style={{ marginBottom: '1rem' }}>
          This will permanently remove <strong>{deleteTarget?.title || 'this job'}</strong> and it will no longer appear to candidates.
        </p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
