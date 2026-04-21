import api from './axiosConfig';

export const scheduleInterview = (interview) => api.post('/interviews', interview);
export const getInterviewById = (id) => api.get(`/interviews/${id}`);
export const getInterviewsByApplication = (applicationId) => api.get(`/interviews/application/${applicationId}`);
export const getInterviewsByCandidate = (candidateId) => api.get(`/interviews/candidate/${candidateId}`);
export const getInterviewsByRecruiter = (recruiterId) => api.get(`/interviews/recruiter/${recruiterId}`);
export const confirmInterview = (interviewId) => api.patch(`/interviews/${interviewId}/confirm`);
export const rescheduleInterview = (interviewId, scheduledAt, notes) => api.patch(`/interviews/${interviewId}/reschedule`, { scheduledAt, notes });
export const cancelInterview = (interviewId, reason) => api.patch(`/interviews/${interviewId}/cancel`, { reason });
