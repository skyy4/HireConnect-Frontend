import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LoadingSpinner, Card, Button, Badge, Alert, Toast, ConfirmModal } from '../components/UI';
import api from '../api/axiosConfig';
import { getPlatformStats } from '../api/analyticsApi';
import { updateJobStatus } from '../api/jobApi';
import { getPlatformSubscriptions, getPlatformInvoices } from '../api/subscriptionApi';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, candidates: 0, recruiters: 0, activeJobs: 0 });
  const [platform, setPlatform] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [confirmUserAction, setConfirmUserAction] = useState(null);
  const [confirmCloseJob, setConfirmCloseJob] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const platformApplications = platform?.totalApplications ?? platform?.totalApplicationsAllTime ?? 0;
  const avgTimeToHire = platform?.avgTimeToHireDays ?? platform?.avgTimeToHire ?? '—';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [usersRes, jobsRes] = await Promise.all([
          api.get('/auth/users'), 
          api.get('/jobs')
        ]);

        getPlatformStats().then((r) => setPlatform(r.data)).catch(() => {});

        const allUsers = usersRes.data;
        const allJobs = jobsRes.data || [];
        setUsers(allUsers);
        setJobs(allJobs);
        setStats({
          totalUsers: allUsers.length,
          candidates: allUsers.filter(u => u.role === 'CANDIDATE').length,
          recruiters: allUsers.filter(u => u.role === 'RECRUITER').length,
          activeJobs: allJobs.filter((j) => j.status === 'ACTIVE').length
        });
      } catch {
        setError('Unable to load admin insights right now. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    const fetchBillingData = async () => {
      setBillingLoading(true);
      try {
        const [subsRes, invRes] = await Promise.allSettled([
          getPlatformSubscriptions(),
          getPlatformInvoices(),
        ]);

        setSubscriptions(subsRes.status === 'fulfilled' ? (subsRes.value.data || []) : []);
        setInvoices(invRes.status === 'fulfilled' ? (invRes.value.data || []) : []);
      } finally {
        setBillingLoading(false);
      }
    };

    fetchData();
    fetchBillingData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
      const nextActive = !currentStatus;
      setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, active: nextActive } : u)));
      try {
        await api.patch(`/auth/users/${userId}/status`, { active: nextActive });
        setToast(`User ${nextActive ? 'activated' : 'suspended'} successfully.`);
      } catch {
        setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, active: currentStatus } : u)));
        setToast('Could not update user status right now.');
      }
  };

  const visibleUsers = users.filter((u) => {
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;
    const query = search.trim().toLowerCase();
    const searchMatch = !query || String(u.userId).includes(query) || (u.email || '').toLowerCase().includes(query);
    return roleMatch && searchMatch;
  });

  const visibleJobs = jobs.filter((j) => (jobFilter === 'ALL' ? true : j.status === jobFilter));

  const handleJobStatusChange = async (jobId, status) => {
    try {
      const res = await updateJobStatus(jobId, status);
      setJobs((prev) => prev.map((j) => (j.jobId === jobId ? res.data : j)));
      setToast(`Job #${jobId} moved to ${status}.`);
    } catch {
      setToast('Unable to update job status right now.');
    }
  };

  const confirmToggleUserStatus = async () => {
    if (!confirmUserAction) return;
    setActionBusy(true);
    await handleToggleUserStatus(confirmUserAction.userId, confirmUserAction.currentStatus);
    setActionBusy(false);
    setConfirmUserAction(null);
  };

  const confirmJobClose = async () => {
    if (!confirmCloseJob) return;
    setActionBusy(true);
    await handleJobStatusChange(confirmCloseJob.jobId, 'CLOSED');
    setActionBusy(false);
    setConfirmCloseJob(null);
  };

  const exportCsv = (type) => {
    const rows = type === 'users'
      ? users.map((u) => ({ userId: u.userId, email: u.email, role: u.role, active: u.active, provider: u.provider, createdAt: u.createdAt }))
      : jobs.map((j) => ({ jobId: j.jobId, title: j.title, status: j.status, location: j.location, postedBy: j.postedBy, postedAt: j.postedAt }));

    if (rows.length === 0) {
      setToast('No data available for export.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hireconnect-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast(`${type} export downloaded.`);
  };

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="admin-dashboard-container fade-in">
          <header className="dashboard-header">
            <h1>Platform Administration</h1>
            <p>Manage users, monitor growth, and ensure platform integrity.</p>
          </header>

          <Alert type="error" message={error} />

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.candidates}</div>
          <div className="stat-label">Candidates</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.recruiters}</div>
          <div className="stat-label">Recruiters</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.activeJobs}</div>
          <div className="stat-label">Live Listings</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{platformApplications}</div>
          <div className="stat-label">Applications</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{avgTimeToHire}</div>
          <div className="stat-label">Avg Time to Hire</div>
        </Card>
      </div>

      <section className="users-section">
        <Card title="User Management">
          <div className="admin-filters-row">
            <input
              className="form-input"
              placeholder="Search by email or user ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input admin-search-input"
            />
            <select className="form-input admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">All Roles</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Provider</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map(u => (
                  <tr key={u.userId}>
                    <td>#{u.userId}</td>
                    <td>{u.email}</td>
                    <td><Badge type={u.role === 'RECRUITER' ? 'success' : 'info'}>{u.role}</Badge></td>
                    <td>{u.provider}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><Badge type={u.active ? 'success' : 'danger'}>{u.active ? 'Active' : 'Suspended'}</Badge></td>
                    <td>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled={u.role === 'ADMIN' || u.userId === user?.userId}
                        onClick={() => setConfirmUserAction({
                          userId: u.userId,
                          currentStatus: u.active,
                          email: u.email,
                        })}
                      >
                        {u.active ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="users-section">
        <Card title="Job Moderation">
          <div className="admin-controls-row">
            <select className="form-input admin-select" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
              <option value="ALL">All Jobs</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="btn-secondary btn-sm" onClick={() => exportCsv('jobs')}>Export Jobs CSV</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Posted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.slice(0, 50).map((j) => (
                  <tr key={j.jobId}>
                    <td>#{j.jobId} {j.title}</td>
                    <td>{j.location || 'Remote'}</td>
                    <td><Badge type={j.status === 'ACTIVE' ? 'success' : (j.status === 'PAUSED' ? 'warning' : 'info')}>{j.status}</Badge></td>
                    <td>{j.postedBy || '—'}</td>
                    <td>
                      <div className="admin-actions-inline">
                        {j.status !== 'ACTIVE' && <Button size="sm" variant="secondary" onClick={() => handleJobStatusChange(j.jobId, 'ACTIVE')}>Activate</Button>}
                        {j.status === 'ACTIVE' && <Button size="sm" variant="secondary" onClick={() => handleJobStatusChange(j.jobId, 'PAUSED')}>Pause</Button>}
                        {j.status !== 'CLOSED' && <Button size="sm" variant="secondary" onClick={() => setConfirmCloseJob({ jobId: j.jobId, title: j.title })}>Close</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="users-section">
        <Card title="Recruiter Billing Visibility">
          {billingLoading ? <LoadingSpinner /> : (
            <div className="billing-grid">
              <div className="billing-card">
                <h3>Subscriptions ({subscriptions.length})</h3>
                <div className="billing-list">
                  {subscriptions.slice(0, 8).map((sub) => (
                    <div key={sub.subscriptionId || `${sub.recruiterId}-${sub.plan}`} className="billing-row">
                      <span>Recruiter #{sub.recruiterId}</span>
                      <span>{sub.plan || '—'}</span>
                      <span>{sub.status || '—'}</span>
                    </div>
                  ))}
                  {subscriptions.length === 0 && <p className="muted">No subscription data available.</p>}
                </div>
              </div>
              <div className="billing-card">
                <h3>Invoices ({invoices.length})</h3>
                <div className="billing-list">
                  {invoices.slice(0, 8).map((inv) => (
                    <div key={inv.invoiceId || `${inv.subscriptionId}-${inv.paymentDate}`} className="billing-row">
                      <span>Invoice #{inv.invoiceId || '—'}</span>
                      <span>INR {inv.amount || 0}</span>
                      <span>{inv.paymentMode || '—'}</span>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="muted">No invoice data available.</p>}
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="users-section">
        <Card title="Exports">
          <div className="admin-controls-row">
            <button className="btn-secondary btn-sm" onClick={() => exportCsv('users')}>Export Users CSV</button>
            <button className="btn-secondary btn-sm" onClick={() => exportCsv('jobs')}>Export Jobs CSV</button>
            <button className="btn-secondary btn-sm" disabled title="Coming soon">Export Billing Report (Coming Soon)</button>
          </div>
        </Card>
        </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmUserAction)}
        onClose={() => (actionBusy ? null : setConfirmUserAction(null))}
        title={confirmUserAction?.currentStatus ? 'Suspend User' : 'Activate User'}
        message={confirmUserAction?.currentStatus
          ? `Suspend ${confirmUserAction?.email || `user #${confirmUserAction?.userId}`}. They will lose access until reactivated.`
          : `Activate ${confirmUserAction?.email || `user #${confirmUserAction?.userId}`}. They will regain platform access.`}
        confirmLabel={actionBusy
          ? (confirmUserAction?.currentStatus ? 'Suspending...' : 'Activating...')
          : (confirmUserAction?.currentStatus ? 'Suspend User' : 'Activate User')}
        onConfirm={confirmToggleUserStatus}
        busy={actionBusy}
        danger={Boolean(confirmUserAction?.currentStatus)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmCloseJob)}
        onClose={() => (actionBusy ? null : setConfirmCloseJob(null))}
        title="Close Job Listing"
        message={`Close ${confirmCloseJob?.title || `job #${confirmCloseJob?.jobId}`}? Candidates will no longer see this listing in active search.`}
        confirmLabel={actionBusy ? 'Closing...' : 'Close Job'}
        onConfirm={confirmJobClose}
        busy={actionBusy}
        danger
      />

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
