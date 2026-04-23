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

// ── Wallets ──
export const createWallet = (userId, userRole) => api.post('/wallet', { userId, userRole });
export const getWallet = (userId) => api.get(`/wallet/${userId}`);
export const getWalletBalance = (userId) => api.get(`/wallet/${userId}/balance`);
export const creditWallet = (userId, amount, paymentMode, transactionRef, description) => 
  api.post(`/wallet/${userId}/credit`, { amount, paymentMode, transactionRef, description });
export const debitWallet = (userId, amount, paymentMode, description) => 
  api.post(`/wallet/${userId}/debit`, { amount, paymentMode, description });
export const getWalletTransactions = (userId) => api.get(`/wallet/${userId}/transactions`);
export const getWalletTransactionsByType = (userId, type) => api.get(`/wallet/${userId}/transactions/${type}`);

// ── Admin Billing Visibility (with endpoint fallback support) ──
export const getPlatformSubscriptions = async () => {
  try {
    return await api.get('/subscriptions/admin');
  } catch {
    return api.get('/subscriptions');
  }
};

export const getPlatformInvoices = async () => {
  try {
    return await api.get('/invoices/admin');
  } catch {
    return api.get('/invoices');
  }
};

