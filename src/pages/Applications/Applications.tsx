import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { useToast } from "../../context/ToastContext";
import { saveApplication, removeApplication } from "../../lib/db";
import { EASE_SPRING, DURATION } from "../../lib/motion";
import type { JobApplication, ApplicationStatus } from "../../types";
import "./Applications.css";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    variant: "muted" | "primary" | "warning" | "success" | "error";
    order: number;
  }
> = {
  saved: { label: "Saved", variant: "muted", order: 0 },
  applied: { label: "Applied", variant: "primary", order: 1 },
  interview: { label: "Interview", variant: "warning", order: 2 },
  offer: { label: "Offer", variant: "success", order: 3 },
  rejected: { label: "Rejected", variant: "error", order: 4 },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AppCard({
  app,
  index,
  onStatusChange,
  onNotesChange,
  onDelete,
}: {
  app: JobApplication;
  index: number;
  onStatusChange: (status: ApplicationStatus) => void;
  onNotesChange: (notes: string) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(app.notes);
  const cfg = STATUS_CONFIG[app.status];

  const handleNotesSave = () => {
    onNotesChange(notesValue);
    setEditingNotes(false);
  };

  return (
    <motion.div
      className={`app-card app-card-${app.status}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{
        duration: DURATION.slow,
        delay: index * 0.05,
        ease: EASE_SPRING,
      }}
      layout
    >
      <div className={`app-card-accent app-card-accent-${app.status}`} />

      <div className="app-card-body">
        <div className="app-card-main">
          <div className="app-card-info">
            <div className="app-card-top">
              <div>
                <h3 className="app-card-company">
                  {app.company || "Unknown Company"}
                </h3>
                <p className="app-card-role">
                  {app.role || "Role not specified"}
                </p>
              </div>
              <div className="app-card-meta-right">
                {app.matchScore !== undefined && (
                  <span className="app-card-score">
                    {app.matchScore}% match
                  </span>
                )}
                <span className="app-card-date">
                  {formatDate(app.createdAt)}
                </span>
              </div>
            </div>

            <div className="app-card-status-row">
              <div
                className="app-card-status-steps"
                style={
                  {
                    "--progress": `${(STATUS_CONFIG[app.status].order / 4) * 100}%`,
                  } as React.CSSProperties
                }
              >
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`app-status-step ${app.status === s ? "app-status-step-active" : ""} ${STATUS_CONFIG[s].order < STATUS_CONFIG[app.status].order ? "app-status-step-done" : ""}`}
                    onClick={() => onStatusChange(s)}
                    title={`Mark as ${STATUS_CONFIG[s].label}`}
                    aria-label={`Mark as ${STATUS_CONFIG[s].label}`}
                    aria-pressed={app.status === s}
                  >
                    <span className="app-status-step-dot" />
                    <span className="app-status-step-label">
                      {STATUS_CONFIG[s].label}
                    </span>
                  </button>
                ))}
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="app-card-expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: "auto",
                transition: { duration: 0.3, ease: EASE_SPRING },
              }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
            >
              <div className="app-card-expanded-inner">
                {app.jdSnippet && (
                  <div className="app-card-section">
                    <div className="app-card-section-title">
                      Job Description Snippet
                    </div>
                    <p className="app-card-snippet">{app.jdSnippet}</p>
                  </div>
                )}

                <div className="app-card-section">
                  <div className="app-card-section-title">
                    Notes
                    {!editingNotes && (
                      <button
                        className="app-notes-edit-btn"
                        onClick={() => setEditingNotes(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="app-notes-edit">
                      <textarea
                        className="app-notes-textarea"
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add notes about this application, contacts, next steps…"
                        rows={4}
                        autoFocus
                      />
                      <div className="app-notes-actions">
                        <button
                          className="app-notes-save-btn"
                          onClick={handleNotesSave}
                        >
                          Save
                        </button>
                        <button
                          className="app-notes-cancel-btn"
                          onClick={() => {
                            setNotesValue(app.notes);
                            setEditingNotes(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="app-notes-text">
                      {app.notes || (
                        <span className="app-notes-empty">
                          No notes yet - click Edit to add some.
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="app-card-actions">
          <button
            className="app-toggle-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              style={{ width: 13, height: 13 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
            {expanded ? "Hide" : "Notes & Details"}
          </button>

          {confirmDelete ? (
            <div className="app-delete-confirm">
              <span>Remove this application?</span>
              <button className="app-confirm-yes" onClick={onDelete}>
                Yes, delete
              </button>
              <button
                className="app-confirm-no"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="app-delete-btn"
              onClick={() => setConfirmDelete(true)}
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type ViewMode = "list" | "kanban";

export default function Applications() {
  const { user } = useAuth();
  const { applications, addApplication, updateApplication, deleteApplication } =
    useResume();
  const navigate = useNavigate();
  const { info } = useToast();
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("applications_view") as ViewMode | null;
    return stored === "kanban" ? "kanban" : "list";
  });

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  const handleAdd = () => {
    if (!newCompany.trim() && !newRole.trim()) return;
    const now = new Date().toISOString();
    const app: JobApplication = {
      id: Date.now().toString(),
      company: newCompany.trim(),
      role: newRole.trim(),
      jdSnippet: "",
      status: "saved",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    addApplication(app);
    if (user) saveApplication(user.id, app);
    setNewCompany("");
    setNewRole("");
    setShowAddForm(false);
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplication(id, { status });
    const updated = applications.find((a) => a.id === id);
    if (user && updated)
      saveApplication(user.id, {
        ...updated,
        status,
        updatedAt: new Date().toISOString(),
      });
  };

  const handleNotesChange = (id: string, notes: string) => {
    updateApplication(id, { notes });
    const updated = applications.find((a) => a.id === id);
    if (user && updated)
      saveApplication(user.id, {
        ...updated,
        notes,
        updatedAt: new Date().toISOString(),
      });
  };

  const handleDelete = (id: string) => {
    const deleted = applications.find((a) => a.id === id);
    if (!deleted) return;
    deleteApplication(id);
    const timer = setTimeout(() => {
      if (user) removeApplication(id);
      deleteTimers.current.delete(id);
    }, 4000);
    deleteTimers.current.set(id, timer);
    info("Application deleted", {
      undoLabel: "Undo",
      onUndo: () => {
        clearTimeout(deleteTimers.current.get(id));
        deleteTimers.current.delete(id);
        addApplication(deleted);
      },
    });
  };

  return (
    <div className="applications">
      <div className="applications_bg" />
      <div className="applications_container">
        <motion.div
          className="applications_header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="applications_title">Application Tracker</h1>
            <p className="applications_subtitle">
              {applications.length > 0
                ? `${applications.length} application${applications.length !== 1 ? "s" : ""} tracked`
                : "Track every job you apply to"}
            </p>
          </div>
          <div className="applications_header-actions">
            {applications.length > 0 && (
              <div
                className="applications_view-toggle"
                role="group"
                aria-label="View mode"
              >
                <button
                  className={`applications_view-btn ${viewMode === "list" ? "applications_view-btn-active" : ""}`}
                  onClick={() => {
                    setViewMode("list");
                    localStorage.setItem("applications_view", "list");
                  }}
                  aria-label="List view"
                  title="List view"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ width: 14, height: 14 }}
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <button
                  className={`applications_view-btn ${viewMode === "kanban" ? "applications_view-btn-active" : ""}`}
                  onClick={() => {
                    setViewMode("kanban");
                    localStorage.setItem("applications_view", "kanban");
                  }}
                  aria-label="Kanban view"
                  title="Kanban view"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ width: 14, height: 14 }}
                  >
                    <rect x="3" y="3" width="5" height="18" rx="1" />
                    <rect x="10" y="3" width="5" height="18" rx="1" />
                    <rect x="17" y="3" width="4" height="18" rx="1" />
                  </svg>
                </button>
              </div>
            )}
            <button
              className="applications_add-btn"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ width: 14, height: 14 }}
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Application
            </button>
          </div>
        </motion.div>

        {/* Summary stats */}
        {applications.length > 0 && (
          <motion.div
            className="applications_stats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            {ALL_STATUSES.map((s) => (
              <div
                key={s}
                className={`applications_stat applications_stat-${s}`}
              >
                <span className="applications_stat-count">{counts[s]}</span>
                <span className="applications_stat-label">
                  {STATUS_CONFIG[s].label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className="applications_add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: EASE_SPRING }}
            >
              <div className="applications_add-form-inner">
                <input
                  className="applications_input"
                  type="text"
                  placeholder="Company name"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  autoFocus
                />
                <input
                  className="applications_input"
                  type="text"
                  placeholder="Role / Job title"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <div className="applications_add-form-actions">
                  <button
                    className="applications_add-confirm-btn"
                    onClick={handleAdd}
                    disabled={!newCompany.trim() && !newRole.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="applications_add-cancel-btn"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        {applications.length > 0 && (
          <div className="applications_filters">
            <button
              className={`applications_filter-btn ${filterStatus === "all" ? "applications_filter-btn-active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All{" "}
              <span className="applications_filter-count">
                {applications.length}
              </span>
            </button>
            {ALL_STATUSES.map(
              (s) =>
                counts[s] > 0 && (
                  <button
                    key={s}
                    className={`applications_filter-btn applications_filter-btn-${s} ${filterStatus === s ? "applications_filter-btn-active" : ""}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    {STATUS_CONFIG[s].label}
                    <span className="applications_filter-count">
                      {counts[s]}
                    </span>
                  </button>
                ),
            )}
          </div>
        )}

        {/* Kanban board */}
        {viewMode === "kanban" && applications.length > 0 && (
          <div className="applications_kanban">
            {ALL_STATUSES.map((s) => {
              const colApps = applications.filter((a) => a.status === s);
              return (
                <div
                  key={s}
                  className={`applications_kanban-col applications_kanban-col-${s}`}
                >
                  <div className="applications_kanban-col-header">
                    <span className="applications_kanban-col-label">
                      {STATUS_CONFIG[s].label}
                    </span>
                    <span className="applications_kanban-col-count">
                      {colApps.length}
                    </span>
                  </div>
                  <div className="applications_kanban-cards">
                    <AnimatePresence>
                      {colApps.map((app) => (
                        <motion.div
                          key={app.id}
                          className={`applications_kanban-card applications_kanban-card-${s}`}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.22 }}
                        >
                          <div className="applications_kanban-card-company">
                            {app.company || "Unknown Company"}
                          </div>
                          <div className="applications_kanban-card-role">
                            {app.role || "Role not specified"}
                          </div>
                          {app.matchScore !== undefined && (
                            <div className="applications_kanban-card-score">
                              {app.matchScore}% match
                            </div>
                          )}
                          <div className="applications_kanban-card-actions">
                            {ALL_STATUSES.filter((ns) => ns !== s)
                              .slice(0, 2)
                              .map((ns) => (
                                <button
                                  key={ns}
                                  className="applications_kanban-move-btn"
                                  onClick={() => handleStatusChange(app.id, ns)}
                                  title={`Move to ${STATUS_CONFIG[ns].label}`}
                                  aria-label={`Move to ${STATUS_CONFIG[ns].label}`}
                                >
                                  → {STATUS_CONFIG[ns].label}
                                </button>
                              ))}
                            <button
                              className="applications_kanban-delete-btn"
                              onClick={() => handleDelete(app.id)}
                              aria-label="Delete application"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ width: 11, height: 11 }}
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {colApps.length === 0 && (
                      <div className="applications_kanban-empty">
                        No applications
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        {(viewMode === "list" || applications.length === 0) && (
          <AnimatePresence mode="wait">
            {applications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                <EmptyState
                  className="applications_empty"
                  icon={
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 60 60"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="8"
                        y="12"
                        width="44"
                        height="38"
                        rx="4"
                        stroke="var(--color-border)"
                        strokeWidth="2"
                      />
                      <path
                        d="M20 12V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"
                        stroke="var(--color-border)"
                        strokeWidth="2"
                      />
                      <path
                        d="M20 28h20M20 35h12"
                        stroke="var(--color-border-dark)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="47"
                        cy="47"
                        r="10"
                        fill="var(--color-surface-raised)"
                        stroke="var(--color-border)"
                        strokeWidth="2"
                      />
                      <path
                        d="M43 47h8M47 43v8"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                  title="No applications yet"
                  description="Add applications manually or track them directly from your Job Match History."
                  cta={{
                    label: "Add Your First Application",
                    onClick: () => setShowAddForm(true),
                    className: "applications_add-btn applications_add-btn-lg",
                  }}
                  secondaryCta={{
                    label: "View Job History →",
                    onClick: () => navigate("/job-history"),
                  }}
                />
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty-filter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="applications_no-results"
              >
                No applications with status "
                {STATUS_CONFIG[filterStatus as ApplicationStatus]?.label}".
              </motion.div>
            ) : (
              <motion.div key="list" className="applications_list">
                <AnimatePresence>
                  {filtered.map((app, i) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      index={i}
                      onStatusChange={(status) =>
                        handleStatusChange(app.id, status)
                      }
                      onNotesChange={(notes) =>
                        handleNotesChange(app.id, notes)
                      }
                      onDelete={() => handleDelete(app.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
