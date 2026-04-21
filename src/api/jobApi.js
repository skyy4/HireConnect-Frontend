import api from './axiosConfig';

export const getAllJobs = () => api.get('/jobs');
export const getJobById = (jobId) => api.get(`/jobs/${jobId}`);
export const searchJobs = (params) => api.get('/jobs/search', { params });
export const getJobsByRecruiter = (recruiterId) => api.get(`/jobs/recruiter/${recruiterId}`);
export const createJob = (job) => api.post('/jobs', job);
export const updateJob = (jobId, job) => api.put(`/jobs/${jobId}`, job);
export const updateJobStatus = (jobId, status) => api.patch(`/jobs/${jobId}/status`, { status });
export const deleteJob = (jobId) => api.delete(`/jobs/${jobId}`);
export const countJobsByRecruiter = (recruiterId) => api.get(`/jobs/recruiter/${recruiterId}/count`);
