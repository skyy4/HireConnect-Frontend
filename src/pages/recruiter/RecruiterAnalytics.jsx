import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { LoadingSpinner, EmptyState } from '../../components/UI';
import { getRecruiterAnalytics } from '../../api/analyticsApi';
import { countJobsByRecruiter } from '../../api/jobApi';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      Promise.all([
        getRecruiterAnalytics(user.userId).then(r => setAnalytics(r.data)),
        countJobsByRecruiter(user.userId).then(r => setJobCount(r.data.count))
      ]).catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;
  if (!analytics) return <div className="page-wrapper"><Navbar /><EmptyState icon="📊" title="Analytics Unavailable" message="Could not load analytics data." /></div>;

  const totalApplications = analytics.totalApplications ?? analytics.totalApplicationsReceived ?? 0;
  const vtaRatio = analytics.viewToApplyRatio ? (analytics.viewToApplyRatio * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Hiring Analytics</h1>
            <p>Data-driven insights for your recruitment pipeline</p>
          </div>
        </div>

        <section className="analytics-section">
          <h2>Overview Metrics</h2>
          <div className="stats-grid">
            <div className="stat-card primary">
              <span className="stat-num">{jobCount}</span>
              <span className="stat-label">Jobs Posted</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{totalApplications}</span>
              <span className="stat-label">Total Applications Received</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{vtaRatio}</span>
              <span className="stat-label">Avg. Conversion (View → Apply)</span>
            </div>
          </div>
        </section>

        <section className="analytics-section" style={{marginTop:'3rem'}}>
          <h2>Pipeline Performance</h2>
          <div className="pipeline-funnel">
             <div className="funnel-stage" style={{width: '100%', background: 'linear-gradient(90deg, var(--accent) 100%, transparent)'}}>
                <span>Total Applications</span>
                <strong>{analytics.totalApplications}</strong>
             </div>
              {totalApplications > 0 && (
               <>
                  <div className="funnel-stage" style={{width: `${Math.max(15, (analytics.shortlistedCount / totalApplications) * 100)}%`, background: 'var(--accent-matcha)'}}>
                    <span>Shortlisted</span>
                    <strong>{analytics.shortlistedCount}</strong>
                 </div>
                  <div className="funnel-stage" style={{width: `${Math.max(10, (analytics.offeredCount / totalApplications) * 100)}%`, background: 'var(--accent-terra)'}}>
                    <span>Offers Extended</span>
                    <strong>{analytics.offeredCount}</strong>
                 </div>
               </>
             )}
          </div>
          <div style={{display:'flex', gap:'2rem', marginTop:'2rem'}}>
             <div className="dashboard-card" style={{flex: 1}}>
                <h3>Rejection Rate</h3>
                <p className="large-stat" style={{color:'var(--status-rejected-text)'}}>
                   {totalApplications > 0
                      ? `${((analytics.rejectedCount / totalApplications) * 100).toFixed(1)}%`
                      : '0%'}
                </p>
                <p className="muted">{analytics.rejectedCount} candidates rejected</p>
             </div>
             <div className="dashboard-card" style={{flex: 1}}>
                <h3>Time to Hire</h3>
                <p className="large-stat" style={{color:'var(--accent)'}}>
                   {analytics.avgTimeToHireDays > 0 ? `${analytics.avgTimeToHireDays} Days` : 'N/A'}
                </p>
                <p className="muted">Average time from post to offer</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
