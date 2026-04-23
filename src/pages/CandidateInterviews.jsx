/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState, Toast, Modal, Alert } from '../components/UI';
import { getInterviewsByCandidate, confirmInterview, rescheduleInterview, cancelInterview } from '../api/interviewApi';
import { getApplicationById } from '../api/applicationApi';
import { getJobById } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [toast, setToast] = useState('');
  const [showReschedule, setShowReschedule] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [jobMap, setJobMap] = useState({}); // applicationId → { jobTitle, company }
  const { user } = useAuth();

  /** Given a list of interviews, fetch the job title for each via application lookup */
  const fetchJobTitles = useCallback(async (ivs) => {
    const entries = await Promise.allSettled(
      ivs.map(async (iv) => {
        try {
          const appRes = await getApplicationById(iv.applicationId);
          const jobId = appRes.data?.jobId;
          if (!jobId) return [iv.applicationId, null];
          const jobRes = await getJobById(jobId);
          return [iv.applicationId, { title: jobRes.data?.title, company: jobRes.data?.company }];
        } catch {
          return [iv.applicationId, null];
        }
      })
    );
    const map = {};
    entries.forEach(r => {
      if (r.status === 'fulfilled') {
        const [appId, info] = r.value;
        if (info) map[appId] = info;
      }
    });
    setJobMap(prev => ({ ...prev, ...map }));
  }, []);

  const loadInterviews = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const r = await getInterviewsByCandidate(user.userId);
      const ivs = r.data || [];
      setInterviews(ivs);
      if (ivs.length > 0) fetchJobTitles(ivs);
    } catch {
      setInterviews([]);
      setError('Unable to load interviews right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, fetchJobTitles]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const handleConfirm = async (id) => {
    try {
      const res = await confirmInterview(id);
      setInterviews(prev => prev.map(i => i.interviewId === id ? res.data : i));
      setToast('Interview confirmed!');
    } catch {
      setToast('Failed to confirm interview.');
    }
  };

  const handleReschedule = async (id) => {
    try {
      const res = await rescheduleInterview(id, rescheduleTime, 'Candidate requested reschedule');
      setInterviews(prev => prev.map(i => i.interviewId === id ? res.data : i));
      setShowReschedule(null);
      setToast('Reschedule request sent.');
    } catch {
      setToast('Failed to reschedule.');
    }
  };

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      const res = await cancelInterview(id, 'Cancelled by candidate');
      setInterviews(prev => prev.map(i => i.interviewId === id ? res.data : i));
      setToast('Interview cancelled.');
    } catch {
      setToast('Failed to cancel interview.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const upcoming = interviews.filter(i => ['SCHEDULED', 'CONFIRMED'].includes(i.status));
  const past = interviews.filter(i => !['SCHEDULED', 'CONFIRMED'].includes(i.status));

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Interviews</h1>
            <p>Manage your upcoming and past interview schedules</p>
          </div>
        </div>

        <Alert type="error" message={error} />

        {loading ? <LoadingSpinner /> : interviews.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No interviews scheduled"
            message="Once a recruiter schedules an interview, it will appear here."
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="section-title">Upcoming Interviews</h2>
                <div className="interviews-grid">
                  {upcoming.map(iv => (
                    <div className="interview-card" key={iv.interviewId}>
                      <div className="interview-card-header">
                        <div>
                          <h3>{jobMap[iv.applicationId]?.title || `Interview #${iv.interviewId}`}</h3>
                          {jobMap[iv.applicationId]?.company && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{jobMap[iv.applicationId].company}</p>
                          )}
                          <p className="interview-time">
                            {new Date(iv.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge status={iv.status} />
                      </div>
                      <div className="interview-meta">
                        <div className="meta-item">
                          <span>Mode</span>
                          <strong>{iv.mode || 'TBD'}</strong>
                        </div>
                        {iv.meetLink && (
                          <div className="meta-item">
                            <span>Meeting Link</span>
                            <a href={iv.meetLink} target="_blank" rel="noreferrer" className="auth-link">Join</a>
                          </div>
                        )}
                        {iv.location && (
                          <div className="meta-item">
                            <span>Location</span>
                            <strong>{iv.location}</strong>
                          </div>
                        )}
                        {iv.notes && (
                          <div className="meta-item">
                            <span>Notes</span>
                            <strong>{iv.notes}</strong>
                          </div>
                        )}
                      </div>
                      <div className="interview-actions">
                        {iv.status === 'SCHEDULED' && (
                          <button className="btn-primary btn-sm" onClick={() => handleConfirm(iv.interviewId)}>
                            Confirm
                          </button>
                        )}
                        <button className="btn-secondary btn-sm" onClick={() => setShowReschedule(iv.interviewId)}>
                          Reschedule
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => setCancelTarget(iv)}>
                          Cancel
                        </button>
                      </div>

                      {showReschedule === iv.interviewId && (
                        <div className="inline-form">
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={rescheduleTime}
                            onChange={e => setRescheduleTime(e.target.value)}
                          />
                          <div className="btn-row">
                            <button className="btn-secondary btn-sm" onClick={() => setShowReschedule(null)}>Cancel</button>
                            <button className="btn-primary btn-sm" onClick={() => handleReschedule(iv.interviewId)}>Send Request</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="interviews-past-section">
                <h2 className="section-title">Past Interviews</h2>
                <div className="interviews-grid">
                  {past.map(iv => (
                    <div className="interview-card past" key={iv.interviewId}>
                      <div className="interview-card-header">
                        <div>
                          <h3>{jobMap[iv.applicationId]?.title || `Interview #${iv.interviewId}`}</h3>
                          {jobMap[iv.applicationId]?.company && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{jobMap[iv.applicationId].company}</p>
                          )}
                          <p className="interview-time">{new Date(iv.scheduledAt).toLocaleString()}</p>
                        </div>
                        <StatusBadge status={iv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => (cancelling ? null : setCancelTarget(null))}
        title="Cancel Interview"
      >
        <p className="muted profile-modal-copy">
          Cancel interview for <strong>{cancelTarget ? (jobMap[cancelTarget?.applicationId]?.title || `Interview #${cancelTarget?.interviewId}`) : ''}</strong> scheduled on{' '}
          <strong>{cancelTarget?.scheduledAt ? new Date(cancelTarget.scheduledAt).toLocaleString() : 'selected time'}</strong>?
        </p>
        <div className="btn-row profile-modal-actions">
          <button className="btn-secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>Keep Interview</button>
          <button className="btn-danger" onClick={() => handleCancel(cancelTarget.interviewId)} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Interview'}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
