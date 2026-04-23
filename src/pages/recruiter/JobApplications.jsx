import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../../components/UI';
import { getByJob, updateStatus } from '../../api/applicationApi';
import { scheduleInterview } from '../../api/interviewApi';
import { getCandidateByUserId } from '../../api/profileApi';
import { getJobById } from '../../api/jobApi';

/** Convert relative /uploads/... path → full API-gateway URL */
const getResumeFullUrl = (resumeUrl) => {
  if (!resumeUrl) return null;
  if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) return resumeUrl;
  const gatewayBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1\/?$/, '');
  return `${gatewayBase}${resumeUrl}`;
};

const PIPELINE_STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'];

export default function JobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: '', mode: 'ONLINE', meetLink: '', location: '', notes: '' });
  const [toast, setToast] = useState('');
  const [nameMap, setNameMap] = useState({});

  const fetchNames = useCallback(async (apps) => {
    const ids = [...new Set(apps.map(a => a.candidateId))];
    const entries = await Promise.allSettled(
      ids.map(id => getCandidateByUserId(id).then(r => [id, r.data]))
    );
    const map = {};
    entries.forEach(r => {
      if (r.status === 'fulfilled') {
        const [id, data] = r.value;
        map[id] = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.fullName || `Candidate #${id}`;
      }
    });
    setNameMap(prev => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    Promise.all([
      getByJob(jobId).then(r => {
        setApplications(r.data);
        if (r.data.length > 0) fetchNames(r.data);
      }),
      getJobById(jobId).then(r => setJob(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [jobId, fetchNames]);

  const handleStatusUpdate = async (appId, status) => {
    try {
      const res = await updateStatus(appId, status, '');
      setApplications(prev => prev.map(a => a.applicationId === appId ? res.data : a));
      setToast(`Application ${status.toLowerCase().replace('_', ' ')}.`);
    } catch {
      setToast('Failed to update status.');
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await scheduleInterview({
        applicationId: scheduleModal,
        ...scheduleForm,
        candidateId: applications.find(a => a.applicationId === scheduleModal)?.candidateId,
        recruiterId: job?.postedBy,
      });
      await handleStatusUpdate(scheduleModal, 'INTERVIEW_SCHEDULED');
      setScheduleModal(null);
      setToast('Interview scheduled!');
    } catch {
      setToast('Failed to schedule interview.');
    }
  };

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <button className="back-btn" onClick={() => navigate('/recruiter/jobs')}>← Back to Jobs</button>
        <div className="page-header">
          <div>
            <h1>Applications for: <span style={{color:'var(--accent)'}}>{job?.title}</span></h1>
            <p>{applications.length} total applications · {job?.location}</p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="pipeline-bar">
          {PIPELINE_STATUSES.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`pipeline-step ${filter === s ? 'active' : ''} ${applications.filter(a => a.status === s).length > 0 ? 'has-items' : ''}`}
                onClick={() => setFilter(filter === s ? 'ALL' : s)}
                style={{ cursor: 'pointer' }}
              >
                <span className="pipeline-num">{applications.filter(a => a.status === s).length}</span>
                <span className="pipeline-label">{s.replace('_', ' ')}</span>
              </div>
              {i < PIPELINE_STATUSES.length - 1 && <div className="pipeline-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon="👥" title="No applications" message={filter === 'ALL' ? 'No applications received.' : `No applications with status: ${filter}`} />
        ) : (
          <div className="applications-list">
            {filtered.map(app => (
              <div className="app-card" key={app.applicationId}>
                <div className="app-card-left">
                  <div className="company-logo-sm">{app.candidateId}</div>
                  <div>
                    <h3 className="app-job-title">{nameMap[app.candidateId] || `Candidate #${app.candidateId}`}</h3>
                    <p className="app-meta">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                    {app.coverLetter && (
                      <p className="app-cover">{app.coverLetter}</p>
                    )}
                    {app.resumeUrl && (
                      <a
                        href={getResumeFullUrl(app.resumeUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="auth-link"
                        style={{ fontSize: '0.85rem' }}
                      >
                        📄 Download Resume
                      </a>
                    )}
                  </div>
                </div>
                <div className="app-card-right">
                  <StatusBadge status={app.status} />
                  <div className="app-actions">
                    {app.status === 'APPLIED' && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'SHORTLISTED')}>
                          Shortlist
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'SHORTLISTED' && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => setScheduleModal(app.applicationId)}>
                          Schedule Interview
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}
                        >
                          Message
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'INTERVIEW_SCHEDULED' && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'OFFERED')}>
                          Extend Offer
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}
                        >
                          Message
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'OFFERED' && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/messages?candidateId=${app.candidateId}&applicationId=${app.applicationId}`)}
                      >
                        Message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="modal-overlay" onClick={() => setScheduleModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Interview</h3>
              <button className="icon-btn" onClick={() => setScheduleModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" className="form-input"
                    value={scheduleForm.scheduledAt}
                    onChange={e => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select className="form-input" value={scheduleForm.mode}
                    onChange={e => setScheduleForm({...scheduleForm, mode: e.target.value})}>
                    <option value="ONLINE">Online</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </div>
              </div>
              {scheduleForm.mode === 'ONLINE' && (
                <div className="form-group">
                  <label className="form-label">Meeting Link</label>
                  <input type="url" className="form-input" placeholder="https://meet.google.com/..."
                    value={scheduleForm.meetLink}
                    onChange={e => setScheduleForm({...scheduleForm, meetLink: e.target.value})} />
                </div>
              )}
              {scheduleForm.mode === 'IN_PERSON' && (
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" placeholder="Office address"
                    value={scheduleForm.location}
                    onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows="3" placeholder="Interview instructions or preparation notes..."
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})} />
              </div>
              <div className="btn-row">
                <button className="btn-secondary" onClick={() => setScheduleModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleScheduleInterview}>Schedule Interview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
