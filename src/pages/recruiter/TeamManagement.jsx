import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { LoadingSpinner, StatusBadge, EmptyState, Toast, Modal } from '../../components/UI';
import { inviteTeamMember, getTeamMembers, updateTeamMemberRole, revokeTeamMember } from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['VIEWER', 'MANAGER', 'ADMIN'];
const STATUS_MAP = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REVOKED: 'danger',
};

export default function TeamManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', teamRole: 'VIEWER' });
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const res = await getTeamMembers(user.userId);
      setMembers(res.data || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;
    setSubmitting(true);
    try {
      await inviteTeamMember(user.userId, inviteForm);
      setToast(`Invitation sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ email: '', fullName: '', teamRole: 'VIEWER' });
      loadTeam();
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      await updateTeamMemberRole(user.userId, memberUserId, newRole);
      setMembers(prev => prev.map(m =>
        m.memberUserId === memberUserId ? { ...m, teamRole: newRole } : m
      ));
      setToast('Role updated.');
    } catch {
      setToast('Failed to update role.');
    }
  };

  const handleRevoke = async (teamMemberId, email) => {
    if (!window.confirm(`Revoke access for ${email}?`)) return;
    try {
      await revokeTeamMember(user.userId, teamMemberId);
      setMembers(prev => prev.map(m =>
        m.teamMemberId === teamMemberId ? { ...m, status: 'REVOKED' } : m
      ));
      setToast('Team member access revoked.');
    } catch {
      setToast('Failed to revoke access.');
    }
  };

  const activeMembers = members.filter(m => m.status !== 'REVOKED');
  const revokedMembers = members.filter(m => m.status === 'REVOKED');

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Team Management</h1>
            <p>Invite colleagues to co-manage your job postings</p>
          </div>
          <button className="btn-primary" onClick={() => setShowInvite(true)}>
            + Invite Member
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{members.length}</span>
            <span className="stat-label">Total Members</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{members.filter(m => m.status === 'ACCEPTED').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{members.filter(m => m.status === 'PENDING').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{revokedMembers.length}</span>
            <span className="stat-label">Revoked</span>
          </div>
        </div>

        {/* Active Team */}
        {activeMembers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No team members"
            message="Invite your first team member to start collaborating."
            action={<button className="btn-primary" onClick={() => setShowInvite(true)}>Invite Member</button>}
          />
        ) : (
          <div className="jobs-table" style={{marginTop: '2rem'}}>
            <div className="table-header">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Invited</span>
              <span>Actions</span>
            </div>
            {activeMembers.map(m => (
              <div className="table-row" key={m.teamMemberId}>
                <strong>{m.fullName || '—'}</strong>
                <span>{m.email}</span>
                <span>
                  <select
                    className="form-input"
                    style={{width:'auto', padding:'0.25rem 0.5rem', fontSize:'0.85rem'}}
                    value={m.teamRole}
                    onChange={(e) => handleRoleChange(m.memberUserId, e.target.value)}
                    disabled={m.status === 'REVOKED'}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </span>
                <StatusBadge status={m.status} />
                <span style={{fontSize:'0.85rem'}}>{new Date(m.invitedAt).toLocaleDateString()}</span>
                <span>
                  {m.status !== 'REVOKED' && (
                    <button className="btn-danger btn-sm" onClick={() => handleRevoke(m.teamMemberId, m.email)}>
                      Revoke
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Revoked members */}
        {revokedMembers.length > 0 && (
          <details style={{marginTop:'2rem'}}>
            <summary className="muted" style={{cursor:'pointer', fontWeight:500}}>
              Revoked Members ({revokedMembers.length})
            </summary>
            <div className="jobs-table" style={{marginTop:'0.5rem'}}>
              {revokedMembers.map(m => (
                <div className="table-row" key={m.teamMemberId} style={{opacity:0.6}}>
                  <strong>{m.fullName || '—'}</strong>
                  <span>{m.email}</span>
                  <span>{m.teamRole}</span>
                  <StatusBadge status="REVOKED" />
                  <span style={{fontSize:'0.85rem'}}>{new Date(m.invitedAt).toLocaleDateString()}</span>
                  <span />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <form onSubmit={handleInvite}>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="colleague@company.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={inviteForm.teamRole}
              onChange={(e) => setInviteForm({...inviteForm, teamRole: e.target.value})}
            >
              <option value="VIEWER">Viewer — Can view applications</option>
              <option value="MANAGER">Manager — Can manage applications</option>
              <option value="ADMIN">Admin — Full access to team settings</option>
            </select>
          </div>
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
