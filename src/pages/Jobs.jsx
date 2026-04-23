/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatusBadge, LoadingSpinner, EmptyState, Toast, Alert } from '../components/UI';
import { getAllJobs, searchJobs, addBookmark, removeBookmark, getBookmarksByCandidate } from '../api/jobApi';
import { hasApplied, submitApplication } from '../api/applicationApi';
import { useAuth } from '../context/AuthContext';

const JOB_CATEGORIES = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'];
const EXP_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ title: '', location: '', category: '', type: '', experienceLevel: '', minSalary: '', maxSalary: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [applying, setApplying] = useState(null);
  const [bookmarking, setBookmarking] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savedOnly, setSavedOnly] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyJobId, setApplyJobId] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllJobs();
      setJobs(res.data);
    } catch {
      setJobs([]);
      setError('Unable to load jobs right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedJobs = useCallback(async () => {
    if (user?.role !== 'CANDIDATE' || !user?.userId) {
      setSavedJobIds(new Set());
      setSavedOnly(false);
      return;
    }

    try {
      const res = await getBookmarksByCandidate(user.userId);
      const ids = (res.data || []).map((entry) => entry.jobId);
      setSavedJobIds(new Set(ids));
    } catch {
      setSavedJobIds(new Set());
    }
  }, [user?.role, user?.userId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = Object.keys(params).length ? await searchJobs(params) : await getAllJobs();
      setJobs(res.data);
    } catch {
      setJobs([]);
      setError('Search failed. Please adjust filters and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!user) { navigate('/login'); return; }
    setApplying(jobId);
    try {
      const check = await hasApplied(jobId, user.userId);
      if (check.data.applied) {
        setToast('You have already applied to this job.');
        setApplying(null);
        return;
      }
      setApplyJobId(jobId);
    } catch {
      setApplying(null);
      setToast('Unable to validate application status right now.');
    }
  };

  const confirmApply = async () => {
    try {
      await submitApplication({ jobId: applyJobId, candidateId: user.userId, coverLetter, resumeUrl: '' });
      setToast('Application submitted successfully!');
      setApplyJobId(null);
      setCoverLetter('');
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplying(null);
    }
  };

  const toggleBookmark = async (jobId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookmarking(jobId);
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await removeBookmark(user.userId, jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setToast('Removed from saved jobs.');
      } else {
        await addBookmark(user.userId, jobId, '');
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.add(jobId);
          return next;
        });
        setToast('Saved job for later.');
      }
    } catch {
      setToast('Unable to update saved jobs right now.');
    } finally {
      setBookmarking(null);
    }
  };

  const visibleJobs = savedOnly ? jobs.filter((job) => savedJobIds.has(job.jobId)) : jobs;

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `₹${(min/100000).toFixed(1)}L – ₹${(max/100000).toFixed(1)}L`;
    return min ? `From ₹${(min/100000).toFixed(1)}L` : `Up to ₹${(max/100000).toFixed(1)}L`;
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        {/* Search Header */}
        <div className="search-hero">
          <h1>Find Your Dream Job</h1>
          <p>Search from thousands of opportunities across industries</p>
          <form onSubmit={handleSearch} className="search-bar">
            <div className="search-input-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                placeholder="Job title, keyword..."
                value={filters.title}
                onChange={e => setFilters({...filters, title: e.target.value})}
              />
            </div>
            <div className="search-input-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                className="search-input"
                placeholder="Location"
                value={filters.location}
                onChange={e => setFilters({...filters, location: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
              Filters {showFilters ? '▲' : '▼'}
            </button>
          </form>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                    <option value="">All Categories</option>
                    {JOB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select className="form-input" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                    <option value="">All Types</option>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <select className="form-input" value={filters.experienceLevel} onChange={e => setFilters({...filters, experienceLevel: e.target.value})}>
                    <option value="">All Levels</option>
                    {EXP_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Min Salary (₹)</label>
                  <input type="number" className="form-input" placeholder="e.g. 500000"
                    value={filters.minSalary} onChange={e => setFilters({...filters, minSalary: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Salary (₹)</label>
                  <input type="number" className="form-input" placeholder="e.g. 2000000"
                    value={filters.maxSalary} onChange={e => setFilters({...filters, maxSalary: e.target.value})} />
                </div>
              </div>
              <button className="text-btn" onClick={() => { setFilters({ title: '', location: '', category: '', type: '', experienceLevel: '', minSalary: '', maxSalary: '' }); setSavedOnly(false); }}>
                Clear Filters
              </button>
            </div>
          )}

          {user?.role === 'CANDIDATE' && (
            <div className="filter-panel jobs-saved-toggle-panel">
              <label className="jobs-saved-toggle-label">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(e) => setSavedOnly(e.target.checked)}
                />
                Show saved jobs only ({savedJobIds.size})
              </label>
            </div>
          )}
        </div>

        <Alert type="error" message={error} />

        {/* Job Listings */}
        <div className="jobs-layout">
          <div className="jobs-count">
            {!loading && <p><strong>{visibleJobs.length}</strong> jobs found</p>}
          </div>

          {loading ? <LoadingSpinner /> : visibleJobs.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No jobs found"
              message="Try adjusting your search criteria or browse all jobs."
              action={<button className="btn-primary" onClick={() => { setFilters({ title: '', location: '', category: '', type: '', experienceLevel: '', minSalary: '', maxSalary: '' }); fetchJobs(); }}>Browse All Jobs</button>}
            />
          ) : (
            <div className="jobs-grid">
              {visibleJobs.map(job => (
                <div className="job-card" key={job.jobId}>
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{job.location || 'Remote'}</p>
                    </div>
                    <div className="job-card-status-wrap">
                      {user?.role === 'CANDIDATE' && (
                        <button
                          className="icon-btn"
                          onClick={() => toggleBookmark(job.jobId)}
                          title={savedJobIds.has(job.jobId) ? 'Unsave job' : 'Save job'}
                          disabled={bookmarking === job.jobId}
                        >
                          {savedJobIds.has(job.jobId) ? '★' : '☆'}
                        </button>
                      )}
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                  <p className="job-description">{job.description?.substring(0, 120)}...</p>
                  <div className="job-tags">
                    {job.category && <span className="tag">{job.category}</span>}
                    {job.type && <span className="tag">{job.type?.replace('_', ' ')}</span>}
                    {job.experienceRequired && <span className="tag">{job.experienceRequired} yrs</span>}
                  </div>
                  <div className="job-card-footer">
                    <span className="job-salary">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    <div className="job-actions">
                      <button className="btn-secondary btn-sm" onClick={() => navigate(`/jobs/${job.jobId}`)}>
                        View Details
                      </button>
                      {user?.role !== 'RECRUITER' && job.status === 'ACTIVE' && (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleApply(job.jobId)}
                          disabled={applying === job.jobId}
                        >
                          {applying === job.jobId ? '...' : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyJobId && (
        <div className="modal-overlay" onClick={() => { setApplyJobId(null); setApplying(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Job</h3>
              <button className="icon-btn" onClick={() => { setApplyJobId(null); setApplying(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cover Letter (optional)</label>
                <textarea
                  className="form-input"
                  rows="5"
                  placeholder="Tell the recruiter why you're a great fit..."
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="btn-row">
                <button className="btn-secondary" onClick={() => { setApplyJobId(null); setApplying(null); }}>Cancel</button>
                <button className="btn-primary" onClick={confirmApply}>Submit Application</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast} type="info" onClose={() => setToast('')} />
      )}
    </div>
  );
}
