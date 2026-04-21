import api from './axiosConfig';

export const subscribe = (recruiterId, plan, paymentMode, amount) =>
  api.post('/subscriptions', { recruiterId, plan, paymentMode, amount });
export const getActiveSubscription = (recruiterId) =>
  api.get(`/subscriptions/recruiter/${recruiterId}/active`);
export const getAllSubscriptions = (recruiterId) =>
  api.get(`/subscriptions/recruiter/${recruiterId}`);
export const cancelSubscription = (recruiterId) =>
  api.patch(`/subscriptions/recruiter/${recruiterId}/cancel`);
export const renewSubscription = (recruiterId, plan, amount) =>
  api.patch(`/subscriptions/recruiter/${recruiterId}/renew`, { plan, amount });
export const getInvoices = (recruiterId) =>
  api.get(`/invoices/recruiter/${recruiterId}`);
export const getLatestInvoice = (recruiterId) =>
  api.get(`/invoices/recruiter/${recruiterId}/latest`);
