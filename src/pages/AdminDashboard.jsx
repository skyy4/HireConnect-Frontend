import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Card, Button, Badge } from '../components/UI';
import api from '../api/axiosConfig';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, candidates: 0, recruiters: 0, activeJobs: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, jobsRes] = await Promise.all([
          api.get('/auth/users'), 
          api.get('/jobs')
        ]);

        const allUsers = usersRes.data;
        setUsers(allUsers);
        setStats({
          totalUsers: allUsers.length,
          candidates: allUsers.filter(u => u.role === 'CANDIDATE').length,
          recruiters: allUsers.filter(u => u.role === 'RECRUITER').length,
          activeJobs: jobsRes.data.length
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
      // Logic to deactivate/activate user
      alert('Toggling status for user ' + userId);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="admin-dashboard-container fade-in">
      <header className="dashboard-header">
        <h1>Platform Administration</h1>
        <p>Manage users, monitor growth, and ensure platform integrity.</p>
      </header>

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
      </div>

      <section className="users-section">
        <Card title="User Management">
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
                {users.map(u => (
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
                        onClick={() => handleToggleUserStatus(u.userId, u.active)}
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
    </div>
  );
}
