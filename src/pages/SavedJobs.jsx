/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { EmptyState, LoadingSpinner, StatusBadge, Toast, Alert } from '../components/UI';
import { getBookmarksByCandidate, getJobById, removeBookmark } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';

export default function SavedJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const loadSavedJobs = useCallback(async () => {
    if (user?.role !== 'CANDIDATE' || !user?.userId) {
      setSavedJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setError('');
      const bookmarksRes = await getBookmarksByCandidate(user.userId);
      const bookmarks = bookmarksRes.data || [];

      const hydrated = await Promise.all(bookmarks.map(async (bookmark) => {
        if (bookmark.job) return { bookmarkId: bookmark.bookmarkId, ...bookmark.job };

        try {
          const jobRes = await getJobById(bookmark.jobId);
          return { bookmarkId: bookmark.bookmarkId, ...jobRes.data };
        } catch {
          return { bookmarkId: bookmark.bookmarkId, jobId: bookmark.jobId, title: `Job #${bookmark.jobId}` };
        }
      }));

      setSavedJobs(hydrated);
    } catch {
      setSavedJobs([]);
      setError('Unable to load saved jobs right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.userId]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleRemove = async (jobId) => {
    try {
      await removeBookmark(user.userId, jobId);
      setSavedJobs((prev) => prev.filter((job) => job.jobId !== jobId));
      setToast('Removed from saved jobs.');
    } catch {
      setToast('Could not remove this saved job.');
    }
  };

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedJobs;

    return savedJobs.filter((job) => {
      const title = (job.title || '').toLowerCase();
      const location = (job.location || '').toLowerCase();
      const category = (job.category || '').toLowerCase();
      return title.includes(q) || location.includes(q) || category.includes(q) || String(job.jobId || '').includes(q);
    });
  }, [savedJobs, query]);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Saved Jobs</h1>
            <p>Manage your bookmarks and revisit opportunities quickly.</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
        </div>

        <Alert type="error" message={error} />

        <div className="saved-jobs-search-wrap">
          <input
            className="form-input"
            placeholder="Search saved jobs by title, location, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? <LoadingSpinner /> : filteredJobs.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="No saved jobs"
            message={savedJobs.length === 0 ? 'Bookmark jobs to access them here.' : 'No saved jobs match your search.'}
            action={<button className="btn-primary" onClick={() => navigate('/jobs')}>Find Jobs</button>}
          />
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <div className="job-card" key={`${job.bookmarkId || 'saved'}-${job.jobId}`}>
                <div className="job-card-header">
                  <div>
                    <h3 className="job-title">{job.title || `Job #${job.jobId}`}</h3>
                    <p className="job-company">{job.location || 'Location not provided'}</p>
                  </div>
                  {job.status && <StatusBadge status={job.status} />}
                </div>

                <p className="job-description">
                  {job.description ? `${job.description.slice(0, 120)}...` : 'Open to view full role details.'}
                </p>

                <div className="job-tags">
                  {job.category && <span className="tag">{job.category}</span>}
                  {job.type && <span className="tag">{job.type.replace('_', ' ')}</span>}
                  {job.experienceRequired && <span className="tag">{job.experienceRequired} yrs</span>}
                </div>

                <div className="job-card-footer">
                  <span className="job-salary">{job.salaryMin || job.salaryMax ? 'Salary available' : 'Salary not disclosed'}</span>
                  <div className="job-actions">
                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/jobs/${job.jobId}`)}>
                      View Details
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => handleRemove(job.jobId)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}

