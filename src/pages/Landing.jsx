import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// SVG Logo
function LogoIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#lg1)"/>
      <circle cx="32" cy="24" r="8" stroke="white" strokeWidth="3.5" fill="none"/>
      <path d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <circle cx="9"  cy="16" r="3.5" fill="white" fillOpacity="0.85"/>
      <circle cx="55" cy="16" r="3.5" fill="white" fillOpacity="0.85"/>
      <circle cx="9"  cy="48" r="3.5" fill="white" fillOpacity="0.85"/>
      <circle cx="55" cy="48" r="3.5" fill="white" fillOpacity="0.85"/>
      <line x1="12" y1="17" x2="22" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
      <line x1="52" y1="17" x2="42" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
      <line x1="12" y1="47" x2="22" y2="41" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
      <line x1="52" y1="47" x2="42" y2="41" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
    </svg>
  );
}

// Interactive FAQ item
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
      <div className="faq-question">
        {question}
        <span style={{
          fontSize: '1.25rem', lineHeight: 1, fontWeight: 300,
          display: 'inline-block',
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
        }}>+</span>
      </div>
      {open && <div className="faq-answer" style={{ display: 'block' }}>{answer}</div>}
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <LogoIcon size={32} />
            <span>HireConnect</span>
          </Link>
          <div className="landing-links">
            <a href="#features"  className="landing-link">Features</a>
            <a href="#process"   className="landing-link">How it Works</a>
            <a href="#pricing"   className="landing-link">Pricing</a>
            <Link to="/jobs"     className="landing-link">Browse Jobs</Link>
          </div>
          <div className="landing-actions">
            <Link to="/login"    className="btn-outline">Log in</Link>
            <Link to="/register" className="btn-glow">Get Started →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg-glow" />
        <div className="hero-container">
          <div className="hero-content">
            <h1>The modern platform for <span className="hero-accent">smart hiring.</span></h1>
            <p>
              Post jobs, review applications, schedule interviews, and message
              candidates — all in one place. Built for recruiters who want clarity,
              not complexity.
            </p>
            <div className="hero-buttons">
              <button className="btn-glow hero-cta-primary" onClick={() => navigate('/register')}>
                Start for Free
              </button>
              <button className="btn-outline hero-cta-secondary" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img src="/mockup.png" alt="HireConnect Dashboard Preview" className="hero-mockup" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <div className="section-head">
          <div className="section-pill">Features</div>
          <h2>Everything you need to hire well</h2>
          <p>HireConnect brings your entire hiring workflow into one focused platform.</p>
        </div>
        <div className="features-grid">
          {[
            {
              icon: '📋',
              title: 'Job Posting & Management',
              desc: 'Create and publish job listings with required skills, experience level, salary range, and job type. Manage active, paused, and closed listings from one dashboard.',
            },
            {
              icon: '👤',
              title: 'Candidate Applications',
              desc: 'Candidates apply with a cover letter and resume. Recruiters can shortlist, schedule interviews, extend offers, or reject — with a clear status pipeline at every step.',
            },
            {
              icon: '📅',
              title: 'Interview Scheduling',
              desc: 'Schedule, confirm, reschedule, or cancel interviews directly within the platform. Candidates get notified instantly and can manage their schedule too.',
            },
            {
              icon: '💬',
              title: 'Direct Messaging',
              desc: 'Recruiters can message shortlisted or interview-stage candidates directly. Candidates can reply from their messages inbox — no external tools needed.',
            },
            {
              icon: '🔔',
              title: 'Real-time Notifications',
              desc: 'Both recruiters and candidates receive instant notifications for application updates, interview changes, messages, and offer decisions.',
            },
            {
              icon: '📊',
              title: 'Recruiter Analytics',
              desc: 'Track your recruitment funnel — total applications, shortlisted, interviews, offers, and view-to-apply ratios — to continuously improve your hiring process.',
            },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="process" className="steps-section">
        <div className="section-head" style={{ marginBottom: '4rem' }}>
          <div className="section-pill">How it Works</div>
          <h2>Simple for both sides of hiring</h2>
          <p>Whether you're posting jobs or applying for them, the process is straightforward.</p>
        </div>
        <div className="steps-container">
          {[
            {
              n: '1',
              title: 'Post or Find a Job',
              desc: 'Recruiters create a detailed job listing in minutes. Candidates browse and filter by role, location, type, and experience level to find the right fit.',
            },
            {
              n: '2',
              title: 'Apply & Review',
              desc: 'Candidates submit their application with a cover letter and resume. Recruiters review applications and move candidates through the pipeline — applied, shortlisted, interview scheduled, offered.',
            },
            {
              n: '3',
              title: 'Communicate & Decide',
              desc: 'Both parties message directly within the platform. Interviews are scheduled, confirmed, or rescheduled here. Offers are extended and tracked through to completion.',
            },
          ].map((s) => (
            <div className="step-item" key={s.n}>
              <div className="step-number">{s.n}</div>
              <div className="step-content">
                <h3>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="pricing-sec">
        <div className="section-head">
          <div className="section-pill">Pricing</div>
          <h2>Transparent, straightforward pricing</h2>
          <p>No hidden fees. All candidate features are always free.</p>
        </div>
        <div className="pricing-grid-landing">
          <div className="price-card-l">
            <h3>Candidate</h3>
            <div className="amt">Free<span> forever</span></div>
            <ul>
              <li>Browse & apply to all jobs</li>
              <li>Upload resume & profile</li>
              <li>Direct messaging with recruiters</li>
              <li>Interview scheduling</li>
              <li>Application status tracking</li>
            </ul>
            <button className="btn-outline btn-full" onClick={() => navigate('/register')}>
              Sign Up Free
            </button>
          </div>

          <div className="price-card-l featured">
            <div className="price-badge">For Recruiters</div>
            <h3 style={{ color: 'var(--accent)' }}>Professional</h3>
            <div className="amt">$49<span>/month</span></div>
            <ul>
              <li>Up to 10 active job listings</li>
              <li>Full application pipeline management</li>
              <li>Interview scheduling & tracking</li>
              <li>Direct messaging with candidates</li>
              <li>Recruitment analytics dashboard</li>
              <li>Team collaboration (5 seats)</li>
            </ul>
            <button className="btn-glow btn-full" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>

          <div className="price-card-l">
            <h3>Enterprise</h3>
            <div className="amt">$199<span>/month</span></div>
            <ul>
              <li>Unlimited active job listings</li>
              <li>Unlimited team members</li>
              <li>Priority support</li>
              <li>Custom onboarding</li>
            </ul>
            <button className="btn-outline btn-full" onClick={() => navigate('/register')}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-section">
        <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '3rem' }}>
          Frequently Asked Questions
        </h2>
        <FaqItem
          question="Is it free for candidates?"
          answer="Yes, completely. Candidates can browse jobs, apply, message recruiters, track application status, and manage interviews — all for free with no limits."
        />
        <FaqItem
          question="How does messaging work?"
          answer="Once a candidate is shortlisted or reaches the interview stage, the recruiter can initiate a direct message conversation. The candidate can reply from their messages inbox. All messages are stored in-platform."
        />
        <FaqItem
          question="What happens after I post a job?"
          answer="Applications come in automatically. You can review each candidate, move them through the pipeline (Applied → Shortlisted → Interview Scheduled → Offered), and message them directly. Analytics update in real time."
        />
        <FaqItem
          question="Can I cancel my plan anytime?"
          answer="Yes. All recruiter plans are month-to-month. You can cancel anytime from your billing settings — no cancellation fees."
        />
        <FaqItem
          question="What notification types are supported?"
          answer="Both recruiters and candidates receive notifications for application status changes, new messages, interview schedule updates, offer decisions, and platform alerts."
        />
      </section>

      {/* ── CTA ── */}
      <section className="cta-banner">
        <h2>Ready to simplify your hiring?</h2>
        <p>Join HireConnect today — free for candidates, straightforward for recruiters.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-glow"
            style={{ padding: '0.9rem 2rem', fontSize: '1rem', background: 'white', color: '#1e3a8a', fontWeight: 700 }}
            onClick={() => navigate('/register')}
          >
            Create Free Account
          </button>
          <button
            className="btn-outline"
            style={{ padding: '0.9rem 2rem', fontSize: '1rem', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
            onClick={() => navigate('/jobs')}
          >
            Browse Jobs
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="landing-brand" style={{ marginBottom: '1rem' }}>
              <LogoIcon size={28} />
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>HireConnect</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              A full-stack hiring platform for recruiters and candidates.
            </p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link to="/jobs">Browse Jobs</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Log In</Link></li>
              <li><Link to="/register">Sign Up</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#process">How it Works</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} HireConnect. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
