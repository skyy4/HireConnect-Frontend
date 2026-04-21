import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/authApi';
import { createCandidateProfile, createRecruiterProfile } from '../api/profileApi';

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('CANDIDATE');
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' });
  const [profileData, setProfileData] = useState({
    fullName: '', mobile: '', companyName: '', companySize: '', industry: '', website: '', skills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authData.password !== authData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (authData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register({ email: authData.email, password: authData.password, role });
      const u = signIn(res.data);

      // Create profile
      if (role === 'CANDIDATE') {
        await createCandidateProfile({
          userId: u.userId,
          fullName: profileData.fullName,
          email: authData.email,
          mobile: profileData.mobile,
          skills: profileData.skills.split(',').map(s => s.trim()).filter(Boolean),
        });
        navigate('/jobs');
      } else if (role === 'RECRUITER') {
        await createRecruiterProfile({
          userId: u.userId,
          fullName: profileData.fullName,
          email: authData.email,
          companyName: profileData.companyName,
          companySize: profileData.companySize,
          industry: profileData.industry,
          website: profileData.website,
        });
        navigate('/recruiter/dashboard');
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <h1 className="auth-brand-name">HireConnect</h1>
          <p className="auth-tagline">Bridging Talent with Opportunity</p>
        </div>

        <div className="auth-card">
          <div className="steps-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1<span>Account</span></div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2<span>Profile</span></div>
          </div>

          {error && <div className="error-alert">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <h2 className="auth-title">Create your account</h2>

              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === 'CANDIDATE' ? 'selected' : ''}`}
                  onClick={() => setRole('CANDIDATE')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>I'm a Candidate</span>
                  <small>Looking for jobs</small>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'RECRUITER' ? 'selected' : ''}`}
                  onClick={() => setRole('RECRUITER')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  <span>I'm a Recruiter</span>
                  <small>Hiring talent</small>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'ADMIN' ? 'selected' : ''}`}
                  onClick={() => setRole('ADMIN')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M12 8v8"/>
                    <path d="M8 12h8"/>
                  </svg>
                  <span>Admin Panel</span>
                  <small>Mange Platform</small>
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters"
                  value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat password"
                  value={authData.confirmPassword} onChange={e => setAuthData({...authData, confirmPassword: e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary btn-full">Continue</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="auth-form">
              <h2 className="auth-title">
                {role === 'CANDIDATE' ? 'Your Profile' : 
                 role === 'RECRUITER' ? 'Company Details' : 'Admin Details'}
              </h2>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe"
                  value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input type="tel" className="form-input" placeholder="+91 9876543210"
                  value={profileData.mobile} onChange={e => setProfileData({...profileData, mobile: e.target.value})} />
              </div>

              {role === 'CANDIDATE' && (
                <div className="form-group">
                  <label className="form-label">Skills (comma-separated)</label>
                  <input type="text" className="form-input" placeholder="React, Java, SQL"
                    value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} />
                </div>
              )}

              {role === 'RECRUITER' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-input" placeholder="Acme Corp"
                      value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Industry</label>
                      <input type="text" className="form-input" placeholder="Technology"
                        value={profileData.industry} onChange={e => setProfileData({...profileData, industry: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Size</label>
                      <select className="form-input" value={profileData.companySize}
                        onChange={e => setProfileData({...profileData, companySize: e.target.value})}>
                        <option value="">Select</option>
                        <option>1-10</option>
                        <option>11-50</option>
                        <option>51-200</option>
                        <option>201-1000</option>
                        <option>1000+</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input type="url" className="form-input" placeholder="https://yourcompany.com"
                      value={profileData.website} onChange={e => setProfileData({...profileData, website: e.target.value})} />
                  </div>
                </>
              )}

              <div className="btn-row">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-hero">
        <div className="auth-hero-content">
          <h2>Join thousands of professionals already on HireConnect</h2>
          <ul className="auth-features">
            <li>✓ Post or apply to jobs in minutes</li>
            <li>✓ Real-time application tracking</li>
            <li>✓ Interview scheduling made easy</li>
            <li>✓ Analytics for smarter hiring</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
