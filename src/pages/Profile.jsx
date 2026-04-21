import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { LoadingSpinner } from '../components/UI';
import { getCandidateByUserId, updateCandidateProfile, getRecruiterByUserId, updateRecruiterProfile } from '../api/profileApi';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const isRecruiter = user?.role === 'RECRUITER';

  useEffect(() => {
    if (user?.userId) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = isRecruiter
        ? await getRecruiterByUserId(user.userId)
        : await getCandidateByUserId(user.userId);
      setProfile(res.data);
      setProfileId(res.data.profileId);
      setForm(res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = { ...form, skills: typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()) : form.skills };
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

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

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
          </div>

          {/* Profile Form */}
          <div className="profile-main">
            {!profile && !editing ? (
              <div className="empty-profile">
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
                        value={form.fullName || ''} onChange={e => setForm({...form, fullName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile</label>
                      <input type="tel" className="form-input"
                        value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
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
                        onChange={e => setForm({...form, skills: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (years)</label>
                      <input type="number" className="form-input"
                        value={form.experience || ''} onChange={e => setForm({...form, experience: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resume URL</label>
                      <input type="url" className="form-input"
                        value={form.resumeUrl || ''} onChange={e => setForm({...form, resumeUrl: e.target.value})}
                        placeholder="https://..." />
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
                          value={form.companyName || ''} onChange={e => setForm({...form, companyName: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <input type="text" className="form-input"
                          value={form.industry || ''} onChange={e => setForm({...form, industry: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Size</label>
                        <select className="form-input" value={form.companySize || ''}
                          onChange={e => setForm({...form, companySize: e.target.value})}>
                          <option value="">Select</option>
                          <option>1-10</option><option>11-50</option><option>51-200</option>
                          <option>201-1000</option><option>1000+</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input type="url" className="form-input"
                          value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} />
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
                      <div className="profile-field"><span>Experience</span><strong>{profile?.experience ? `${profile.experience} years` : '—'}</strong></div>
                      {profile?.resumeUrl && (
                        <div className="profile-field">
                          <span>Resume</span>
                          <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="auth-link">View Resume</a>
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
