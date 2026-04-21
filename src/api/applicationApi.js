import api from './axiosConfig';

export const submitApplication = (application) => api.post('/applications', application);
export const getApplicationById = (id) => api.get(`/applications/${id}`);
export const getByCandidate = (candidateId) => api.get(`/applications/candidate/${candidateId}`);
export const getByJob = (jobId, status) => api.get(`/applications/job/${jobId}`, { params: status ? { status } : {} });
export const updateStatus = (applicationId, status, note) => api.patch(`/applications/${applicationId}/status`, { status, note });
export const withdrawApplication = (applicationId, candidateId) => api.patch(`/applications/${applicationId}/withdraw?candidateId=${candidateId}`);
export const countByJob = (jobId) => api.get(`/applications/job/${jobId}/count`);
export const hasApplied = (jobId, candidateId) => api.get('/applications/check', { params: { jobId, candidateId } });
