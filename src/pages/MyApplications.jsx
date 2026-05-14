import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { StatusBadge, LoadingSpinner, EmptyState } from "../components/UI";
import { getByCandidate, withdrawApplication } from "../api/applicationApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_ORDER = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
  "REJECTED",
];

const STAGE_LABELS = {
  APPLIED: "Application submitted",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview scheduled",
  OFFERED: "Offer made",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

const STAGE_SEQUENCE = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
];

const formatDateTime = (value) => {
  if (!value) return "Pending";
  const date = new Date(value);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const buildTimeline = (app) => {
  const currentIndex = STAGE_SEQUENCE.indexOf(app.status);
  const timeline = [
    {
      key: "APPLIED",
      label: STAGE_LABELS.APPLIED,
      state: "completed",
      time: app.appliedAt,
      note: "Application received",
    },
  ];

  if (currentIndex > 0) {
    timeline.push({
      key: app.status,
      label: STAGE_LABELS[app.status] || app.status,
      state: "current",
      time: app.statusUpdatedAt || app.appliedAt,
      note: app.recruiterNote || "Latest review update",
    });
  } else if (app.status === "REJECTED" || app.status === "WITHDRAWN") {
    timeline.push({
      key: app.status,
      label: STAGE_LABELS[app.status],
      state: "current",
      time: app.statusUpdatedAt || app.appliedAt,
      note: app.recruiterNote || "Application closed",
    });
  } else {
    timeline.push({
      key: "REVIEW",
      label: "Under review",
      state: "pending",
      time: null,
      note: "Waiting for recruiter action",
    });
  }

  if (app.status === "REJECTED" || app.status === "WITHDRAWN") {
    timeline.push({
      key: app.status,
      label: STAGE_LABELS[app.status],
      state: "closed",
      time: app.statusUpdatedAt || app.appliedAt,
      note: "Final outcome",
    });
  } else if (app.status === "OFFERED") {
    timeline.push({
      key: "OFFERED",
      label: STAGE_LABELS.OFFERED,
      state: "completed",
      time: app.statusUpdatedAt || app.appliedAt,
      note: "Current outcome",
    });
  } else {
    timeline.push({
      key: "NEXT",
      label: "Next step",
      state: "pending",
      time: null,
      note: "Shortlist or interview update next",
    });
  }

  return timeline;
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [toast, setToast] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.userId) {
      getByCandidate(user.userId)
        .then((r) => setApplications(r.data))
        .catch(() => setApplications([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleWithdraw = async (appId) => {
    if (!window.confirm("Withdraw this application?")) return;
    try {
      await withdrawApplication(appId, user.userId);
      setApplications((prev) =>
        prev.map((a) =>
          a.applicationId === appId ? { ...a, status: "WITHDRAWN" } : a,
        ),
      );
      setToast("Application withdrawn.");
    } catch {
      setToast("Failed to withdraw.");
    }
  };

  const filtered =
    filter === "ALL"
      ? applications
      : applications.filter((a) => a.status === filter);

  const statusCount = (s) => applications.filter((a) => a.status === s).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content" id="main-content">
        <div className="page-header" aria-labelledby="my-applications-title">
          <div>
            <h1 id="my-applications-title">My Applications</h1>
            <p>Track all your job applications in one place</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate("/jobs")}
            aria-label="Browse more jobs"
          >
            Browse More Jobs
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{applications.length}</span>
            <span className="stat-label">Total Applied</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount("SHORTLISTED")}</span>
            <span className="stat-label">Shortlisted</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">
              {statusCount("INTERVIEW_SCHEDULED")}
            </span>
            <span className="stat-label">Interviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{statusCount("OFFERED")}</span>
            <span className="stat-label">Offers</span>
          </div>
        </div>

        {/* Pipeline tracker */}
        <div className="pipeline-bar" aria-label="Application pipeline summary">
          {STATUS_ORDER.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`pipeline-step ${statusCount(s) > 0 ? "has-items" : ""}`}
                aria-label={`${s.replace("_", " ")}: ${statusCount(s)} applications`}
              >
                <span className="pipeline-num">{statusCount(s)}</span>
                <span className="pipeline-label">{s.replace("_", " ")}</span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className="pipeline-arrow" aria-hidden="true">
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Filter tabs */}
        <div
          className="tabs"
          role="tablist"
          aria-label="Filter applications by status"
        >
          {["ALL", ...STATUS_ORDER, "WITHDRAWN"].map((s) => (
            <button
              key={s}
              className={`tab ${filter === s ? "active" : ""}`}
              role="tab"
              aria-selected={filter === s}
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
            >
              {s.replace("_", " ")}
              {s !== "ALL" && (
                <span className="tab-count">
                  {applications.filter((a) => a.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No applications yet"
            message={
              filter === "ALL"
                ? "Start applying to jobs to track them here."
                : `No applications with status: ${filter}`
            }
            action={
              filter === "ALL" && (
                <button
                  className="btn-primary"
                  onClick={() => navigate("/jobs")}
                >
                  Find Jobs
                </button>
              )
            }
          />
        ) : (
          <div className="applications-list">
            {filtered.map((app) => (
              <article
                className="app-card app-card--timeline"
                key={app.applicationId}
                aria-labelledby={`application-${app.applicationId}-title`}
              >
                <div className="app-card-left">
                  <div className="company-logo-sm" aria-hidden="true">
                    {app.jobId}
                  </div>
                  <div>
                    <h3
                      className="app-job-title"
                      id={`application-${app.applicationId}-title`}
                    >
                      Job #{app.jobId}
                    </h3>
                    <p className="app-meta">
                      Applied {formatDateTime(app.appliedAt)}
                    </p>
                    {app.coverLetter && (
                      <p className="app-cover">
                        {app.coverLetter.substring(0, 80)}
                        {app.coverLetter.length > 80 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="app-card-right">
                  <StatusBadge status={app.status} />
                  <div
                    className="app-actions"
                    aria-label={`Actions for application ${app.applicationId}`}
                  >
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => navigate(`/jobs/${app.jobId}`)}
                    >
                      View Job
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() =>
                        navigate(`/interviews?appId=${app.applicationId}`)
                      }
                    >
                      Interviews
                    </button>
                    {(app.status === "APPLIED" ||
                      app.status === "SHORTLISTED") && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleWithdraw(app.applicationId)}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
                <section
                  className="application-timeline"
                  aria-label="Application timeline"
                >
                  <div className="application-timeline__header">
                    <h4>Application timeline</h4>
                    <span className="muted">
                      Latest update:{" "}
                      {formatDateTime(app.statusUpdatedAt || app.appliedAt)}
                    </span>
                  </div>
                  <ol className="application-timeline__list">
                    {buildTimeline(app).map((step) => (
                      <li
                        key={`${app.applicationId}-${step.key}`}
                        className={`application-timeline__item application-timeline__item--${step.state}`}
                      >
                        <span
                          className="application-timeline__dot"
                          aria-hidden="true"
                        />
                        <div className="application-timeline__content">
                          <div className="application-timeline__row">
                            <strong>{step.label}</strong>
                            <span className="muted">
                              {step.time
                                ? formatDateTime(step.time)
                                : "Pending"}
                            </span>
                          </div>
                          <p>{step.note}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </article>
            ))}
          </div>
        )}
      </main>
      {toast && (
        <div className="toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}
    </div>
  );
}
