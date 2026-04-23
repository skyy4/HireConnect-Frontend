/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { Modal, Toast, Alert } from '../components/UI';
import {
  getCandidateByUserId, updateCandidateProfile,
  getRecruiterByUserId, updateRecruiterProfile,
  parseResume, getParsedResume,
  getTeamMembers, inviteTeamMember, revokeTeamMember,
  uploadCandidateResume,
} from '../api/profileApi';
import { getWalletBalance, createWallet, creditWallet } from '../api/subscriptionApi';
import { useAuth } from '../context/AuthContext';

/** Convert a relative upload path → full gateway URL so browsers can open it. */
const getResumeFullUrl = (resumeUrl) => {
  if (!resumeUrl) return null;
  if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) return resumeUrl;
  // resumeUrl is like /uploads/resumes/uuid-filename.pdf
  // Route through API gateway (port 8080) which proxies /uploads/** → profile-service
  const gatewayBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1\/?$/, '');
  return `${gatewayBase}${resumeUrl}`;
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [walletBal, setWalletBal] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(100);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Team
  const [team, setTeam] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokingMember, setRevokingMember] = useState(false);

  const isRecruiter = user?.role === 'RECRUITER';

  const loadProfile = useCallback(async () => {
    if (!user?.userId) return;

    let loadedProfile = null;
    try {
      setLoadError('');
      const res = isRecruiter
        ? await getRecruiterByUserId(user.userId)
        : await getCandidateByUserId(user.userId);
      loadedProfile = res.data;
      setProfile(loadedProfile);
      setProfileId(loadedProfile.profileId);
      setForm(loadedProfile);
    } catch {
      setProfile(null);
      setLoadError('Unable to load profile details right now.');
    }

    // Wallet
    try {
      const wRes = await getWalletBalance(user.userId);
      setWalletBal(wRes.data.balance ?? 0);
    } catch {
      try {
        await createWallet(user.userId, user.role);
        setWalletBal(0);
      } catch {
        setWalletBal(0);
      }
    }

    // Parsed resume — only when we have a valid profileId
    if (!isRecruiter && loadedProfile?.profileId) {
      try {
        const pr = await getParsedResume(loadedProfile.profileId);
        setParsedData(pr.data);
      } catch { /* Not parsed yet — silently ignore */ }
    }

    // Team members (recruiter only)
    if (isRecruiter && loadedProfile?.profileId) {
      try {
        const tRes = await getTeamMembers(loadedProfile.profileId);
        setTeam(Array.isArray(tRes.data) ? tRes.data : []);
      } catch { setTeam([]); }
    }
  }, [isRecruiter, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const skills = typeof form.skills === 'string'
        ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
        : (form.skills || []);
      const toSave = { ...form, skills };
      const res = isRecruiter
        ? await updateRecruiterProfile(profileId, toSave)
        : await updateCandidateProfile(profileId, toSave);
      setProfile(res.data);
      setForm(res.data);
      setEditing(false);
      setToast('Profile updated successfully!');
    } catch {
      setToast('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    try {
      await creditWallet(user.userId, topupAmount, 'CARD', `TXN-${Date.now()}`, 'Manual Wallet Topup');
      setToast(`₹${topupAmount} added to wallet!`);
      setShowWalletModal(false);
      loadProfile();
    } catch { setToast('Failed to recharge wallet.'); }
  };

  const handleParseResume = async () => {
    if (!profile?.resumeUrl) { setToast('Please upload or add a Resume URL first!'); return; }
    setParsing(true);
    try {
      await parseResume(profileId, profile.resumeUrl);
      setToast('Resume parsed successfully! Skills and info extracted.');
      // Reload parsed data
      try {
        const pr = await getParsedResume(profileId);
        setParsedData(pr.data);
      } catch { /* ignore */ }
      loadProfile();
    } catch {
      setToast('Failed to parse resume. Check URL validity.');
    } finally { setParsing(false); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) { setToast('Please select a PDF file first.'); return; }
    if (resumeFile.type !== 'application/pdf') { setToast('Only PDF resumes are supported.'); return; }

    setUploadingResume(true);
    try {
      const res = await uploadCandidateResume(profileId, resumeFile);
      // Backend returns a ParsedResume object; resumeUrl on the profile is updated server-side
      const uploadedParsed = res.data;
      if (uploadedParsed?.resumeUrl) {
        setProfile(prev => ({ ...(prev || {}), resumeUrl: uploadedParsed.resumeUrl }));
        setForm(prev => ({ ...prev, resumeUrl: uploadedParsed.resumeUrl }));
        setParsedData(uploadedParsed);
      }
      setToast('Resume uploaded and parsed successfully!');
      setResumeFile(null);
      await loadProfile();
    } catch {
      setToast('Upload failed. Try adding a Resume URL manually.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleInviteTeam = async (e) => {
    e.preventDefault();
    try {
      await inviteTeamMember(profileId, { email: inviteEmail, teamRole: inviteRole });
      setToast('Invitation sent successfully!');
      setInviteEmail('');
      loadProfile();
    } catch (err) {
      setToast(err?.response?.data?.message || 'Failed to invite team member.');
    }
  };

  const handleRevokeTeam = async (memberId) => {
    try {
      await revokeTeamMember(profileId, memberId);
      setToast('Member removed.');
      loadProfile();
    } catch { setToast('Failed to remove member.'); }
  };

  const confirmRevokeTeam = async () => {
    if (!revokeTarget) return;
    setRevokingMember(true);
    await handleRevokeTeam(revokeTarget.memberId);
    setRevokingMember(false);
    setRevokeTarget(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const resumeFullUrl = getResumeFullUrl(profile?.resumeUrl);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>{isRecruiter ? 'Company Profile' : 'My Profile'}</h1>
            <p>Manage your {isRecruiter ? 'company' : 'candidate'} profile information</p>
          </div>
          {!editing && (
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        <Alert type="error" message={loadError} />

        <div className="profile-layout">
          {/* Avatar / Summary */}
          <div className="profile-sidebar">
            <div className="profile-avatar">
              {(profile?.fullName || user?.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="profile-name">{profile?.fullName || 'No name set'}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className={`role-badge ${isRecruiter ? 'recruiter' : 'candidate'}`}>
              {isRecruiter ? 'Recruiter' : 'Candidate'}
            </span>
            {isRecruiter && profile?.companyName && (
              <p className="profile-company">{profile.companyName}</p>
            )}

            <div className="profile-wallet-card">
              <h3 className="profile-wallet-title">Wallet Balance</h3>
              <div className="profile-wallet-value">₹{walletBal.toLocaleString()}</div>
              <button className="btn-primary btn-full" onClick={() => setShowWalletModal(true)}>Add Funds</button>
            </div>
          </div>

          {/* Profile Form / View */}
          <div className="profile-main">
            {!profile && !editing ? (
              <div className="empty-profile">
                <Alert type="info" message="Your profile is not set up yet." />
                <p>Your profile is not set up yet.</p>
                <button className="btn-primary" onClick={() => setEditing(true)}>Set Up Profile</button>
              </div>
            ) : editing ? (
              <div className="profile-form">
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-input"
                        value={form.fullName || ''} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile</label>
                      <input type="tel" className="form-input"
                        value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                    </div>
                  </div>
                </div>

                {!isRecruiter && (
                  <div className="form-section">
                    <h3>Professional Info</h3>
                    <div className="form-group">
                      <label className="form-label">Skills (comma-separated)</label>
                      <input type="text" className="form-input"
                        value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
                        onChange={e => setForm({ ...form, skills: e.target.value })} />
                    </div>
                    <div className="form-group">
                      {/* Backend field is experienceYears — align here */}
                      <label className="form-label">Experience (years)</label>
                      <input type="number" className="form-input" min="0"
                        value={form.experienceYears ?? ''} onChange={e => setForm({ ...form, experienceYears: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resume URL (optional — or upload below)</label>
                      <input type="url" className="form-input"
                        value={form.resumeUrl || ''} onChange={e => setForm({ ...form, resumeUrl: e.target.value })}
                        placeholder="https://drive.google.com/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Upload Resume (PDF)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-input"
                        onChange={e => setResumeFile(e.target.files?.[0] || null)}
                      />
                      <div className="btn-row profile-tight-row">
                        <button type="button" className="btn-secondary" onClick={handleResumeUpload} disabled={uploadingResume || !resumeFile}>
                          {uploadingResume ? 'Uploading...' : 'Upload PDF'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isRecruiter && (
                  <div className="form-section">
                    <h3>Company Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Name</label>
                        <input type="text" className="form-input"
                          value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <input type="text" className="form-input"
                          value={form.industry || ''} onChange={e => setForm({ ...form, industry: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Size</label>
                        <select className="form-input" value={form.companySize || ''}
                          onChange={e => setForm({ ...form, companySize: e.target.value })}>
                          <option value="">Select</option>
                          <option>1-10</option><option>11-50</option><option>51-200</option>
                          <option>201-1000</option><option>1000+</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input type="url" className="form-input"
                          value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="btn-row">
                  <button className="btn-secondary" onClick={() => { setEditing(false); setForm(profile || {}); }}>Cancel</button>
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-view">
                {!isRecruiter && (
                  <>
                    <div className="profile-section">
                      <h3>Contact</h3>
                      <div className="profile-field"><span>Email</span><strong>{profile?.email || user?.email}</strong></div>
                      <div className="profile-field"><span>Mobile</span><strong>{profile?.mobile || '—'}</strong></div>
                    </div>
                    <div className="profile-section">
                      <h3>Professional</h3>
                      {/* Use experienceYears — the actual backend field name */}
                      <div className="profile-field">
                        <span>Experience</span>
                        <strong>
                          {(profile?.experienceYears != null && profile.experienceYears !== 0)
                            ? `${profile.experienceYears} years`
                            : '—'}
                        </strong>
                      </div>
                      <div className="profile-field">
                        <span>Resume</span>
                        <div className="profile-resume-actions">
                          {resumeFullUrl
                            ? (
                              <a
                                href={resumeFullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="auth-link"
                                title={`Open: ${resumeFullUrl}`}
                              >
                                View Original
                              </a>
                            )
                            : <span className="muted">No resume uploaded yet</span>
                          }
                          <button
                            className="btn-secondary btn-sm"
                            onClick={handleParseResume}
                            disabled={parsing || !profile?.resumeUrl}
                          >
                            {parsing ? 'Parsing...' : 'Auto-Parse Info'}
                          </button>
                        </div>
                      </div>
                      {parsedData && (
                        <div className="profile-field profile-ai-card">
                          <span className="profile-ai-title">AI Extracted Info:</span>
                          <p className="profile-ai-summary">{parsedData.summary}</p>
                          {parsedData.inferredExperienceYears != null && (
                            <p className="profile-ai-meta">
                              Inferred Experience: {parsedData.inferredExperienceYears} yrs
                            </p>
                          )}
                          {parsedData.extractedSkills?.length > 0 && (
                            <div className="skills-list profile-ai-skills">
                              {parsedData.extractedSkills.map(s => <span className="skill-tag" key={s}>{s}</span>)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="profile-field">
                        <span>Skills</span>
                        <div className="skills-list">
                          {profile?.skills?.length > 0
                            ? profile.skills.map(s => <span className="skill-tag" key={s}>{s}</span>)
                            : <span className="muted">No skills added</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isRecruiter && (
                  <>
                    <div className="profile-section">
                      <h3>Company Information</h3>
                      <div className="profile-field"><span>Company</span><strong>{profile?.companyName || '—'}</strong></div>
                      <div className="profile-field"><span>Industry</span><strong>{profile?.industry || '—'}</strong></div>
                      <div className="profile-field"><span>Size</span><strong>{profile?.companySize || '—'}</strong></div>
                      <div className="profile-field"><span>Website</span>
                        {profile?.website
                          ? <a href={profile.website} target="_blank" rel="noreferrer" className="auth-link">{profile.website}</a>
                          : <strong>—</strong>}
                      </div>
                    </div>

                    <div className="profile-section profile-team-section">
                      <h3>Team Members</h3>
                      <div className="list-card profile-team-card">
                        {team.length === 0
                          ? <p className="muted">No team members invited yet.</p>
                          : (
                            <div className="profile-team-list">
                              {team.map(m => (
                                <div key={m.teamMemberId} className="profile-team-row">
                                  <div>
                                    <strong>{m.fullName || m.email}</strong>
                                    <div className="profile-team-meta">
                                      {m.email} · Role: {m.teamRole || m.role} · Status: {m.status}
                                    </div>
                                  </div>
                                  {m.status !== 'REVOKED' && (
                                    <button
                                      className="btn-secondary btn-sm profile-remove-btn"
                                      onClick={() => setRevokeTarget({
                                        memberId: m.memberUserId || m.teamMemberId,
                                        name: m.fullName || m.email,
                                      })}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        }
                        <form onSubmit={handleInviteTeam} className="profile-team-invite">
                          <div className="form-group profile-team-email-group">
                            <label className="form-label profile-team-label">Email Address</label>
                            <input type="email" required className="form-input profile-team-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                          </div>
                          <div className="form-group profile-team-role-group">
                            <label className="form-label profile-team-label">Role</label>
                            <select className="form-input profile-team-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                              <option value="VIEWER">Viewer</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <button className="btn-primary profile-team-invite-btn" type="submit">Invite</button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} title="Add Funds to Wallet">
        <form onSubmit={handleTopup}>
          <div className="form-group">
            <label className="form-label">Amount (INR)</label>
            <input type="number" className="form-input" min="100" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Detail</label>
            <input type="text" className="form-input" placeholder="Card Number (Demo: 4242 4242 ...)" />
          </div>
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => setShowWalletModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Pay Securely</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(revokeTarget)}
        onClose={() => (revokingMember ? null : setRevokeTarget(null))}
        title="Remove Team Member"
      >
        <p className="muted profile-modal-copy">
          Remove <strong>{revokeTarget?.name || 'this member'}</strong> from your recruiter team?
        </p>
        <div className="btn-row profile-modal-actions">
          <button className="btn-secondary" onClick={() => setRevokeTarget(null)} disabled={revokingMember}>Cancel</button>
          <button className="btn-danger" onClick={confirmRevokeTeam} disabled={revokingMember}>
            {revokingMember ? 'Removing...' : 'Remove Member'}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
