/* eslint-disable no-unused-vars */
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

// ── Resume Parsing ──
export const parseResume = (profileId, resumeUrl) => api.post(`/profiles/candidates/${profileId}/resume/parse`, { resumeUrl });
export const getParsedResume = (profileId) => api.get(`/profiles/candidates/${profileId}/resume/parsed`);
export const uploadCandidateResume = async (profileId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/profiles/candidates/${profileId}/resume/upload`, formData, {
	headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Team Member Management ──
export const inviteTeamMember = (recruiterId, member) => api.post(`/profiles/recruiters/${recruiterId}/team`, member);
export const getTeamMembers = (recruiterId) => api.get(`/profiles/recruiters/${recruiterId}/team`);
export const getTeamMembersByStatus = (recruiterId, status) => api.get(`/profiles/recruiters/${recruiterId}/team/status/${status}`);
export const acceptInvitation = (recruiterId, memberUserId) => api.patch(`/profiles/recruiters/${recruiterId}/team/${memberUserId}/accept`);
export const updateTeamMemberRole = (recruiterId, memberUserId, role) => api.patch(`/profiles/recruiters/${recruiterId}/team/${memberUserId}/role`, { role });
export const revokeTeamMember = (recruiterId, teamMemberId) => api.delete(`/profiles/recruiters/${recruiterId}/team/${teamMemberId}`);
export const checkTeamMember = (recruiterId, memberUserId) => api.get(`/profiles/recruiters/${recruiterId}/team/${memberUserId}/check`);

void [
  createCandidateProfile,
  getCandidateById,
  getCandidateByUserId,
  updateCandidateProfile,
  deleteCandidateProfile,
  getAllCandidates,
  createRecruiterProfile,
  getRecruiterById,
  getRecruiterByUserId,
  updateRecruiterProfile,
  deleteRecruiterProfile,
  getAllRecruiters,
  parseResume,
  getParsedResume,
  uploadCandidateResume,
  inviteTeamMember,
  getTeamMembers,
  getTeamMembersByStatus,
  acceptInvitation,
  updateTeamMemberRole,
  revokeTeamMember,
  checkTeamMember,
];

