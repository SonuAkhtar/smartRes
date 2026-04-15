import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Spinner from "../../components/Spinner/Spinner";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { useToast } from "../../context/ToastContext";
import { saveJobEntry } from "../../lib/db";
import { tailorResume } from "../../lib/ai";
import { EASE_SPRING, DURATION } from "../../lib/motion";
import type { TailoredResume, JobEntry } from "../../types";
import "./JobMatcher.css";

const resultsStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.05 } },
};

const resultSection = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_SPRING },
  },
};

export default function JobMatcher() {
  const { user } = useAuth();
  const {
    profile,
    resumeText,
    jobHistory,
    setJobDescription,
    setTailoredResume,
    addJobEntry,
  } = useResume();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);

  const recentHistory = jobHistory.slice(-3).reverse();
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const JOB_URL_PATTERN =
    /^https?:\/\/(www\.)?(linkedin\.com\/jobs|indeed\.com|greenhouse\.io|lever\.co|workday\.com|myworkdayjobs\.com|jobs\.ashbyhq\.com|boards\.greenhouse\.io|apply\.workable\.com|smartrecruiters\.com|icims\.com)/i;

  const isJobUrl = (text: string) => JOB_URL_PATTERN.test(text.trim());

  const handlePasteFromClipboard = async () => {
    setPasteLoading(true);
    setUrlHint(null);
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (isJobUrl(trimmed)) {
        setUrlHint(trimmed);
      } else if (trimmed.length > 10) {
        setJd(trimmed);
      }
    } catch {
      // Clipboard access denied - silently fail
    } finally {
      setPasteLoading(false);
    }
  };

  const handleJdChange = (value: string) => {
    setJd(value);
    if (isJobUrl(value.trim())) {
      setUrlHint(value.trim());
      setJd("");
    } else {
      setUrlHint(null);
    }
  };

  if (!profile) {
    return (
      <div className="job-matcher">
        <div className="job-matcher_bg" />
        <EmptyState
          className="job-matcher_empty"
          icon={
            <span style={{ fontSize: "2.5rem" }} aria-hidden="true">
              📋
            </span>
          }
          title="No profile found"
          description="Build your profile first to match to a job."
          cta={{
            label: "Build My Profile →",
            onClick: () => navigate("/profile-builder"),
            className: "job-matcher_cta-btn",
          }}
        />
      </div>
    );
  }

  const handleAnalyze = async () => {
    if (jd.trim().length < 30) return;
    setLoading(true);
    try {
      const tailored = await tailorResume(
        profile,
        resumeText,
        jd,
        company.trim(),
      );
      setJobDescription(jd);
      setTailoredResume(tailored);
      setResult(tailored);

      const entry: JobEntry = {
        id: Date.now().toString(),
        company: company.trim(),
        jdSnippet: jd.slice(0, 160).trim(),
        fullJD: jd,
        matchScore: tailored.matchScore,
        matchedSkills: tailored.matchedSkills,
        suggestedSkills: tailored.suggestedSkills,
        suggestions: tailored.suggestions,
        tailoredSummary: tailored.tailoredSummary,
        createdAt: new Date().toISOString(),
      };
      addJobEntry(entry);
      if (user) saveJobEntry(user.id, entry);
    } catch (err) {
      console.error("Analysis failed:", err);
      toastError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setJd("");
    setCompany("");
  };

  return (
    <div className="job-matcher">
      <div className="job-matcher_bg" />
      <div className="job-matcher_layout">
        {/* History sidebar - desktop */}
        {recentHistory.length > 0 && (
          <aside
            className={`job-matcher_history-sidebar ${historySidebarOpen ? "job-matcher_history-sidebar-open" : ""}`}
          >
            <button
              className="job-matcher_history-sidebar-toggle"
              onClick={() => setHistorySidebarOpen((v) => !v)}
              aria-expanded={historySidebarOpen}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Recent Matches
              <span className="job-matcher_history-sidebar-count">
                {recentHistory.length}
              </span>
            </button>
            <div className="job-matcher_history-sidebar-list">
              {recentHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="job-matcher_history-sidebar-item"
                >
                  <div className="job-matcher_history-sidebar-company">
                    {entry.company || "Unknown Company"}
                  </div>
                  <div className="job-matcher_history-sidebar-meta">
                    <span className="job-matcher_history-sidebar-score">
                      {entry.matchScore}%
                    </span>
                    <span className="job-matcher_history-sidebar-date">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="job-matcher_history-sidebar-snippet">
                    {entry.jdSnippet.slice(0, 80)}
                    {entry.jdSnippet.length > 80 ? "…" : ""}
                  </p>
                </div>
              ))}
              <button
                className="job-matcher_history-sidebar-view-all"
                onClick={() => navigate("/job-history")}
              >
                View all history →
              </button>
            </div>
          </aside>
        )}

        <div className="job-matcher_container">
          <div className="job-matcher_header">
            <div className="job-matcher_header-badge">Job Match</div>
            <h1 className="job-matcher_title">Tailor Your Resume to a Job</h1>
            <p className="job-matcher_subtitle">
              Paste the full job description and we'll identify exactly what to
              change in your resume to maximise your match.
            </p>
          </div>

          {!result ? (
            <div className="job-matcher_card">
              {/* Company field */}
              <div className="job-matcher_company-row">
                <label className="job-matcher_label job-matcher_label-sm">
                  Company Name
                  <span className="job-matcher_label-hint">Optional</span>
                </label>
                <input
                  className="job-matcher_company-input"
                  type="text"
                  placeholder="e.g. Google, Stripe, Airbnb…"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="job-matcher_jd-label-row">
                <label className="job-matcher_label">
                  Job Description
                  <span className="job-matcher_label-hint">
                    Paste the full JD for best results
                  </span>
                </label>
                {/* Clipboard paste helper */}
                {!jd && (
                  <button
                    className="job-matcher_paste-btn"
                    onClick={handlePasteFromClipboard}
                    disabled={pasteLoading}
                    type="button"
                  >
                    {pasteLoading ? (
                      <Spinner size="xs" />
                    ) : (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    )}
                    Paste from clipboard
                  </button>
                )}
              </div>
              <textarea
                className="job-matcher_textarea"
                placeholder="Paste the full job description here - role overview, responsibilities, required skills, nice-to-haves…"
                value={jd}
                onChange={(e) => handleJdChange(e.target.value)}
                rows={13}
              />
              {urlHint && (
                <div className="job-matcher_url-hint">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    Looks like a job posting URL - we can't extract it
                    automatically in the browser. Visit the link, copy the full
                    job description text, then paste it here.
                  </span>
                  <a
                    href={urlHint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="job-matcher_url-hint-link"
                  >
                    Open link →
                  </a>
                  <button
                    className="job-matcher_url-hint-dismiss"
                    onClick={() => setUrlHint(null)}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="job-matcher_char-count">
                {jd.length} characters
                {jd.length > 0 &&
                  jd.length < 30 &&
                  " (add more for better results)"}
              </div>
              <button
                className="job-matcher_analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || jd.trim().length < 30}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" /> Analyzing your resume…
                  </>
                ) : (
                  <>Analyze & Get Suggestions →</>
                )}
              </button>
            </div>
          ) : (
            <motion.div
              className="job-matcher_results"
              variants={resultsStagger}
              initial="hidden"
              animate="visible"
            >
              {/* Local analysis notice */}
              {result.usedAI === false && (
                <motion.div
                  className="job-matcher_local-notice"
                  variants={resultSection}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    Using local keyword analysis - AI unavailable.{" "}
                    <strong>Results may be less precise.</strong> Add a valid{" "}
                    <code>VITE_GEMINI_API_KEY</code> to .env.local for
                    AI-powered analysis.
                  </span>
                  {API_KEY && (
                    <button
                      className="job-matcher_local-retry"
                      onClick={handleAnalyze}
                      disabled={loading}
                    >
                      Retry with AI →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Score card */}
              <motion.div
                className="job-matcher_score-card"
                variants={resultSection}
              >
                <div className="job-matcher_score-ring">
                  <svg viewBox="0 0 80 80" className="job-matcher_score-svg">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="job-matcher_score-track"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="job-matcher_score-arc"
                      strokeDasharray={`${(2 * Math.PI * 34 * result.matchScore) / 100} ${2 * Math.PI * 34}`}
                    />
                  </svg>
                  <div className="job-matcher_score-value">
                    {result.matchScore}%
                  </div>
                </div>
                <div className="job-matcher_score-info">
                  <h3 className="job-matcher_score-label">
                    Resume Match Score
                    {result.company && (
                      <span className="job-matcher_score-company">
                        {" "}
                        · {result.company}
                      </span>
                    )}
                  </h3>
                  <p className="job-matcher_score-desc">
                    {result.matchScore >= 80
                      ? "Strong match! Your resume aligns well with this role."
                      : result.matchScore >= 60
                        ? "Good match. Apply the suggestions below to strengthen it further."
                        : "Moderate match. The changes below will significantly improve your chances."}
                  </p>
                </div>
              </motion.div>

              {/* What to change in your resume */}
              <motion.div
                className="job-matcher_section"
                variants={resultSection}
              >
                <h3 className="job-matcher_section-title">
                  <span className="job-matcher_section-icon job-matcher_section-icon-info">
                    ✎
                  </span>
                  Suggested Changes to Your Resume
                </h3>
                {result.suggestions.length > 0 ? (
                  <div className="job-matcher_suggestions-list">
                    {result.suggestions.map((s, i) => (
                      <motion.div
                        key={i}
                        className={`job-matcher_suggestion job-matcher_suggestion-${s.priority}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: DURATION.base,
                          delay: 0.15 + i * 0.08,
                          ease: EASE_SPRING,
                        }}
                      >
                        <div className="job-matcher_suggestion-header">
                          <span className="job-matcher_suggestion-section">
                            {s.section}
                          </span>
                          <Badge
                            variant={
                              s.priority === "high"
                                ? "success"
                                : s.priority === "medium"
                                  ? "warning"
                                  : "muted"
                            }
                          >
                            {s.priority} priority
                          </Badge>
                        </div>
                        <p className="job-matcher_suggestion-text">
                          {s.suggestion}
                        </p>
                        {s.keywords.length > 0 && (
                          <div className="job-matcher_suggestion-kws">
                            {s.keywords.map((k) => (
                              <span key={k} className="job-matcher_kw-tag">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="job-matcher_section-empty">
                    Your resume already covers the key areas in this job
                    description.
                  </p>
                )}
              </motion.div>

              {/* Matched skills */}
              <motion.div
                className="job-matcher_section"
                variants={resultSection}
              >
                <h3 className="job-matcher_section-title">
                  <span className="job-matcher_section-icon job-matcher_section-icon-success">
                    ✓
                  </span>
                  Already in Your Resume
                  {result.matchedSkills.length > 0 && (
                    <span className="job-matcher_section-count">
                      {result.matchedSkills.length}
                    </span>
                  )}
                </h3>
                {result.matchedSkills.length > 0 ? (
                  <div className="job-matcher_tags">
                    {result.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="job-matcher_tag job-matcher_tag-matched"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="job-matcher_section-empty">
                    No direct skill matches detected - try adding more specific
                    skills to your profile.
                  </p>
                )}
              </motion.div>

              {/* Suggested skills */}
              <motion.div
                className="job-matcher_section"
                variants={resultSection}
              >
                <h3 className="job-matcher_section-title">
                  <span className="job-matcher_section-icon job-matcher_section-icon-warning">
                    +
                  </span>
                  Missing Skills to Add
                  {result.suggestedSkills.length > 0 && (
                    <span className="job-matcher_section-count">
                      {result.suggestedSkills.length}
                    </span>
                  )}
                </h3>
                {result.suggestedSkills.length > 0 ? (
                  <div className="job-matcher_tags">
                    {result.suggestedSkills.map((s) => (
                      <span
                        key={s}
                        className="job-matcher_tag job-matcher_tag-suggested"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="job-matcher_section-empty">
                    Your skill set appears to cover what this role requires.
                  </p>
                )}
              </motion.div>

              {/* Tailored summary */}
              <motion.div
                className="job-matcher_section"
                variants={resultSection}
              >
                <h3 className="job-matcher_section-title">
                  <span className="job-matcher_section-icon job-matcher_section-icon-info">
                    ✦
                  </span>
                  Suggested Summary Update
                </h3>
                <div className="job-matcher_summary-preview">
                  {result.tailoredSummary ||
                    "Add a professional summary to your profile for this section."}
                </div>
              </motion.div>

              <motion.div
                className="job-matcher_result-actions"
                variants={resultSection}
              >
                <button className="job-matcher_retry-btn" onClick={resetForm}>
                  ← Analyze Another Job
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="job-matcher_history-btn"
                    onClick={() => navigate("/job-history")}
                  >
                    View History
                  </button>
                  <button
                    className="job-matcher_view-btn"
                    onClick={() => navigate("/dashboard")}
                  >
                    View Resume →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
