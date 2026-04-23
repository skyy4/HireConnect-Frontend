import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { LoadingSpinner, StatusBadge } from '../../components/UI';
import { getJobsByRecruiter } from '../../api/jobApi';
import { getRecruiterAnalytics } from '../../api/analyticsApi';
import { getActiveSubscription } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.userId) return;

    try {
      await Promise.allSettled([
        getJobsByRecruiter(user.userId).then(r => setJobs(r.data)).catch(() => {}),
        getRecruiterAnalytics(user.userId).then(r => setAnalytics(r.data)).catch(() => {}),
        getActiveSubscription(user.userId).then(r => setSubscription(r.data)).catch(() => {}),
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const totalApplications = analytics?.totalApplications ?? analytics?.totalApplicationsReceived ?? 0;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Recruiter Dashboard</h1>
            <p>Welcome back! Here's your hiring overview.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/recruiter/jobs/new')}>
            + Post New Job
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <span className="stat-num">{jobs.length}</span>
                <span className="stat-label">Total Jobs Posted</span>
                <span className="stat-sub">↑ All time</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{activeJobs}</span>
                <span className="stat-label">Active Listings</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{totalApplications}</span>
                <span className="stat-label">Total Applications</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{analytics?.shortlistedCount || 0}</span>
                <span className="stat-label">Shortlisted</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{analytics?.offeredCount || 0}</span>
                <span className="stat-label">Offers Extended</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">
                  {analytics?.viewToApplyRatio ? `${(analytics.viewToApplyRatio * 100).toFixed(1)}%` : '—'}
                </span>
                <span className="stat-label">View-to-Apply</span>
              </div>
            </div>

            {/* Subscription Banner */}
            {subscription && (
              <div className="subscription-banner">
                <div>
                  <strong>Current Plan: {subscription.plan}</strong>
                  <span className="muted"> · Expires {new Date(subscription.endDate).toLocaleDateString()}</span>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => navigate('/recruiter/subscription')}>
                  Manage Subscription
                </button>
              </div>
            )}

            {/* Recent Jobs */}
            <section>
              <div className="section-header">
                <h2 className="section-title">Recent Job Postings</h2>
                <button className="text-btn" onClick={() => navigate('/recruiter/jobs')}>View All →</button>
              </div>
              {jobs.length === 0 ? (
                <div className="empty-dashboard">
                  <p>No jobs posted yet. Start attracting top talent!</p>
                  <button className="btn-primary" onClick={() => navigate('/recruiter/jobs/new')}>Post Your First Job</button>
                </div>
              ) : (
                <div className="jobs-table">
                  <div className="table-header">
                    <span>Job Title</span>
                    <span>Status</span>
                    <span>Applications</span>
                    <span>Posted</span>
                    <span>Actions</span>
                  </div>
                  {jobs.slice(0, 5).map(job => (
                    <div className="table-row" key={job.jobId}>
                      <div>
                        <strong>{job.title}</strong>
                        <p className="muted">{job.location} · {job.type?.replace('_', ' ')}</p>
                      </div>
                      <StatusBadge status={job.status} />
                      <span>—</span>
                      <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                      <div className="table-actions">
                        <button className="btn-secondary btn-sm" onClick={() => navigate(`/recruiter/jobs/${job.jobId}/applications`)}>
                          Applications
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => navigate(`/recruiter/jobs/${job.jobId}/edit`)}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section style={{ marginTop: '2.5rem' }}>
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions">
                <button className="quick-action-card" onClick={() => navigate('/recruiter/jobs/new')}>
                  <span className="qa-icon">📝</span>
                  <span>Post New Job</span>
                </button>
                <button className="quick-action-card" onClick={() => navigate('/recruiter/applications')}>
                  <span className="qa-icon">👥</span>
                  <span>Review Applications</span>
                </button>
                <button className="quick-action-card" onClick={() => navigate('/recruiter/interviews')}>
                  <span className="qa-icon">📅</span>
                  <span>Schedule Interviews</span>
                </button>
                <button className="quick-action-card" onClick={() => navigate('/recruiter/analytics')}>
                  <span className="qa-icon">📊</span>
                  <span>View Analytics</span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
