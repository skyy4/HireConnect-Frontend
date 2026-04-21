import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, LoadingSpinner } from '../components/UI';
import { getJobById } from '../api/jobApi';
import { hasApplied, submitApplication } from '../api/applicationApi';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const res = await getJobById(jobId);
      setJob(res.data);
      if (user) {
        const check = await hasApplied(jobId, user.userId);
        setApplied(check.data.applied);
      }
    } catch {
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    setShowModal(true);
  };

  const confirmApply = async () => {
    setSubmitting(true);
    try {
      await submitApplication({ jobId: parseInt(jobId), candidateId: user.userId, coverLetter, resumeUrl: '' });
      setApplied(true);
      setShowModal(false);
      setToast('Application submitted successfully!');
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not disclosed';
    if (min && max) return `₹${(min/100000).toFixed(1)}L – ₹${(max/100000).toFixed(1)}L per year`;
    return min ? `From ₹${(min/100000).toFixed(1)}L` : `Up to ₹${(max/100000).toFixed(1)}L`;
  };

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;
  if (!job) return null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <button className="back-btn" onClick={() => navigate('/jobs')}>
          ← Back to Jobs
        </button>

        <div className="job-detail-layout">
          <div className="job-detail-main">
            <div className="job-detail-header">
              <div className="company-logo">{job.title?.[0] || 'J'}</div>
              <div>
                <h1 className="job-detail-title">{job.title}</h1>
                <p className="job-detail-meta">
                  {job.location || 'Remote'} · {job.type?.replace('_', ' ')} · Posted {new Date(job.postedAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="job-detail-section">
              <h2>Job Description</h2>
              <p>{job.description}</p>
            </div>

            {job.skills?.length > 0 && (
              <div className="job-detail-section">
                <h2>Required Skills</h2>
                <div className="skills-list">
                  {job.skills.map(s => <span className="skill-tag" key={s}>{s}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="job-detail-sidebar">
            <div className="sidebar-card">
              <h3>Job Overview</h3>
              <div className="overview-item">
                <span className="overview-label">Salary</span>
                <span className="overview-value">{formatSalary(job.salaryMin, job.salaryMax)}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Category</span>
                <span className="overview-value">{job.category || '—'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Experience</span>
                <span className="overview-value">{job.experienceRequired ? `${job.experienceRequired} years` : '—'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Job Type</span>
                <span className="overview-value">{job.type?.replace('_', ' ') || '—'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Location</span>
                <span className="overview-value">{job.location || 'Remote'}</span>
              </div>

              {user?.role !== 'RECRUITER' && job.status === 'ACTIVE' && (
                applied ? (
                  <div className="applied-notice">✓ You've already applied</div>
                ) : (
                  <button className="btn-primary btn-full" onClick={handleApply}>
                    Apply Now
                  </button>
                )
              )}
              {!user && (
                <button className="btn-primary btn-full" onClick={() => navigate('/login')}>
                  Sign In to Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply to {job.title}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cover Letter (optional)</label>
                <textarea className="form-input" rows="6"
                  placeholder="Introduce yourself and explain why you're a great fit..."
                  value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
              </div>
              <div className="btn-row">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={confirmApply} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
