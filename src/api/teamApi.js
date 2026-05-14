import api from './axiosConfig';

export const inviteTeamMember = (recruiterId, member) =>
  api.post(`/profiles/recruiters/${recruiterId}/team`, member);

export const getTeamMembers = (recruiterId) =>
  api.get(`/profiles/recruiters/${recruiterId}/team`);

export const getTeamMembersByStatus = (recruiterId, status) =>
  api.get(`/profiles/recruiters/${recruiterId}/team/status/${status}`);

export const updateTeamMemberRole = (recruiterId, memberUserId, role) =>
  api.patch(`/profiles/recruiters/${recruiterId}/team/${memberUserId}/role`, { role });

export const revokeTeamMember = (recruiterId, teamMemberId) =>
  api.delete(`/profiles/recruiters/${recruiterId}/team/${teamMemberId}`);

export const checkTeamMember = (recruiterId, memberUserId) =>
  api.get(`/profiles/recruiters/${recruiterId}/team/${memberUserId}/check`);
