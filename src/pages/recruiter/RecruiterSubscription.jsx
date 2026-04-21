import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Modal, LoadingSpinner, StatusBadge } from '../../components/UI';
import { subscribe, getActiveSubscription, getInvoices, cancelSubscription } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';

const PLANS = [
  { id: 'FREE', name: 'Free', price: 0, features: ['3 Active Jobs', 'Basic Analytics', 'Standard Support'] },
  { id: 'PROFESSIONAL', name: 'Professional', price: 2999, features: ['Unlimited Jobs', 'Advanced Analytics', 'Resume Parsing', 'Priority Support'] },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 9999, features: ['Custom Integrations', 'Dedicated Account Manager', 'Custom API Access', 'SSO Setup'] }
];

export default function RecruiterSubscription() {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CARD');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user?.userId) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [subRes, invRes] = await Promise.all([
        getActiveSubscription(user.userId).catch(() => ({ data: null })),
        getInvoices(user.userId).catch(() => ({ data: [] }))
      ]);
      setActivePlan(subRes.data);
      setInvoices(invRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      const plan = PLANS.find(p => p.id === showCheckout);
      await subscribe(user.userId, plan.id, paymentMode, plan.price);
      setToast(`Subscribed to ${plan.name} plan!`);
      setShowCheckout(null);
      loadData();
    } catch {
      setToast('Subscription failed.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your current plan? You will lose access to premium features immediately.')) return;
    try {
      await cancelSubscription(user.userId);
      setToast('Subscription cancelled.');
      loadData();
    } catch {
      setToast('Failed to cancel subscription.');
    }
  };

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Subscription & Billing</h1>
            <p>Manage your recruiter plan and view past invoices</p>
          </div>
        </div>

        {activePlan ? (
          <div className="dashboard-card" style={{borderLeft: '4px solid var(--accent)', marginBottom: '3rem'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h2 style={{margin:0}}>Current Plan: {activePlan.plan}</h2>
                <p className="muted" style={{marginTop:'0.5rem'}}>Status: <strong>{activePlan.status}</strong> · Expires: {new Date(activePlan.endDate).toLocaleDateString()}</p>
              </div>
              {activePlan.plan !== 'FREE' && (
                <button className="btn-danger" onClick={handleCancel}>Cancel Subscription</button>
              )}
            </div>
          </div>
        ) : (
          <p className="muted" style={{marginBottom: '2rem'}}>You currently do not have an active subscription.</p>
        )}

        <h2 className="section-title">Available Plans</h2>
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <div className={`pricing-card ${activePlan?.plan === plan.id ? 'active-plan' : ''}`} key={plan.id}>
              {activePlan?.plan === plan.id && <div className="pricing-badge">Current Plan</div>}
              <h3>{plan.name}</h3>
              <div className="price">₹{plan.price.toLocaleString()}<span>/month</span></div>
              <ul className="pricing-features">
                {plan.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              {activePlan?.plan !== plan.id && (
                <button className="btn-primary btn-full" onClick={() => setShowCheckout(plan.id)}>
                   Upgrade to {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>

        {invoices.length > 0 && (
          <section style={{marginTop: '4rem'}}>
            <h2 className="section-title">Billing History</h2>
            <div className="jobs-table">
              <div className="table-header">
                <span>Invoice ID</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Payment Mode</span>
                <span>Status</span>
              </div>
              {invoices.map(inv => (
                <div className="table-row" key={inv.invoiceId}>
                  <strong>#{inv.invoiceId}</strong>
                  <span>{new Date(inv.paymentDate).toLocaleDateString()}</span>
                  <span>₹{inv.amount.toLocaleString()}</span>
                  <span>{inv.paymentMode}</span>
                  <StatusBadge status="ACTIVE" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal isOpen={!!showCheckout} onClose={() => setShowCheckout(null)} title="Complete Purchase">
         <div style={{marginBottom:'1.5rem'}}>
            You are subscribing to the <strong>{PLANS.find(p => p.id === showCheckout)?.name}</strong> plan for
            <strong> ₹{PLANS.find(p => p.id === showCheckout)?.price.toLocaleString()}/month</strong>.
         </div>
         <form onSubmit={handleSubscribe}>
            <div className="form-group">
               <label className="form-label">Payment Method</label>
               <select className="form-input" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="WALLET">HireConnect Wallet</option>
               </select>
            </div>
            {(paymentMode === 'CARD' || paymentMode === 'UPI') && (
              <div className="form-group">
                 <label className="form-label">{paymentMode === 'CARD' ? 'Card Details (Demo)' : 'UPI ID (Demo)'}</label>
                 <input type="text" className="form-input" placeholder={paymentMode==='CARD'?"XXXX-XXXX-XXXX-XXXX":"user@upi"} />
              </div>
            )}
            <div className="btn-row">
               <button type="button" className="btn-secondary" onClick={() => setShowCheckout(null)}>Cancel</button>
               <button type="submit" className="btn-primary">Pay Securely</button>
            </div>
         </form>
      </Modal>

      {toast && <div className="toast" onClick={() => setToast('')}>{toast}</div>}
    </div>
  );
}
