import api from './axiosConfig';

// Candidate
export const createCandidateProfile = (profile) => api.post('/profiles/candidates', profile);
export const getCandidateById = (profileId) => api.get(`/profiles/candidates/${profileId}`);
export const getCandidateByUserId = (userId) => api.get(`/profiles/candidates/user/${userId}`);
export const updateCandidateProfile = (profileId, profile) => api.put(`/profiles/candidates/${profileId}`, profile);
export const deleteCandidateProfile = (profileId) => api.delete(`/profiles/candidates/${profileId}`);
export const getAllCandidates = () => api.get('/profiles/candidates');

// Recruiter
export const createRecruiterProfile = (profile) => api.post('/profiles/recruiters', profile);
export const getRecruiterById = (profileId) => api.get(`/profiles/recruiters/${profileId}`);
export const getRecruiterByUserId = (userId) => api.get(`/profiles/recruiters/user/${userId}`);
export const updateRecruiterProfile = (profileId, profile) => api.put(`/profiles/recruiters/${profileId}`, profile);
export const deleteRecruiterProfile = (profileId) => api.delete(`/profiles/recruiters/${profileId}`);
export const getAllRecruiters = () => api.get('/profiles/recruiters');
