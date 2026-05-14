/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { LoadingSpinner, StatusBadge, Toast } from '../../components/UI';
import {
  subscribe, getActiveSubscription, getInvoices, cancelSubscription,
  createRazorpayOrder, verifyRazorpayPayment
} from '../../api/subscriptionApi';
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
  const [processing, setProcessing] = useState(null); // planId being processed
  const [toast, setToast] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

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
  }, [user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Razorpay Checkout Flow ─────────────────────────────────────────────
  const handlePayWithRazorpay = async (plan) => {
    if (plan.price === 0) {
      // Free plan — subscribe directly
      try {
        await subscribe(user.userId, plan.id, 'FREE', 0);
        setToast(`Subscribed to ${plan.name} plan!`);
        loadData();
      } catch {
        setToast('Subscription failed.');
      }
      return;
    }

    setProcessing(plan.id);
    try {
      // Step 1: Create Razorpay order on our backend
      const orderRes = await createRazorpayOrder(user.userId, plan.id, plan.price);
      const order = orderRes.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'HireConnect',
        description: `${plan.name} Plan Subscription`,
        order_id: order.orderId,
        handler: async function (response) {
          // Step 3: Verify payment on our backend
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              recruiterId: user.userId,
              plan: plan.id,
              amount: plan.price,
            });

            if (verifyRes.data.verified) {
              setToast(`✅ Payment successful! Subscribed to ${plan.name} plan.`);
              loadData();
            } else {
              setToast('❌ Payment verification failed. Contact support.');
            }
          } catch {
            setToast('❌ Payment verification failed. Please contact support.');
          }
          setProcessing(null);
        },
        prefill: {
          email: user?.email || '',
          contact: '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setProcessing(null);
            setToast('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setToast(`❌ Payment failed: ${response.error.description}`);
        setProcessing(null);
      });
      rzp.open();
    } catch {
      setToast('Failed to initiate payment. Please try again.');
      setProcessing(null);
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
                <button
                  className="btn-primary btn-full"
                  onClick={() => handlePayWithRazorpay(plan)}
                  disabled={processing === plan.id}
                >
                  {processing === plan.id
                    ? 'Processing...'
                    : plan.price === 0
                      ? 'Select Free Plan'
                      : `Pay ₹${plan.price.toLocaleString()} with Razorpay`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Razorpay badge */}
        <div style={{textAlign:'center', margin:'2rem 0 1rem', opacity:0.5, fontSize:'0.85rem'}}>
          🔒 Payments secured by Razorpay · Test Mode
        </div>

        {invoices.length > 0 && (
          <section style={{marginTop: '3rem'}}>
            <h2 className="section-title">Billing History</h2>
            <div className="jobs-table">
              <div className="table-header">
                <span>Invoice ID</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Payment Mode</span>
                <span>Transaction ID</span>
                <span>Status</span>
              </div>
              {invoices.map(inv => (
                <div className="table-row" key={inv.invoiceId}>
                  <strong>#{inv.invoiceId}</strong>
                  <span>{new Date(inv.paymentDate || inv.createdAt).toLocaleDateString()}</span>
                  <span>₹{(inv.amount || 0).toLocaleString()}</span>
                  <span>{inv.paymentMode}</span>
                  <span style={{fontSize:'0.8rem', opacity:0.7}}>{inv.transactionId ? inv.transactionId.substring(0, 16) + '...' : '—'}</span>
                  <StatusBadge status="ACTIVE" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
