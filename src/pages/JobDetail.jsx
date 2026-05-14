/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { StatusBadge, LoadingSpinner, Toast, Alert } from "../components/UI";
import {
  getJobById,
  checkBookmark,
  addBookmark,
  removeBookmark,
} from "../api/jobApi";
import { hasApplied, submitApplication } from "../api/applicationApi";
import {
  ensureCandidateProfile,
  getCandidateByUserId,
  uploadCandidateResume,
} from "../api/profileApi";
import { useAuth } from "../context/AuthContext";

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadJob = useCallback(async () => {
    setError("");
    try {
      const res = await getJobById(jobId, {
        params: { viewerId: user?.userId },
      });
      setJob(res.data);
      if (user && user.role === "CANDIDATE") {
        const checkApp = await hasApplied(jobId, user.userId);
        setApplied(checkApp.data.applied);

        try {
          const checkBkm = await checkBookmark(user.userId, jobId);
          setBookmarked(checkBkm.data.bookmarked);
        } catch {
          setBookmarked(false);
        }

        try {
          const profileRes = await getCandidateByUserId(user.userId);
          setCandidateProfile(profileRes.data);
        } catch {
          try {
            const createdProfile = await ensureCandidateProfile(user);
            setCandidateProfile(createdProfile);
          } catch {
            // profile might not exist yet
          }
        }
      }
    } catch {
      setError("We could not load this job right now.");
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowModal(true);
  };

  const confirmApply = async () => {
    setSubmitting(true);
    try {
      let finalResumeUrl = "";

      if (useProfileResume && candidateProfile?.resumeUrl) {
        finalResumeUrl = candidateProfile.resumeUrl;
      } else if (resumeFile && candidateProfile?.profileId) {
        // Upload resume first
        const uploadRes = await uploadCandidateResume(
          candidateProfile.profileId,
          resumeFile,
        );
        finalResumeUrl = uploadRes.data?.resumeUrl || "";
      } else if (
        !resumeFile &&
        !useProfileResume &&
        candidateProfile?.resumeUrl
      ) {
        // If user unchecks "use profile resume" but doesn't upload anything,
        // still use the profile resume as fallback
        finalResumeUrl = candidateProfile.resumeUrl;
      }

      await submitApplication({
        jobId: parseInt(jobId),
        candidateId: user.userId,
        coverLetter,
        resumeUrl: finalResumeUrl,
      });
      setApplied(true);
      setShowModal(false);
      setToast("Application submitted successfully!");
    } catch (err) {
      setToast(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      if (bookmarked) {
        await removeBookmark(user.userId, jobId);
        setBookmarked(false);
        setToast("Job removed from saved list");
      } else {
        await addBookmark(user.userId, jobId, "");
        setBookmarked(true);
        setToast("Job saved successfully!");
      }
    } catch {
      setToast("Failed to update bookmark");
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Not disclosed";
    if (min && max)
      return `₹${(min / 100000).toFixed(1)}L – ₹${(max / 100000).toFixed(1)}L per year`;
    return min
      ? `From ₹${(min / 100000).toFixed(1)}L`
      : `Up to ₹${(max / 100000).toFixed(1)}L`;
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  if (!job) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <Alert type="error" message={error || "Job not found."} />
          <button className="btn-secondary" onClick={() => navigate("/jobs")}>
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <button className="back-btn" onClick={() => navigate("/jobs")}>
          ← Back to Jobs
        </button>

        <div className="job-detail-layout">
          <div className="job-detail-main">
            <div className="job-detail-header">
              <div className="company-logo">{job.title?.[0] || "J"}</div>
              <div>
                <h1 className="job-detail-title">{job.title}</h1>
                <p className="job-detail-meta">
                  {job.location || "Remote"} · {job.type?.replace("_", " ")} ·
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="job-detail-status-wrap">
                {user?.role === "CANDIDATE" && (
                  <button
                    onClick={toggleBookmark}
                    className={`icon-btn job-detail-bookmark-btn ${bookmarked ? "active" : ""}`}
                    title={bookmarked ? "Unsave Job" : "Save Job"}
                  >
                    {bookmarked ? "★" : "☆"}
                  </button>
                )}
                <StatusBadge status={job.status} />
              </div>
            </div>

            <div className="job-detail-section">
              <h2>Job Description</h2>
              <p>{job.description}</p>
            </div>

            {job.skills?.length > 0 && (
              <div className="job-detail-section">
                <h2>Required Skills</h2>
                <div className="skills-list">
                  {job.skills.map((s) => (
                    <span className="skill-tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="job-detail-sidebar">
            <div className="sidebar-card">
              <h3>Job Overview</h3>
              <div className="overview-item">
                <span className="overview-label">Salary</span>
                <span className="overview-value">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Category</span>
                <span className="overview-value">{job.category || "—"}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Experience</span>
                <span className="overview-value">
                  {job.experienceRequired
                    ? `${job.experienceRequired} years`
                    : "—"}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Job Type</span>
                <span className="overview-value">
                  {job.type?.replace("_", " ") || "—"}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Location</span>
                <span className="overview-value">
                  {job.location || "Remote"}
                </span>
              </div>

              {user?.role !== "RECRUITER" &&
                job.status === "ACTIVE" &&
                (applied ? (
                  <div className="applied-notice">✓ You've already applied</div>
                ) : (
                  <button
                    className="btn-primary btn-full"
                    onClick={handleApply}
                  >
                    Apply Now
                  </button>
                ))}
              {!user && (
                <button
                  className="btn-primary btn-full"
                  onClick={() => navigate("/login")}
                >
                  Sign In to Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "600px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="modal-header">
              <h3>Apply to {job.title}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
              {candidateProfile && (
                <div
                  className="application-profile-summary"
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "var(--text-primary)",
                    }}
                  >
                    Applying as
                  </h4>
                  <p style={{ margin: "0 0 0.25rem 0", fontWeight: "500" }}>
                    {candidateProfile.fullName}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {candidateProfile.email}
                  </p>
                  {candidateProfile.experienceYears != null && (
                    <p
                      style={{
                        margin: "0.25rem 0 0 0",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Experience: {candidateProfile.experienceYears} years
                    </p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Resume</label>
                {candidateProfile?.resumeUrl ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={useProfileResume}
                        onChange={() => setUseProfileResume(true)}
                      />
                      Use existing resume from my profile
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={!useProfileResume}
                        onChange={() => setUseProfileResume(false)}
                      />
                      Upload a different resume
                    </label>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: "3px solid var(--warning)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                      }}
                    >
                      📋 You don't have a resume saved to your profile. Please
                      upload one below.
                    </p>
                  </div>
                )}

                {(!candidateProfile?.resumeUrl || !useProfileResume) && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="form-input"
                      onChange={(e) =>
                        setResumeFile(e.target.files?.[0] || null)
                      }
                    />
                    {resumeFile && (
                      <small
                        style={{
                          color: "var(--accent-matcha)",
                          display: "block",
                          marginTop: "0.25rem",
                          fontWeight: "500",
                        }}
                      >
                        ✓ {resumeFile.name} selected
                      </small>
                    )}
                    {!candidateProfile && (
                      <small
                        style={{
                          color: "var(--warning)",
                          display: "block",
                          marginTop: "0.25rem",
                        }}
                      >
                        Please set up your profile first to upload a resume.
                      </small>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label className="form-label">Cover Letter (optional)</label>
                <textarea
                  className="form-input"
                  rows="5"
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
            </div>

            <div
              className="btn-row"
              style={{
                padding: "1.5rem",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--bg-app)",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={confirmApply}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast} type="info" onClose={() => setToast("")} />
      )}
    </div>
  );
}
