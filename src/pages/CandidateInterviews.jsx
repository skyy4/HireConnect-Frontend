import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState } from '../components/UI';
import { getInterviewsByCandidate, confirmInterview, rescheduleInterview, cancelInterview } from '../api/interviewApi';
import { useAuth } from '../context/AuthContext';

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [toast, setToast] = useState('');
  const [showReschedule, setShowReschedule] = useState(null);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user?.userId) {
      getInterviewsByCandidate(user.userId)
        .then(r => setInterviews(r.data))
        .catch(() => setInterviews([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

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
    try {
      const res = await cancelInterview(id, cancelReason || 'Cancelled by candidate');
      setInterviews(prev => prev.map(i => i.interviewId === id ? res.data : i));
      setToast('Interview cancelled.');
    } catch {
      setToast('Failed to cancel interview.');
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
                          <h3>Application #{iv.applicationId}</h3>
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
                        <button className="btn-danger btn-sm" onClick={() => {
                          if (window.confirm('Cancel this interview?')) handleCancel(iv.interviewId);
                        }}>
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
              <section style={{ marginTop: '2rem' }}>
                <h2 className="section-title">Past Interviews</h2>
                <div className="interviews-grid">
                  {past.map(iv => (
                    <div className="interview-card past" key={iv.interviewId}>
                      <div className="interview-card-header">
                        <div>
                          <h3>Application #{iv.applicationId}</h3>
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
      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
