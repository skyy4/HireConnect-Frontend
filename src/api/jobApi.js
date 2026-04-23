import api from './axiosConfig';

export const getAllJobs = () => api.get('/jobs');
export const getJobById = (jobId, config = {}) => api.get(`/jobs/${jobId}`, config);
export const searchJobs = (params) => api.get('/jobs/search', { params });
export const getJobsByRecruiter = (recruiterId) => api.get(`/jobs/recruiter/${recruiterId}`);
export const createJob = (job) => api.post('/jobs', job);
export const updateJob = (jobId, job) => api.put(`/jobs/${jobId}`, job);
export const updateJobStatus = (jobId, status) => api.patch(`/jobs/${jobId}/status`, { status });
export const deleteJob = (jobId) => api.delete(`/jobs/${jobId}`);
export const countJobsByRecruiter = (recruiterId) => api.get(`/jobs/recruiter/${recruiterId}/count`);

// ── Bookmarks ──
export const addBookmark = (candidateId, jobId, note) => api.post('/jobs/bookmarks', { candidateId, jobId, note });
export const removeBookmark = (candidateId, jobId) => api.delete(`/jobs/bookmarks/${candidateId}/${jobId}`);
export const getBookmarksByCandidate = (candidateId) => api.get(`/jobs/bookmarks/candidate/${candidateId}`);
export const checkBookmark = (candidateId, jobId) => api.get('/jobs/bookmarks/check', { params: { candidateId, jobId } });
export const countBookmarks = (jobId) => api.get(`/jobs/${jobId}/bookmarks/count`);

// ── Job Views Tracking ──
// Overloaded getJobById now automatically tracks views, but also we can pull stats explicitly.
export const getJobViews = (jobId) => api.get(`/jobs/${jobId}/views`);
export const getJobViewCount = (jobId) => api.get(`/jobs/${jobId}/views/count`);
export const getTopViewedJobs = () => api.get('/jobs/views/top');
