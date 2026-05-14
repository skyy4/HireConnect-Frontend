import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LoadingSpinner, StatusBadge, EmptyState } from '../components/UI';
import { getByCandidate } from '../api/applicationApi';
import { getInterviewsByCandidate } from '../api/interviewApi';
import { getBookmarksByCandidate } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    const fetchData = async () => {
      try {
        const [appRes, intRes, bmkRes] = await Promise.allSettled([
          getByCandidate(user.userId),
          getInterviewsByCandidate(user.userId),
          getBookmarksByCandidate(user.userId),
        ]);
        setApplications(appRes.status === 'fulfilled' ? appRes.value.data || [] : []);
        setInterviews(intRes.status === 'fulfilled' ? intRes.value.data || [] : []);
        setSavedJobs(bmkRes.status === 'fulfilled' ? bmkRes.value.data || [] : []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const statusCount = (s) => applications.filter(a => a.status === s).length;
  const upcomingInterviews = interviews
    .filter(i => ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(i.status))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const recentApps = [...applications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 5);

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋</h1>
            <p>Here's your career overview at a glance</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/applications')} style={{cursor:'pointer'}}>
            <span className="stat-num">{applications.length}</span>
            <span className="stat-label">Applications</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('SHORTLISTED')}</span>
            <span className="stat-label">Shortlisted</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{upcomingInterviews.length}</span>
            <span className="stat-label">Upcoming Interviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('OFFERED')}</span>
            <span className="stat-label">Offers</span>
          </div>
          <div className="stat-card" onClick={() => navigate('/saved-jobs')} style={{cursor:'pointer'}}>
            <span className="stat-num">{savedJobs.length}</span>
            <span className="stat-label">Saved Jobs</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount('REJECTED')}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginTop:'2rem'}}>
          
          {/* Upcoming Interviews */}
          <section className="dashboard-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h2 style={{margin:0, fontSize:'1.15rem'}}>📅 Upcoming Interviews</h2>
              <button className="btn-secondary btn-sm" onClick={() => navigate('/interviews')}>View All</button>
            </div>
            {upcomingInterviews.length === 0 ? (
              <p className="muted">No upcoming interviews scheduled.</p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {upcomingInterviews.slice(0, 3).map(i => (
                  <div key={i.interviewId} className="surface-card" style={{padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <p style={{fontWeight:600, margin:0}}>Interview #{i.interviewId}</p>
                      <p className="muted" style={{margin:'0.25rem 0 0', fontSize:'0.85rem'}}>
                        {new Date(i.scheduledAt).toLocaleString()} · {i.mode === 'ONLINE' ? '🖥 Online' : '🏢 In-Person'}
                      </p>
                      {i.round && <p className="muted" style={{margin:'0.25rem 0 0', fontSize:'0.8rem'}}>Round: {i.round}</p>}
                    </div>
                    <StatusBadge status={i.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Applications */}
          <section className="dashboard-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h2 style={{margin:0, fontSize:'1.15rem'}}>📋 Recent Applications</h2>
              <button className="btn-secondary btn-sm" onClick={() => navigate('/applications')}>View All</button>
            </div>
            {recentApps.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet" message="Start browsing and applying to jobs!" />
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {recentApps.map(app => (
                  <div key={app.applicationId} className="surface-card" style={{padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <p style={{fontWeight:600, margin:0}}>Job #{app.jobId}</p>
                      <p className="muted" style={{margin:'0.25rem 0 0', fontSize:'0.85rem'}}>
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section className="dashboard-card" style={{marginTop:'2rem'}}>
          <h2 style={{margin:'0 0 1rem', fontSize:'1.15rem'}}>⚡ Quick Actions</h2>
          <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
            <button className="btn-primary" onClick={() => navigate('/jobs')}>🔍 Find Jobs</button>
            <button className="btn-secondary" onClick={() => navigate('/saved-jobs')}>★ Saved Jobs</button>
            <button className="btn-secondary" onClick={() => navigate('/messages')}>💬 Messages</button>
            <button className="btn-secondary" onClick={() => navigate('/profile')}>👤 Edit Profile</button>
            <button className="btn-secondary" onClick={() => navigate('/notifications')}>🔔 Notifications</button>
          </div>
        </section>
      </div>
    </div>
  );
}
