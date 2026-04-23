/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getInbox, getConversation, sendMessage } from '../api/notificationApi';
import { LoadingSpinner, Toast, Alert } from '../components/UI';
import { getJobsByRecruiter } from '../api/jobApi';
import { getByJob } from '../api/applicationApi';
import { getCandidateByUserId, getRecruiterByUserId } from '../api/profileApi';

/** Resolve a userId to a display name using the profile API */
async function resolveUserName(userId, role) {
  try {
    if (role === 'RECRUITER') {
      const r = await getCandidateByUserId(userId);
      const p = r.data;
      return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.fullName || `User ${userId}`;
    } else {
      // Try candidate first, then recruiter
      try {
        const r = await getCandidateByUserId(userId);
        const p = r.data;
        return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.fullName || `User ${userId}`;
      } catch {
        const r = await getRecruiterByUserId(userId);
        const p = r.data;
        return p.companyName || [p.firstName, p.lastName].filter(Boolean).join(' ') || `User ${userId}`;
      }
    }
  } catch {
    return `User ${userId}`;
  }
}

function getInitials(name) {
  if (!name || name.startsWith('User ')) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [activeName, setActiveName] = useState('');
  const [activeApplicationId, setActiveApplicationId] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [eligibleThreads, setEligibleThreads] = useState([]);
  const [nameCache, setNameCache] = useState({});         // userId → display name
  const [searchParams] = useSearchParams();
  const isRecruiter = user?.role === 'RECRUITER';

  /** Resolve a userId to a display name, with caching */
  const resolveName = useCallback(async (userId) => {
    if (nameCache[userId]) return nameCache[userId];
    const name = await resolveUserName(userId, user?.role);
    setNameCache(prev => ({ ...prev, [userId]: name }));
    return name;
  }, [nameCache, user?.role]);

  const loadInbox = useCallback(async () => {
    if (!user?.userId) { setInbox([]); setLoading(false); return; }
    try {
      setError('');
      const res = await getInbox(user.userId);
      const msgs = res.data || [];
      setInbox(msgs);

      // Pre-resolve names for all inbox threads
      const otherIds = [...new Set(msgs.map(m => m.senderId === user.userId ? m.receiverId : m.senderId))];
      await Promise.allSettled(otherIds.map(id => resolveName(id)));
    } catch {
      setInbox([]);
      setError('Unable to load conversations right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, resolveName]);

  const loadEligibleThreads = useCallback(async () => {
    if (!isRecruiter || !user?.userId) { setEligibleThreads([]); return; }
    try {
      const jobsRes = await getJobsByRecruiter(user.userId);
      const jobs = jobsRes.data || [];
      const appResList = await Promise.allSettled(jobs.map((job) => getByJob(job.jobId)));
      const eligible = [];
      appResList.forEach((appRes, index) => {
        if (appRes.status !== 'fulfilled') return;
        const job = jobs[index];
        const apps = appRes.value.data || [];
        apps
          .filter((app) => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED'].includes(app.status))
          .forEach((app) => {
            eligible.push({
              candidateId: app.candidateId,
              applicationId: app.applicationId,
              status: app.status,
              jobTitle: job?.title || `Job #${app.jobId}`,
            });
          });
      });
      const dedup = [];
      const seen = new Set();
      eligible.forEach((entry) => {
        const key = `${entry.candidateId}-${entry.applicationId}`;
        if (seen.has(key)) return;
        seen.add(key);
        dedup.push(entry);
      });
      setEligibleThreads(dedup);
      // Pre-resolve names
      await Promise.allSettled(dedup.map(e => resolveName(e.candidateId)));
    } catch {
      setEligibleThreads([]);
    }
  }, [isRecruiter, user?.userId, resolveName]);

  const eligibleByCandidate = useMemo(() => {
    const map = new Map();
    eligibleThreads.forEach((entry) => {
      if (!map.has(entry.candidateId)) map.set(entry.candidateId, entry);
    });
    return map;
  }, [eligibleThreads]);

  const openConversation = useCallback(async (otherUserId, applicationId = 0) => {
    if (isRecruiter && !eligibleByCandidate.has(otherUserId)) {
      setToast('Recruiters can message only shortlisted/interview-stage candidates.');
      return;
    }
    setActiveChat(otherUserId);
    setActiveApplicationId(applicationId || eligibleByCandidate.get(otherUserId)?.applicationId || 0);

    // Resolve display name
    const name = await resolveName(otherUserId);
    setActiveName(name);

    try {
      const res = await getConversation(user.userId, otherUserId);
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
  }, [eligibleByCandidate, isRecruiter, user?.userId, resolveName]);

  useEffect(() => {
    if (!user?.userId) return;
    loadInbox();
    if (isRecruiter) loadEligibleThreads();
  }, [isRecruiter, loadEligibleThreads, loadInbox, user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    const candidateId = Number(searchParams.get('candidateId'));
    const applicationId = Number(searchParams.get('applicationId'));
    if (!candidateId) return;
    if (isRecruiter) {
      const allowed = eligibleThreads.find((item) => item.candidateId === candidateId);
      if (!allowed) return;
      openConversation(candidateId, applicationId || allowed.applicationId || 0);
      return;
    }
    openConversation(candidateId, applicationId || 0);
  }, [eligibleThreads, isRecruiter, openConversation, searchParams, user?.userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    if (isRecruiter && !eligibleByCandidate.has(activeChat)) {
      setToast('This candidate is not eligible for recruiter messaging yet.');
      return;
    }
    try {
      await sendMessage({
        senderId: user.userId,
        receiverId: activeChat,
        content: newMessage,
        applicationId: activeApplicationId || 0
      });
      setNewMessage('');
      openConversation(activeChat, activeApplicationId);
      loadInbox();
    } catch {
      setToast('Failed to send message.');
    }
  };

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper messages-page-wrapper">
      <Navbar />
      <div className="page-content messages-page-content">

        {error && <Alert type="error" message={error} />}

        {/* Sidebar */}
        <div className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h3 className="messages-sidebar-title">Messages</h3>
          </div>

          {/* Recruiter: eligible candidates to start new thread */}
          {isRecruiter && (
            <div className="messages-eligible-wrap">
              <div className="messages-eligible-title">Start new conversation</div>
              <div className="messages-eligible-list">
                {eligibleThreads.length === 0 ? (
                  <div className="muted messages-muted-sm">No shortlisted/interview candidates yet.</div>
                ) : eligibleThreads.map((entry) => {
                  const name = nameCache[entry.candidateId] || `Candidate #${entry.candidateId}`;
                  return (
                    <button
                      key={`${entry.candidateId}-${entry.applicationId}`}
                      className="btn-secondary btn-sm messages-thread-btn"
                      onClick={() => openConversation(entry.candidateId, entry.applicationId)}
                    >
                      {name} · {entry.jobTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inbox */}
          <div className="messages-inbox-list">
            {inbox.length === 0 ? (
              <p className="muted messages-empty">No conversations yet.</p>
            ) : inbox.map(msg => {
              const isSender = msg.senderId === user.userId;
              const otherParam = isSender ? msg.receiverId : msg.senderId;
              const displayName = nameCache[otherParam] || `User ${otherParam}`;
              const abbr = getInitials(displayName);
              return (
                <div
                  key={msg.messageId}
                  onClick={() => openConversation(otherParam, msg.applicationId || 0)}
                  className={`messages-inbox-item ${activeChat === otherParam ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="msg-avatar">{abbr}</div>
                    <div style={{ minWidth: 0 }}>
                      <strong>{displayName}</strong>
                      <p className="messages-inbox-preview">
                        {isSender ? 'You: ' : ''}{msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className="messages-chat-wrap">
          {activeChat ? (
            <>
              <div className="messages-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="msg-avatar msg-avatar--lg">{getInitials(activeName)}</div>
                  <div>
                    <h3 className="messages-chat-title">{activeName || `User ${activeChat}`}</h3>
                    {activeApplicationId ? (
                      <p className="messages-chat-subtitle">Application thread</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="messages-thread">
                {messages.map(m => {
                  const isMe = m.senderId === user.userId;
                  return (
                    <div key={m.messageId} className={`messages-bubble-wrap ${isMe ? 'me' : 'other'}`}>
                      <div className={`messages-bubble ${isMe ? 'me' : 'other'}`}>
                        {m.content}
                      </div>
                      <div className={`messages-bubble-time ${isMe ? 'me' : 'other'}`}>
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="messages-compose">
                <input
                  type="text"
                  className="form-input messages-compose-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-primary messages-compose-send">Send</button>
              </form>
            </>
          ) : (
            <div className="messages-empty-thread">
              Select a conversation to start messaging
            </div>
          )}
        </div>

      </div>
      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
