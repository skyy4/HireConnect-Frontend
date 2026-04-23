import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getJobById, createJob, updateJob } from '../../api/jobApi';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Other'];
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'];

export default function JobForm() {
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '', category: '', type: 'FULL_TIME', location: '',
    salaryMin: '', salaryMax: '', experienceRequired: '',
    description: '', skills: '', status: 'ACTIVE',
  });

  useEffect(() => {
    if (isEdit) {
      getJobById(jobId).then(r => {
        const j = r.data;
        setForm({
          title: j.title || '',
          category: j.category || '',
          type: j.type || 'FULL_TIME',
          location: j.location || '',
          salaryMin: j.salaryMin || '',
          salaryMax: j.salaryMax || '',
          experienceRequired: j.experienceRequired || '',
          description: j.description || '',
          skills: j.skills?.join(', ') || '',
          status: j.status || 'ACTIVE',
        });
      }).catch(() => navigate('/recruiter/jobs'))
        .finally(() => setLoading(false));
    }
  }, [isEdit, jobId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        experienceRequired: form.experienceRequired ? parseInt(form.experienceRequired) : null,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        postedBy: user.userId,
      };
      if (isEdit) {
        await updateJob(jobId, payload);
        setToast('Job updated successfully!');
      } else {
        await createJob(payload);
        setToast('Job posted successfully!');
      }
      setTimeout(() => navigate('/recruiter/jobs'), 1200);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-wrapper"><Navbar /><div style={{padding:'4rem',textAlign:'center'}}>Loading...</div></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <button className="back-btn" onClick={() => navigate('/recruiter/jobs')}>← Back to Jobs</button>
        <div className="form-page">
          <h1>{isEdit ? 'Edit Job Posting' : 'Post a New Job'}</h1>
          <p className="muted">{isEdit ? 'Update your job listing details.' : 'Fill in the details to attract the right candidates.'}</p>

          <form onSubmit={handleSubmit} className="job-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Senior React Engineer"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Type *</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" placeholder="e.g. Bangalore, India"
                    value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Required (years)</label>
                  <input type="number" className="form-input" placeholder="e.g. 3"
                    value={form.experienceRequired} onChange={e => setForm({...form, experienceRequired: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Compensation</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Salary (₹/year)</label>
                  <input type="number" className="form-input" placeholder="e.g. 800000"
                    value={form.salaryMin} onChange={e => setForm({...form, salaryMin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Salary (₹/year)</label>
                  <input type="number" className="form-input" placeholder="e.g. 1500000"
                    value={form.salaryMax} onChange={e => setForm({...form, salaryMax: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Job Details</h3>
              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea className="form-input" rows="8"
                  placeholder="Describe the role, responsibilities, and what makes it exciting..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills (comma-separated)</label>
                <input type="text" className="form-input" placeholder="React, TypeScript, Node.js"
                  value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
              </div>
            </div>

            {isEdit && (
              <div className="form-section">
                <h3>Status</h3>
                <div className="form-group">
                  <label className="form-label">Job Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            )}

            <div className="btn-row">
              <button type="button" className="btn-secondary" onClick={() => navigate('/recruiter/jobs')}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <div className={`toast ${toast.includes('success') ? 'toast-success' : ''}`} onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
