import api from './axiosConfig';

export const getRecruiterAnalytics = (recruiterId) => api.get(`/analytics/recruiter/${recruiterId}`);
export const getPlatformStats = () => api.get('/analytics/admin');
export const getJobAnalytics = (jobId) => api.get(`/analytics/job/${jobId}`);
