import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState, Modal } from '../../components/UI';
import { getInterviewsByRecruiter, rescheduleInterview, cancelInterview } from '../../api/interviewApi';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterInterviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ scheduledAt: '', notes: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user?.userId) {
      getInterviewsByRecruiter(user.userId)
        .then(r => setInterviews(r.data))
        .catch(() => setInterviews([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      const res = await rescheduleInterview(showReschedule, rescheduleData.scheduledAt, rescheduleData.notes);
      setInterviews(prev => prev.map(i => i.interviewId === showReschedule ? res.data : i));
      setShowReschedule(null);
      setToast('Interview rescheduled successfully.');
    } catch {
      setToast('Failed to reschedule interview.');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation (optional):', 'Cancelled by recruiter');
    if (reason === null) return;
    try {
      const res = await cancelInterview(id, reason || 'Cancelled by recruiter');
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
            <h1>Interview Schedule</h1>
            <p>Manage upcoming and completed interviews with candidates</p>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : interviews.length === 0 ? (
          <EmptyState icon="📅" title="No interviews" message="You haven't scheduled any interviews yet." />
        ) : (
          <div className="split-layout">
            <div className="split-main" style={{flex: 2}}>
              <h2 className="section-title">Upcoming Sessions ({upcoming.length})</h2>
              {upcoming.length === 0 ? (
                <p className="muted">No upcoming interviews scheduled.</p>
              ) : (
                <div className="interviews-list">
                  {upcoming.map(iv => (
                    <div className="interview-card" key={iv.interviewId}>
                      <div className="interview-card-header">
                        <div>
                          <h3>Candidate #{iv.candidateId}</h3>
                          <p className="interview-time">
                            {new Date(iv.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge status={iv.status} />
                      </div>
                      <div className="interview-meta">
                         <div className="meta-item"><span>App ID</span><strong>#{iv.applicationId}</strong></div>
                         <div className="meta-item"><span>Mode</span><strong>{iv.mode}</strong></div>
                         {iv.meetLink && <div className="meta-item"><span>Meeting</span><a href={iv.meetLink} target="_blank" rel="noreferrer" className="auth-link">Join Link</a></div>}
                         {iv.location && <div className="meta-item"><span>Location</span><strong>{iv.location}</strong></div>}
                      </div>
                      <div className="interview-actions">
                        <button className="btn-secondary btn-sm" onClick={() => {
                          setRescheduleData({ scheduledAt: iv.scheduledAt.substring(0, 16), notes: iv.notes || '' });
                          setShowReschedule(iv.interviewId);
                        }}>Reschedule</button>

                        <button className="btn-danger btn-sm" onClick={() => handleCancel(iv.interviewId)}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="split-sidebar">
              <h2 className="section-title">History ({past.length})</h2>
              <div className="interviews-list">
                {past.slice(0, 10).map(iv => (
                   <div className="interview-card past" key={iv.interviewId}>
                     <div className="interview-card-header" style={{marginBottom: 0}}>
                        <div>
                          <h4 style={{fontSize:'0.95rem'}}>Candidate #{iv.candidateId}</h4>
                          <p className="muted" style={{fontSize:'0.8rem'}}>{new Date(iv.scheduledAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={iv.status} />
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!showReschedule} onClose={() => setShowReschedule(null)} title="Reschedule Interview">
         <form onSubmit={handleReschedule}>
            <div className="form-group">
               <label className="form-label">New Date & Time</label>
               <input type="datetime-local" className="form-input" required
                 value={rescheduleData.scheduledAt} onChange={e => setRescheduleData({...rescheduleData, scheduledAt: e.target.value})} />
            </div>
            <div className="form-group">
               <label className="form-label">Reason / Notes</label>
               <textarea className="form-input" rows="3"
                 value={rescheduleData.notes} onChange={e => setRescheduleData({...rescheduleData, notes: e.target.value})} />
            </div>
            <div className="btn-row">
               <button type="button" className="btn-secondary" onClick={() => setShowReschedule(null)}>Cancel</button>
               <button type="submit" className="btn-primary">Confirm Reschedule</button>
            </div>
         </form>
      </Modal>

      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
