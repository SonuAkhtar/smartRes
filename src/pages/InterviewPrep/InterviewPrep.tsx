import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "../../components/Spinner/Spinner";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import { useResume } from "../../context/ResumeContext";
import { generateInterviewQuestions } from "../../lib/ai";
import { EASE_SPRING, DURATION } from "../../lib/motion";
import type { InterviewQuestion, QuestionCategory } from "../../types";
import "./InterviewPrep.css";

const CATEGORY_CONFIG: Record<
  QuestionCategory,
  {
    label: string;
    icon: string;
    variant: "primary" | "warning" | "success" | "muted";
    description: string;
  }
> = {
  behavioral: {
    label: "Behavioral",
    icon: "👥",
    variant: "primary",
    description: "Past experiences and how you handled situations",
  },
  technical: {
    label: "Technical",
    icon: "⚙️",
    variant: "warning",
    description: "Role-specific technical knowledge and skills",
  },
  situational: {
    label: "Situational",
    icon: "🎯",
    variant: "success",
    description: "Hypothetical scenarios you might face in the role",
  },
  "role-specific": {
    label: "Role-Specific",
    icon: "🏢",
    variant: "muted",
    description: "Questions tailored to this company and position",
  },
};

const ALL_CATEGORIES: QuestionCategory[] = [
  "behavioral",
  "technical",
  "situational",
  "role-specific",
];

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_SPRING },
  },
};

function QuestionCard({
  q,
  index,
  revealLabel,
}: {
  q: InterviewQuestion;
  index: number;
  revealLabel?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const cfg = CATEGORY_CONFIG[q.category];

  return (
    <motion.div
      className={`ip-question ip-question-${q.category}`}
      variants={itemVariants}
    >
      <div className="ip-question-header">
        <span className="ip-question-number">{index + 1}</span>
        <Badge variant={cfg.variant}>
          {cfg.icon} {cfg.label}
        </Badge>
      </div>
      <p className="ip-question-text">{q.question}</p>
      {q.tip && (
        <div className="ip-question-tip-area">
          <button
            className="ip-tip-toggle"
            onClick={() => setShowTip((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 13, height: 13 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {showTip ? "Hide tip" : (revealLabel ?? "Show coaching tip")}
          </button>
          <AnimatePresence>
            {showTip && (
              <motion.div
                className="ip-tip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                <p className="ip-tip-text">{q.tip}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function InterviewPrep() {
  const { jobHistory } = useResume();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const prefillEntryId = params.get("entryId");
  const prefillEntry = prefillEntryId
    ? jobHistory.find((e) => e.id === prefillEntryId)
    : null;

  const [source, setSource] = useState<"history" | "paste">(
    prefillEntry ? "history" : "paste",
  );
  const [selectedEntryId, setSelectedEntryId] = useState(
    prefillEntry?.id ?? "",
  );
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    QuestionCategory | "all"
  >("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);

  const selectedEntry = jobHistory.find((e) => e.id === selectedEntryId);

  const effectiveJD = source === "history" ? (selectedEntry?.fullJD ?? "") : jd;
  const effectiveCompany =
    source === "history" ? (selectedEntry?.company ?? "") : company;
  const effectiveRole = role;

  const canGenerate =
    effectiveJD.trim().length > 50 ||
    (source === "history" && !!selectedEntryId);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setQuestions(null);
    try {
      const qs = await generateInterviewQuestions(
        effectiveJD,
        effectiveCompany,
        effectiveRole,
      );
      setQuestions(qs);
    } finally {
      setLoading(false);
    }
  };

  const filtered = questions
    ? activeCategory === "all"
      ? questions
      : questions.filter((q) => q.category === activeCategory)
    : null;

  const counts = questions
    ? ALL_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
        acc[c] = questions.filter((q) => q.category === c).length;
        return acc;
      }, {})
    : {};

  return (
    <div className="ip">
      <div className="ip_bg" />
      <div className="ip_container">
        <motion.div
          className="ip_header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ip_header-badge">Interview Prep</div>
          <h1 className="ip_title">AI Interview Question Generator</h1>
          <p className="ip_subtitle">
            Get tailored interview questions based on the job description,
            grouped by category, with coaching tips.
          </p>
        </motion.div>

        {!questions ? (
          <motion.div
            className="ip_card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.slow,
              delay: 0.1,
              ease: EASE_SPRING,
            }}
          >
            {jobHistory.length > 0 && (
              <div
                className="ip_source-toggle"
                role="radiogroup"
                aria-label="Job description source"
              >
                <button
                  role="radio"
                  aria-checked={source === "history"}
                  className={`ip_source-btn ${source === "history" ? "ip_source-btn-active" : ""}`}
                  onClick={() => setSource("history")}
                >
                  From Job History
                </button>
                <button
                  role="radio"
                  aria-checked={source === "paste"}
                  className={`ip_source-btn ${source === "paste" ? "ip_source-btn-active" : ""}`}
                  onClick={() => setSource("paste")}
                >
                  Paste JD
                </button>
              </div>
            )}

            {source === "history" ? (
              <div className="ip_field">
                <label className="ip_label">
                  Select a job from your history
                </label>
                {jobHistory.length === 0 ? (
                  <EmptyState
                    className="ip_empty-inline"
                    icon={
                      <span style={{ fontSize: "2rem" }} aria-hidden="true">
                        📋
                      </span>
                    }
                    title="No job history yet"
                    description="Analyze a job first, then come back to generate interview prep questions."
                    cta={{
                      label: "Analyze a Job →",
                      onClick: () => navigate("/job-matcher"),
                    }}
                  />
                ) : (
                  <select
                    className="ip_select"
                    value={selectedEntryId}
                    onChange={(e) => setSelectedEntryId(e.target.value)}
                  >
                    <option value="">- Select a job -</option>
                    {jobHistory.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.company || "Unknown Company"} · {e.matchScore}% match
                        ·{" "}
                        {new Date(e.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="ip_field">
                <label className="ip_label">
                  Paste Job Description
                  <span className="ip_label-hint">
                    Full JD gives more targeted questions
                  </span>
                </label>
                <textarea
                  className="ip_textarea"
                  placeholder="Paste the full job description here…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={10}
                />
              </div>
            )}

            <div className="ip_fields-row">
              <div className="ip_field ip_field-half">
                <label className="ip_label">
                  Company <span className="ip_label-hint">Optional</span>
                </label>
                <input
                  className="ip_input"
                  type="text"
                  placeholder={
                    source === "history" && selectedEntry?.company
                      ? selectedEntry.company
                      : "e.g. Google, Stripe…"
                  }
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={source === "history" && !!selectedEntry?.company}
                />
              </div>
              <div className="ip_field ip_field-half">
                <label className="ip_label">
                  Role <span className="ip_label-hint">Optional</span>
                </label>
                <input
                  className="ip_input"
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <button
              className="ip_generate-btn"
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Generating questions…
                </>
              ) : (
                <>Generate Interview Questions →</>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="ip_results">
            <motion.div
              className="ip_results-header"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div>
                <h2 className="ip_results-title">
                  {effectiveCompany || "Interview"} Questions
                </h2>
                <p className="ip_results-subtitle">
                  {questions.length} questions across {ALL_CATEGORIES.length}{" "}
                  categories
                </p>
              </div>
              <div className="ip_results-actions">
                <button
                  className="ip_export-btn"
                  title="Copy all questions to clipboard"
                  onClick={() => {
                    const text = questions
                      .map((q, i) => `${i + 1}. [${q.category}] ${q.question}`)
                      .join("\n");
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: 14, height: 14 }}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </button>
                <button
                  className="ip_export-btn"
                  title="Download as PDF"
                  onClick={() => window.print()}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: 14, height: 14 }}
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  PDF
                </button>
                <button
                  className={`ip_practice-toggle ${practiceMode ? "ip_practice-toggle-active" : ""}`}
                  onClick={() => {
                    setPracticeMode((v) => !v);
                    setPracticeIndex(0);
                  }}
                  title={
                    practiceMode ? "Exit practice mode" : "Enter practice mode"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: 14, height: 14 }}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {practiceMode ? "Exit Practice" : "Practice Mode"}
                </button>
                <button
                  className="ip_reset-btn"
                  onClick={() => {
                    setQuestions(null);
                    setActiveCategory("all");
                    setPracticeMode(false);
                  }}
                >
                  ← New
                </button>
              </div>
            </motion.div>

            {practiceMode ? (
              <div className="ip_practice-mode">
                <div
                  className="ip_practice-progress"
                  aria-label={`Question ${practiceIndex + 1} of ${filtered?.length ?? 0}`}
                >
                  <div
                    className="ip_practice-progress-fill"
                    style={{
                      width: `${((practiceIndex + 1) / (filtered?.length ?? 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="ip_practice-counter">
                  {practiceIndex + 1} <span>of {filtered?.length ?? 0}</span>
                </div>

                <AnimatePresence mode="wait">
                  {filtered && filtered[practiceIndex] && (
                    <motion.div
                      key={`practice-${practiceIndex}`}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22 }}
                    >
                      <QuestionCard
                        q={filtered[practiceIndex]}
                        index={practiceIndex}
                        revealLabel="Reveal Tip"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="ip_practice-nav">
                  <button
                    className="ip_practice-nav-btn"
                    onClick={() => setPracticeIndex((i) => Math.max(0, i - 1))}
                    disabled={practiceIndex === 0}
                    aria-label="Previous question"
                  >
                    ← Previous
                  </button>

                  {practiceIndex < (filtered?.length ?? 0) - 1 ? (
                    <button
                      className="ip_practice-nav-btn ip_practice-nav-btn-primary"
                      onClick={() => setPracticeIndex((i) => i + 1)}
                      aria-label="Next question"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      className="ip_practice-nav-btn ip_practice-nav-btn-finish"
                      onClick={() => {
                        setPracticeMode(false);
                        setPracticeIndex(0);
                      }}
                    >
                      Finish Practice ✓
                    </button>
                  )}
                </div>

                <div className="ip_practice-category-row">
                  <span className="ip_practice-category-label">Category:</span>
                  <div className="ip_category-tabs">
                    <button
                      className={`ip_category-tab ${activeCategory === "all" ? "ip_category-tab-active" : ""}`}
                      onClick={() => {
                        setActiveCategory("all");
                        setPracticeIndex(0);
                      }}
                    >
                      All{" "}
                      <span className="ip_tab-count">{questions.length}</span>
                    </button>
                    {ALL_CATEGORIES.map(
                      (c) =>
                        counts[c] > 0 && (
                          <button
                            key={c}
                            className={`ip_category-tab ip_category-tab-${c} ${activeCategory === c ? "ip_category-tab-active" : ""}`}
                            onClick={() => {
                              setActiveCategory(c);
                              setPracticeIndex(0);
                            }}
                          >
                            {CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}
                            <span className="ip_tab-count">{counts[c]}</span>
                          </button>
                        ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  className="ip_category-tabs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <button
                    className={`ip_category-tab ${activeCategory === "all" ? "ip_category-tab-active" : ""}`}
                    onClick={() => setActiveCategory("all")}
                  >
                    All <span className="ip_tab-count">{questions.length}</span>
                  </button>
                  {ALL_CATEGORIES.map(
                    (c) =>
                      counts[c] > 0 && (
                        <button
                          key={c}
                          className={`ip_category-tab ip_category-tab-${c} ${activeCategory === c ? "ip_category-tab-active" : ""}`}
                          onClick={() => setActiveCategory(c)}
                        >
                          {CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}
                          <span className="ip_tab-count">{counts[c]}</span>
                        </button>
                      ),
                  )}
                </motion.div>

                {activeCategory !== "all" && (
                  <motion.p
                    className="ip_category-desc"
                    key={activeCategory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {CATEGORY_CONFIG[activeCategory].description}
                  </motion.p>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    className="ip_questions-list"
                    variants={staggerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filtered?.map((q, i) => (
                      <QuestionCard key={i} q={q} index={i} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
