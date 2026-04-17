import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { saveProfile } from "../../lib/db";
import { EASE_SPRING, DURATION } from "../../lib/motion";
import type { UserProfile, Experience, Education } from "../../types";
import EmptyState from "../../components/EmptyState/EmptyState";
import { categorizeSkill } from "../../utils/skills";
import "./Profile.css";

type FieldKey = string;
interface ExpDraft {
  title: string;
  company: string;
  duration: string;
  description: string;
}
interface EduDraft {
  degree: string;
  school: string;
  year: string;
}

const emptyExp: ExpDraft = {
  title: "",
  company: "",
  duration: "",
  description: "",
};
const emptyEdu: EduDraft = { degree: "", school: "", year: "" };

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, delay: i * 0.07, ease: EASE_SPRING },
  }),
};

function useAutoHeight() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setHeight(entries[0]?.contentRect.height ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { innerRef, height };
}

export default function Profile() {
  const { user } = useAuth();
  const { profile, setProfile } = useResume();
  const navigate = useNavigate();

  const [local, setLocal] = useState<UserProfile | null>(profile);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [editVal, setEditVal] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [editingExpId, setEditingExpId] = useState<string | "new" | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | "new" | null>(null);
  const [expDraft, setExpDraft] = useState<ExpDraft>(emptyExp);
  const [eduDraft, setEduDraft] = useState<EduDraft>(emptyEdu);

  if (!local) {
    return (
      <div className="profile">
        <div className="profile_container">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EmptyState
              className="profile_empty"
              icon={
                <svg
                  width="52"
                  height="52"
                  viewBox="0 0 52 52"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="26"
                    cy="18"
                    r="10"
                    stroke="#116466"
                    strokeWidth="2"
                    strokeOpacity="0.6"
                  />
                  <path
                    d="M6 46c0-11.046 8.954-20 20-20s20 8.954 20 20"
                    stroke="#116466"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity="0.6"
                  />
                  <circle cx="26" cy="18" r="6" fill="rgba(17,100,102,0.1)" />
                </svg>
              }
              title="No profile yet"
              description="Build your profile first to view and edit it here."
              cta={{
                label: "Build My Profile →",
                onClick: () => navigate("/profile-builder"),
                className: "profile_btn profile_btn-primary",
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  const completenessFields = [
    !!local.name?.trim(),
    !!local.email?.trim(),
    !!local.phone?.trim(),
    !!local.location?.trim(),
    !!local.title?.trim(),
    !!local.yearsOfExperience,
    local.skills.length > 0,
    !!local.summary?.trim(),
    local.experiences?.length > 0,
    local.educations?.length > 0,
  ];
  const completenessScore = completenessFields.filter(Boolean).length;
  const completenessTotal = completenessFields.length;
  const completenessPct = (completenessScore / completenessTotal) * 100;

  const SKILL_CATEGORIES: Record<string, string[]> = {
    Technical: [
      "react",
      "vue",
      "angular",
      "next",
      "typescript",
      "javascript",
      "python",
      "java",
      "kotlin",
      "swift",
      "go",
      "rust",
      "c++",
      "c#",
      "ruby",
      "php",
      "html",
      "css",
      "sql",
      "graphql",
      "rest",
      "grpc",
      "node",
      "express",
      "django",
      "fastapi",
      "spring",
      "docker",
      "kubernetes",
      "aws",
      "gcp",
      "azure",
      "terraform",
      "ci/cd",
      "git",
      "linux",
      "redis",
      "postgresql",
      "mongodb",
      "mysql",
      "tensorflow",
      "pytorch",
      "scikit",
      "pandas",
      "numpy",
      "spark",
    ],
    Tools: [
      "figma",
      "sketch",
      "xd",
      "jira",
      "confluence",
      "slack",
      "notion",
      "trello",
      "github",
      "gitlab",
      "bitbucket",
      "vscode",
      "intellij",
      "xcode",
      "postman",
      "tableau",
      "excel",
      "powerpoint",
      "word",
      "hubspot",
      "salesforce",
      "zendesk",
      "datadog",
      "grafana",
      "sentry",
    ],
    Soft: [
      "communication",
      "leadership",
      "teamwork",
      "collaboration",
      "problem solving",
      "critical thinking",
      "time management",
      "adaptability",
      "project management",
      "stakeholder management",
      "agile",
      "scrum",
      "mentoring",
      "public speaking",
      "negotiation",
      "creativity",
      "analytical",
      "organised",
      "organized",
    ],
  };

  const categoriseSkills = (skills: string[]) => {
    const categories: Record<string, string[]> = {
      Technical: [],
      Tools: [],
      Soft: [],
      Other: [],
    };
    for (const skill of skills) {
      const lower = skill.toLowerCase();
      if (SKILL_CATEGORIES.Technical.some((k) => lower.includes(k)))
        categories.Technical.push(skill);
      else if (SKILL_CATEGORIES.Tools.some((k) => lower.includes(k)))
        categories.Tools.push(skill);
      else if (SKILL_CATEGORIES.Soft.some((k) => lower.includes(k)))
        categories.Soft.push(skill);
      else categories.Other.push(skill);
    }
    return categories;
  };
  const skillGroups =
    local.skills.length >= 10 ? categoriseSkills(local.skills) : null;

  const persist = (updated: UserProfile) => {
    setLocal(updated);
    setProfile(updated);
    if (user) saveProfile(user.id, updated).catch((err) => console.error('saveProfile:', err));
  };

  const save = (updater: (p: UserProfile) => UserProfile) => {
    persist(updater(local));
    setEditing(null);
  };

  const clearField = (updater: (p: UserProfile) => UserProfile) =>
    persist(updater(local));

  const startEdit = (key: FieldKey, val: string) => {
    setEditing(key);
    setEditVal(val);
    setTimeout(() => editRef.current?.focus(), 30);
  };

  const cancelEdit = () => setEditing(null);

  const onEditKeyDown = (e: KeyboardEvent, onSave: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
    if (e.key === "Escape") cancelEdit();
  };

  const addSkill = () => {
    const s = newSkill.trim();
    const isDup = local.skills.some(
      (sk) => sk.toLowerCase() === s.toLowerCase(),
    );
    if (s && !isDup) save((p) => ({ ...p, skills: [...p.skills, s] }));
    setNewSkill("");
    setAddingSkill(false);
  };

  const removeSkill = (skill: string) =>
    save((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));

  const startEditExp = (exp: Experience | null) => {
    setEditingExpId(exp ? exp.id : "new");
    setExpDraft(
      exp
        ? {
            title: exp.title,
            company: exp.company,
            duration: exp.duration,
            description: exp.description,
          }
        : emptyExp,
    );
    setEditing(null);
    setEditingEduId(null);
  };

  const saveExp = () => {
    if (!expDraft.company.trim()) return;
    if (editingExpId === "new") {
      save((p) => ({
        ...p,
        experiences: [
          ...p.experiences,
          { id: Date.now().toString(), ...expDraft },
        ],
      }));
    } else {
      save((p) => ({
        ...p,
        experiences: p.experiences.map((e) =>
          e.id === editingExpId ? { ...e, ...expDraft } : e,
        ),
      }));
    }
    setEditingExpId(null);
    setExpDraft(emptyExp);
  };

  const deleteExp = (id: string) =>
    save((p) => ({
      ...p,
      experiences: p.experiences.filter((e) => e.id !== id),
    }));

  const startEditEdu = (edu: Education | null) => {
    setEditingEduId(edu ? edu.id : "new");
    setEduDraft(
      edu
        ? { degree: edu.degree, school: edu.school, year: edu.year }
        : emptyEdu,
    );
    setEditing(null);
    setEditingExpId(null);
  };

  const saveEdu = () => {
    if (!eduDraft.degree.trim()) return;
    if (editingEduId === "new") {
      save((p) => ({
        ...p,
        educations: [
          ...p.educations,
          { id: Date.now().toString(), ...eduDraft },
        ],
      }));
    } else {
      save((p) => ({
        ...p,
        educations: p.educations.map((e) =>
          e.id === editingEduId ? { ...e, ...eduDraft } : e,
        ),
      }));
    }
    setEditingEduId(null);
    setEduDraft(emptyEdu);
  };

  const deleteEdu = (id: string) =>
    save((p) => ({
      ...p,
      educations: p.educations.filter((e) => e.id !== id),
    }));

  const Field = ({
    label,
    fieldKey,
    value,
    type = "text",
    multiline = false,
    optional = false,
    placeholder = "",
    icon,
    onSave,
    onClear,
  }: {
    label: string;
    fieldKey: string;
    value: string;
    type?: string;
    multiline?: boolean;
    optional?: boolean;
    placeholder?: string;
    icon?: string;
    onSave: (v: string) => void;
    onClear?: () => void;
  }) => (
    <div
      className={`profile_row ${editing === fieldKey ? "profile_row-active" : ""}`}
    >
      <div className="profile_row-top">
        <span className="profile_row-label">
          {icon && <span className="profile_row-label-icon">{icon}</span>}
          {label}
        </span>
        {editing !== fieldKey && (
          <div className="profile_row-actions">
            <button
              className="profile_icon-btn"
              onClick={() => startEdit(fieldKey, value)}
              title={`Edit ${label}`}
              aria-label={`Edit ${label}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {optional && value && onClear && (
              <button
                className="profile_icon-btn profile_icon-btn-danger"
                onClick={onClear}
                title={`Clear ${label}`}
                aria-label={`Clear ${label}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {editing === fieldKey ? (
          <motion.div
            key="edit"
            className="profile_row-edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {multiline ? (
              <textarea
                ref={editRef as React.RefObject<HTMLTextAreaElement>}
                className="profile_input profile_input-textarea"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                placeholder={placeholder}
                rows={4}
                onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
              />
            ) : (
              <input
                ref={editRef as React.RefObject<HTMLInputElement>}
                className="profile_input"
                type={type}
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => onEditKeyDown(e, () => onSave(editVal))}
              />
            )}
            <div className="profile_row-edit-actions">
              <button
                className="profile_save-btn"
                onClick={() => onSave(editVal)}
              >
                Save
              </button>
              <button className="profile_cancel-btn" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <span
              className={`profile_row-value ${!value ? "profile_row-value-empty" : ""}`}
            >
              {value || `Add ${label.toLowerCase()}…`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const ExpForm = ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const { innerRef, height } = useAutoHeight();
    return (
      <motion.div
        style={{ overflow: "hidden" }}
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{
          opacity: 1,
          height,
          marginTop: 12,
          transition: { duration: DURATION.base, ease: EASE_SPRING },
        }}
        exit={{
          opacity: 0,
          height: 0,
          marginTop: 0,
          transition: { duration: DURATION.fast },
        }}
      >
        <div ref={innerRef} className="profile_entry-form">
          <div className="profile_form-grid-2">
            <div className="profile_form-field">
              <label className="profile_form-label">Job Title</label>
              <input
                className="profile_input"
                placeholder="Senior Engineer"
                value={expDraft.title}
                onChange={(e) =>
                  setExpDraft((d) => ({ ...d, title: e.target.value }))
                }
              />
            </div>
            <div className="profile_form-field">
              <label className="profile_form-label">
                Company <span className="profile_required">*</span>
              </label>
              <input
                className="profile_input"
                placeholder="Acme Corp"
                value={expDraft.company}
                onChange={(e) =>
                  setExpDraft((d) => ({ ...d, company: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="profile_form-field">
            <label className="profile_form-label">Duration</label>
            <input
              className="profile_input"
              placeholder="Jan 2022 – Present"
              value={expDraft.duration}
              onChange={(e) =>
                setExpDraft((d) => ({ ...d, duration: e.target.value }))
              }
            />
          </div>
          <div className="profile_form-field">
            <label className="profile_form-label">Description</label>
            <textarea
              className="profile_input profile_input-textarea"
              rows={3}
              placeholder="Key responsibilities and achievements…"
              value={expDraft.description}
              onChange={(e) =>
                setExpDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div className="profile_form-actions">
            <button
              className="profile_save-btn"
              onClick={onSave}
              disabled={!expDraft.company.trim()}
            >
              Save Entry
            </button>
            <button className="profile_cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const EduForm = ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const { innerRef, height } = useAutoHeight();
    return (
      <motion.div
        style={{ overflow: "hidden" }}
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{
          opacity: 1,
          height,
          marginTop: 12,
          transition: { duration: DURATION.base, ease: EASE_SPRING },
        }}
        exit={{
          opacity: 0,
          height: 0,
          marginTop: 0,
          transition: { duration: DURATION.fast },
        }}
      >
        <div ref={innerRef} className="profile_entry-form">
          <div className="profile_form-field">
            <label className="profile_form-label">
              Degree <span className="profile_required">*</span>
            </label>
            <input
              className="profile_input"
              placeholder="B.S. Computer Science"
              value={eduDraft.degree}
              onChange={(e) =>
                setEduDraft((d) => ({ ...d, degree: e.target.value }))
              }
            />
          </div>
          <div className="profile_form-grid-2">
            <div className="profile_form-field">
              <label className="profile_form-label">School / University</label>
              <input
                className="profile_input"
                placeholder="University of California"
                value={eduDraft.school}
                onChange={(e) =>
                  setEduDraft((d) => ({ ...d, school: e.target.value }))
                }
              />
            </div>
            <div className="profile_form-field">
              <label className="profile_form-label">Graduation Year</label>
              <input
                className="profile_input"
                placeholder="2022"
                value={eduDraft.year}
                onChange={(e) =>
                  setEduDraft((d) => ({ ...d, year: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="profile_form-actions">
            <button
              className="profile_save-btn"
              onClick={onSave}
              disabled={!eduDraft.degree.trim()}
            >
              Save Entry
            </button>
            <button className="profile_cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="profile">
      <div className="profile_container">
        <motion.div
          className="profile_page-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="profile_page-header-left">
            <div className="profile_avatar-large">
              {local.name
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="profile_page-title">
                {local.name || "Your Profile"}
              </h1>
              <p className="profile_page-subtitle">
                {local.title || "Click any field to edit · Auto-saves"}
              </p>
            </div>
          </div>
          <div className="profile_header-right">
            <div
              className="profile_completeness"
              title={`${completenessScore} of ${completenessTotal} fields complete`}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={completenessPct === 100 ? "#22c55e" : "#116466"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - completenessPct / 100)}`}
                  transform="rotate(-90 24 24)"
                  style={{
                    transition:
                      "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </svg>
              <div className="profile_completeness-text">
                <span className="profile_completeness-score">
                  {completenessScore}
                </span>
                <span className="profile_completeness-total">
                  /{completenessTotal}
                </span>
              </div>
            </div>
            <button
              className="profile_btn profile_btn-ghost"
              onClick={() => navigate("/profile-builder")}
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
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.87" />
              </svg>
              Rebuild from Resume
            </button>
          </div>
        </motion.div>

        <motion.section
          className="profile_card"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header">
            <div className="profile_card-icon-wrap profile_card-icon-teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="profile_card-title">Contact</h2>
              <p className="profile_card-subtitle">
                Personal &amp; contact information
              </p>
            </div>
          </div>
          <div className="profile_rows">
            <Field
              label="Full Name"
              fieldKey="name"
              value={local.name}
              onSave={(v) => save((p) => ({ ...p, name: v }))}
            />
            <Field
              label="Email"
              fieldKey="email"
              value={local.email}
              type="email"
              onSave={(v) => save((p) => ({ ...p, email: v }))}
            />
            <Field
              label="Phone"
              fieldKey="phone"
              value={local.phone}
              type="tel"
              placeholder="+1 (555) 000-0000"
              onSave={(v) => save((p) => ({ ...p, phone: v }))}
            />
            <Field
              label="Location"
              fieldKey="location"
              value={local.location}
              placeholder="San Francisco, CA"
              onSave={(v) => save((p) => ({ ...p, location: v }))}
            />
          </div>
        </motion.section>

        <motion.section
          className="profile_card"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header">
            <div className="profile_card-icon-wrap profile_card-icon-peach">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <h2 className="profile_card-title">Professional</h2>
              <p className="profile_card-subtitle">
                Your role &amp; experience level
              </p>
            </div>
          </div>
          <div className="profile_rows">
            <Field
              label="Job Title"
              fieldKey="title"
              value={local.title}
              placeholder="Senior Frontend Engineer"
              onSave={(v) => save((p) => ({ ...p, title: v }))}
            />
            <div
              className={`profile_row ${editing === "yearsOfExperience" ? "profile_row-active" : ""}`}
            >
              <div className="profile_row-top">
                <span className="profile_row-label">Years of Experience</span>
                {editing !== "yearsOfExperience" && (
                  <div className="profile_row-actions">
                    <button
                      className="profile_icon-btn"
                      onClick={() => setEditing("yearsOfExperience")}
                      title="Edit years of experience"
                      aria-label="Edit years of experience"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {editing === "yearsOfExperience" ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="profile_chips">
                      {[
                        "Less than 1 year",
                        "1–3 years",
                        "3–5 years",
                        "5–10 years",
                        "10+ years",
                      ].map((opt) => (
                        <button
                          key={opt}
                          className={`profile_chip ${local.yearsOfExperience === opt ? "profile_chip-active" : ""}`}
                          onClick={() =>
                            save((p) => ({ ...p, yearsOfExperience: opt }))
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button
                      className="profile_cancel-btn"
                      style={{ marginTop: 10 }}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <span
                      className={`profile_row-value ${!local.yearsOfExperience ? "profile_row-value-empty" : ""}`}
                    >
                      {local.yearsOfExperience || "Add experience level…"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="profile_card"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header">
            <div className="profile_card-icon-wrap profile_card-icon-rose">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="profile_card-title">Summary</h2>
              <p className="profile_card-subtitle">Your professional bio</p>
            </div>
          </div>
          <Field
            label="Professional Summary"
            fieldKey="summary"
            value={local.summary}
            multiline
            placeholder="Write a concise professional summary that highlights your key skills, experience, and goals…"
            onSave={(v) => save((p) => ({ ...p, summary: v }))}
          />
        </motion.section>

        <motion.section
          className="profile_card"
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header">
            <div className="profile_card-icon-wrap profile_card-icon-teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h2 className="profile_card-title">Skills</h2>
              <p className="profile_card-subtitle">
                {local.skills.length} skill
                {local.skills.length !== 1 ? "s" : ""} added
              </p>
            </div>
          </div>
          {skillGroups ? (
            <div className="profile_skills-grouped">
              {(Object.entries(skillGroups) as [string, string[]][])
                .filter(([, skills]) => skills.length > 0)
                .map(([group, skills]) => (
                  <div key={group} className="profile_skill-group">
                    <span className="profile_skill-group-label">{group}</span>
                    <div className="profile_skills-cloud">
                      <AnimatePresence>
                        {skills.map((skill, i) => (
                          <motion.span
                            key={skill}
                            className={`profile_skill-pill profile_skill-pill--${categorizeSkill(skill)}`}
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              transition: {
                                delay: i * 0.02,
                                type: "spring",
                                stiffness: 300,
                                damping: 24,
                              },
                            }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            layout
                          >
                            {skill}
                            <button
                              className="profile_skill-remove"
                              onClick={() => removeSkill(skill)}
                              aria-label={`Remove ${skill}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="profile_skills-cloud">
              <AnimatePresence>
                {local.skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    className={`profile_skill-pill profile_skill-pill--${categorizeSkill(skill)}`}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: {
                        delay: i * 0.03,
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                      },
                    }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    layout
                  >
                    {skill}
                    <button
                      className="profile_skill-remove"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {local.skills.length === 0 && (
                <span className="profile_row-value-empty">
                  No skills added yet
                </span>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            {addingSkill ? (
              <motion.div
                key="adding"
                className="profile_add-skill-row"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <input
                  className="profile_input profile_add-skill-input"
                  type="text"
                  placeholder="Type a skill and press Enter…"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSkill();
                    if (e.key === "Escape") {
                      setAddingSkill(false);
                      setNewSkill("");
                    }
                  }}
                  autoFocus
                />
                <button className="profile_save-btn" onClick={addSkill}>
                  Add
                </button>
                <button
                  className="profile_cancel-btn"
                  onClick={() => {
                    setAddingSkill(false);
                    setNewSkill("");
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                className="profile_add-chip-btn"
                onClick={() => setAddingSkill(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Skill
              </motion.button>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          className="profile_card"
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header profile_card-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="profile_card-icon-wrap profile_card-icon-dark">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h2 className="profile_card-title">Work Experience</h2>
                <p className="profile_card-subtitle">
                  {local.experiences.length} position
                  {local.experiences.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {!editingExpId && (
              <button
                className="profile_add-entry-btn"
                onClick={() => startEditExp(null)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ width: 12, height: 12 }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            )}
          </div>

          {local.experiences.length === 0 && !editingExpId && (
            <p className="profile_entry-empty">No work experience added yet</p>
          )}

          <div className="profile_timeline">
            <AnimatePresence>
              {local.experiences.map((exp, idx) => (
                <div key={exp.id}>
                  {editingExpId === exp.id ? (
                    <AnimatePresence>
                      <ExpForm
                        key="form"
                        onSave={saveExp}
                        onCancel={() => {
                          setEditingExpId(null);
                          setExpDraft(emptyExp);
                        }}
                      />
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      className={`profile_timeline-item ${editingExpId && editingExpId !== exp.id ? "profile_timeline-item-dimmed" : ""}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { delay: idx * 0.05 },
                      }}
                      exit={{ opacity: 0, x: -12 }}
                      layout
                    >
                      <div className="profile_timeline-dot profile_timeline-dot-teal" />
                      <div className="profile_timeline-content">
                        <div className="profile_timeline-header">
                          <div className="profile_timeline-info">
                            <span className="profile_timeline-title">
                              {exp.title || (
                                <em className="profile_row-value-empty">
                                  No title
                                </em>
                              )}
                            </span>
                            <div className="profile_timeline-meta">
                              {exp.company && (
                                <span className="profile_timeline-company">
                                  {exp.company}
                                </span>
                              )}
                              {exp.duration && (
                                <span className="profile_timeline-badge">
                                  {exp.duration}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="profile_timeline-actions">
                            <button
                              className="profile_icon-btn"
                              onClick={() => startEditExp(exp)}
                              title="Edit experience"
                              aria-label="Edit experience"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="profile_icon-btn profile_icon-btn-danger"
                              onClick={() => deleteExp(exp.id)}
                              title="Delete experience"
                              aria-label="Delete experience"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="profile_timeline-desc">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {editingExpId === "new" && (
                <ExpForm
                  key="new-form"
                  onSave={saveExp}
                  onCancel={() => {
                    setEditingExpId(null);
                    setExpDraft(emptyExp);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.section
          className="profile_card"
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header profile_card-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="profile_card-icon-wrap profile_card-icon-rose">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div>
                <h2 className="profile_card-title">Education</h2>
                <p className="profile_card-subtitle">
                  {local.educations.length} institution
                  {local.educations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {!editingEduId && (
              <button
                className="profile_add-entry-btn"
                onClick={() => startEditEdu(null)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ width: 12, height: 12 }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            )}
          </div>

          {local.educations.length === 0 && !editingEduId && (
            <p className="profile_entry-empty">No education added yet</p>
          )}

          <div className="profile_timeline">
            <AnimatePresence>
              {local.educations.map((edu, idx) => (
                <div key={edu.id}>
                  {editingEduId === edu.id ? (
                    <AnimatePresence>
                      <EduForm
                        key="form"
                        onSave={saveEdu}
                        onCancel={() => {
                          setEditingEduId(null);
                          setEduDraft(emptyEdu);
                        }}
                      />
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      className={`profile_timeline-item ${editingEduId && editingEduId !== edu.id ? "profile_timeline-item-dimmed" : ""}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { delay: idx * 0.05 },
                      }}
                      exit={{ opacity: 0, x: -12 }}
                      layout
                    >
                      <div className="profile_timeline-dot profile_timeline-dot-rose" />
                      <div className="profile_timeline-content">
                        <div className="profile_timeline-header">
                          <div className="profile_timeline-info">
                            <span className="profile_timeline-title">
                              {edu.degree}
                            </span>
                            <div className="profile_timeline-meta">
                              {edu.school && (
                                <span className="profile_timeline-company">
                                  {edu.school}
                                </span>
                              )}
                              {edu.year && (
                                <span className="profile_timeline-badge profile_timeline-badge-rose">
                                  {edu.year}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="profile_timeline-actions">
                            <button
                              className="profile_icon-btn"
                              onClick={() => startEditEdu(edu)}
                              title="Edit education"
                              aria-label="Edit education"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="profile_icon-btn profile_icon-btn-danger"
                              onClick={() => deleteEdu(edu.id)}
                              title="Delete education"
                              aria-label="Delete education"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {editingEduId === "new" && (
                <EduForm
                  key="new-form"
                  onSave={saveEdu}
                  onCancel={() => {
                    setEditingEduId(null);
                    setEduDraft(emptyEdu);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.section
          className="profile_card"
          custom={6}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile_card-header">
            <div className="profile_card-icon-wrap profile_card-icon-peach">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <h2 className="profile_card-title">Links</h2>
              <p className="profile_card-subtitle">
                Online presence &amp; portfolio
              </p>
            </div>
          </div>
          <div className="profile_rows">
            <Field
              label="LinkedIn"
              fieldKey="linkedIn"
              value={local.linkedIn}
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              optional
              onSave={(v) => save((p) => ({ ...p, linkedIn: v }))}
              onClear={() => clearField((p) => ({ ...p, linkedIn: "" }))}
            />
            <Field
              label="Portfolio / Website"
              fieldKey="portfolio"
              value={local.portfolio}
              type="url"
              placeholder="https://yoursite.com"
              optional
              onSave={(v) => save((p) => ({ ...p, portfolio: v }))}
              onClear={() => clearField((p) => ({ ...p, portfolio: "" }))}
            />
          </div>
        </motion.section>

        <motion.div
          className="profile_footer-actions"
          custom={7}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <button
            className="profile_btn profile_btn-primary"
            onClick={() => navigate("/job-matcher")}
          >
            Match to a Job →
          </button>
          <button
            className="profile_btn profile_btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            View Resume
          </button>
        </motion.div>
      </div>
    </div>
  );
}
