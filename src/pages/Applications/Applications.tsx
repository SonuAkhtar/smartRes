import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  MoreVertical,
  Briefcase,
} from "lucide-react";
import EmptyState from "../../components/EmptyState/EmptyState";
import Modal from "../../components/Modal/Modal";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { useToast } from "../../context/ToastContext";
import { saveApplication, removeApplication } from "../../lib/db";
import type {
  JobApplication,
  ApplicationStatus,
  StatusEvent,
} from "../../types";
import "./Applications.css";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; order: number }
> = {
  saved: { label: "Saved", order: 0 },
  applied: { label: "Applied", order: 1 },
  interview: { label: "Interview", order: 2 },
  offer: { label: "Offer", order: 3 },
  rejected: { label: "Rejected", order: 4 },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[];
const PAGE_SIZE = 8;

const NAVY = "#303c6c";
const ORANGE = "#b3542d";
const RED = "#c0392b";

type SortKey = "company" | "role" | "location" | "status" | "updatedAt";
type SortDir = "asc" | "desc";
type StatusModalMode = "add" | "edit" | "deleteRow" | null;
type AppModalState =
  | { type: "add" }
  | { type: "edit"; id: string }
  | { type: "delete"; id: string }
  | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getHistory(app: JobApplication): StatusEvent[] {
  return app.statusHistory ?? [{ status: app.status, date: app.createdAt }];
}

function finalEvent(history: StatusEvent[]): StatusEvent | null {
  if (!history.length) return null;
  return history.reduce((best, e) => {
    const bt = new Date(best.date).getTime();
    const et = new Date(e.date).getTime();
    if (et > bt) return e;
    if (
      et === bt &&
      STATUS_CONFIG[e.status].order > STATUS_CONFIG[best.status].order
    )
      return e;
    return best;
  });
}

function finalStatus(history: StatusEvent[]): ApplicationStatus {
  return finalEvent(history)?.status ?? "saved";
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeAll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", closeAll, true);
    window.addEventListener("resize", closeAll);
    return () => {
      document.removeEventListener("click", closeAll);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", closeAll, true);
      window.removeEventListener("resize", closeAll);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.right - 160 });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        className="applications_kebab"
        onClick={toggle}
        aria-label="Row actions"
        aria-haspopup="menu"
      >
        <MoreVertical size={18} />
      </button>
      {open &&
        createPortal(
          <div
            className="applications_menu"
            style={{ top: pos.top, left: pos.left }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="applications_menu-item"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil size={15} />
              Edit
            </button>
            <button
              className="applications_menu-item applications_menu-item-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function NestedDetails({
  app,
  onChange,
}: {
  app: JobApplication;
  onChange: (history: StatusEvent[]) => void;
}) {
  const history = getHistory(app);
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<StatusModalMode>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<ApplicationStatus>("saved");
  const [formDate, setFormDate] = useState(today);
  const [formNote, setFormNote] = useState("");

  const close = () => {
    setMode(null);
    setTargetIndex(null);
  };

  const openAdd = () => {
    const used = new Set(history.map((e) => e.status));
    const next = ALL_STATUSES.find((s) => !used.has(s)) ?? "applied";
    setFormStatus(next);
    setFormDate(today);
    setFormNote("");
    setTargetIndex(null);
    setMode("add");
  };

  const openEdit = (i: number) => {
    const ev = history[i];
    setFormStatus(ev.status);
    setFormDate(ev.date.slice(0, 10));
    setFormNote(ev.note ?? "");
    setTargetIndex(i);
    setMode("edit");
  };

  const submitForm = () => {
    const iso = formDate
      ? new Date(`${formDate}T00:00:00`).toISOString()
      : new Date().toISOString();
    const ev: StatusEvent = {
      status: formStatus,
      date: iso,
      note: formNote.trim() || undefined,
    };
    if (mode === "add") {
      onChange([...history, ev]);
    } else if (mode === "edit" && targetIndex !== null) {
      onChange(history.map((e, i) => (i === targetIndex ? ev : e)));
    }
    close();
  };

  const confirmDeleteRow = () => {
    if (targetIndex !== null && history.length > 1) {
      onChange(history.filter((_, i) => i !== targetIndex));
    }
    close();
  };

  const formOpen = mode === "add" || mode === "edit";

  return (
    <div className="applications_nested">
      <div className="applications_nested-head">
        <span className="applications_nested-title">Status Timeline</span>
        <button className="applications_timeline-add" onClick={openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          Add status
        </button>
      </div>

      <div className="applications_timeline-wrap">
        <table className="applications_timeline">
          <thead>
            <tr>
              <th>Status</th>
              <th>Date</th>
              <th>Note</th>
              <th className="applications_timeline-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((ev, i) => (
              <tr key={i}>
                <td data-label="Status">
                  <span
                    className={`applications_status-tag applications_status-${ev.status}`}
                  >
                    <span className="applications_status-dot" aria-hidden="true" />
                    {STATUS_CONFIG[ev.status].label}
                  </span>
                </td>
                <td data-label="Date">{formatDate(ev.date)}</td>
                <td data-label="Note">
                  {ev.note ? (
                    <span>{ev.note}</span>
                  ) : (
                    <span className="applications_note-empty">-</span>
                  )}
                </td>
                <td data-label="Actions">
                  <div className="applications_timeline-actions">
                    <button
                      className="applications_icon-btn"
                      onClick={() => openEdit(i)}
                      aria-label="Edit status"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="applications_icon-btn applications_icon-btn-danger"
                      onClick={() => {
                        setTargetIndex(i);
                        setMode("deleteRow");
                      }}
                      disabled={history.length <= 1}
                      aria-label="Delete status"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        title={mode === "edit" ? "Edit Status" : "Add Status"}
        icon={
          mode === "edit" ? (
            <Pencil size={18} color={NAVY} />
          ) : (
            <Plus size={18} color={NAVY} />
          )
        }
        onClose={close}
        footer={
          <>
            <button className="modal_btn modal_btn-cancel" onClick={close}>
              Cancel
            </button>
            <button className="modal_btn modal_btn-primary" onClick={submitForm}>
              {mode === "edit" ? "Save" : "Add"}
            </button>
          </>
        }
      >
        <div className="applications_modal-form">
          <label className="applications_modal-field">
            <span className="applications_modal-label">Status</span>
            <select
              className="applications_modal-input"
              value={formStatus}
              onChange={(e) =>
                setFormStatus(e.target.value as ApplicationStatus)
              }
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="applications_modal-field">
            <span className="applications_modal-label">Date</span>
            <input
              type="date"
              className="applications_modal-input"
              value={formDate}
              max={today}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </label>
          <label className="applications_modal-field">
            <span className="applications_modal-label">Note</span>
            <textarea
              className="applications_modal-input"
              rows={3}
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Optional note"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={mode === "deleteRow"}
        title="Delete status"
        icon={<Trash2 size={18} color={RED} />}
        tone="danger"
        onClose={close}
        footer={
          <>
            <button className="modal_btn modal_btn-cancel" onClick={close}>
              Cancel
            </button>
            <button
              className="modal_btn modal_btn-danger"
              onClick={confirmDeleteRow}
            >
              Delete
            </button>
          </>
        }
      >
        {targetIndex !== null && (
          <div className="applications_modal-confirm">
            <p className="applications_modal-confirm-lead">
              Remove the "{STATUS_CONFIG[history[targetIndex].status].label}"
              status?
            </p>
            <p className="applications_modal-confirm-sub">
              This entry will be removed from the timeline.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const { applications, addApplication, updateApplication, deleteApplication } =
    useResume();
  const navigate = useNavigate();
  const { info } = useToast();
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [appModal, setAppModal] = useState<AppModalState>(null);
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formLocation, setFormLocation] = useState("");

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  const mainNote = (app: JobApplication) =>
    finalEvent(getHistory(app))?.note || app.notes || "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      const eventNotes = getHistory(a)
        .map((e) => e.note ?? "")
        .join(" ");
      return [a.company, a.role, a.location ?? "", a.notes, eventNotes].some(
        (v) => v.toLowerCase().includes(q),
      );
    });
  }, [applications, search, statusFilter]);

  const sorted = useMemo(() => {
    const val = (a: JobApplication): string | number => {
      switch (sortKey) {
        case "status":
          return STATUS_CONFIG[a.status].order;
        case "updatedAt":
          return new Date(a.updatedAt).getTime();
        case "company":
          return a.company.toLowerCase();
        case "role":
          return a.role.toLowerCase();
        case "location":
          return (a.location ?? "").toLowerCase();
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "updatedAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  const openAddApp = () => {
    setFormCompany("");
    setFormRole("");
    setFormLocation("");
    setAppModal({ type: "add" });
  };

  const openEditApp = (app: JobApplication) => {
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormLocation(app.location ?? "");
    setAppModal({ type: "edit", id: app.id });
  };

  const submitApp = () => {
    if (!appModal) return;
    const company = formCompany.trim();
    const role = formRole.trim();
    const location = formLocation.trim();
    if (appModal.type === "add") {
      if (!company && !role) return;
      const now = new Date().toISOString();
      const app: JobApplication = {
        id: Date.now().toString(),
        company,
        role,
        location,
        jdSnippet: "",
        status: "saved",
        notes: "",
        statusHistory: [{ status: "saved", date: now }],
        createdAt: now,
        updatedAt: now,
      };
      addApplication(app);
      if (user) saveApplication(user.id, app);
    } else if (appModal.type === "edit") {
      const app = applications.find((a) => a.id === appModal.id);
      if (!app) return;
      const patch = { company, role, location };
      updateApplication(appModal.id, patch);
      if (user)
        saveApplication(user.id, {
          ...app,
          ...patch,
          updatedAt: new Date().toISOString(),
        });
    }
    setAppModal(null);
  };

  const handleHistoryChange = (id: string, statusHistory: StatusEvent[]) => {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    const status = finalStatus(statusHistory);
    const now = new Date().toISOString();
    updateApplication(id, { statusHistory, status });
    if (user)
      saveApplication(user.id, {
        ...app,
        statusHistory,
        status,
        updatedAt: now,
      });
  };

  const handleDelete = (id: string) => {
    const deleted = applications.find((a) => a.id === id);
    if (!deleted) return;
    deleteApplication(id);
    setExpandedId((cur) => (cur === id ? null : cur));
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

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k)
      return (
        <ChevronsUpDown className="applications_sort-ico" size={12} aria-hidden="true" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="applications_sort-ico is-active" size={12} aria-hidden="true" />
    ) : (
      <ChevronDown className="applications_sort-ico is-active" size={12} aria-hidden="true" />
    );
  };

  const th = (label: string, k: SortKey) => (
    <th>
      <button className="applications_th-btn" onClick={() => toggleSort(k)}>
        {label}
        {sortIcon(k)}
      </button>
    </th>
  );

  const deleteTarget =
    appModal?.type === "delete"
      ? applications.find((a) => a.id === appModal.id)
      : null;

  return (
    <div className="applications">
      <div className="applications_bg" />
      <div className="applications_container">
        <div className="applications_header">
          <div>
            <h1 className="applications_title">Application Tracker</h1>
            <p className="applications_subtitle">
              {applications.length > 0
                ? `${applications.length} application${applications.length !== 1 ? "s" : ""} tracked`
                : "Track every job you apply to"}
            </p>
          </div>
          <button className="applications_add-btn" onClick={openAddApp}>
            <Plus size={16} strokeWidth={2.5} />
            Add Application
          </button>
        </div>

        {applications.length > 0 && (
          <div className="applications_stats">
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
          </div>
        )}

        {applications.length === 0 ? (
          <EmptyState
            className="applications_empty"
            icon={
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
                <rect x="8" y="12" width="44" height="38" rx="4" stroke="var(--color-border)" strokeWidth="2" />
                <path d="M20 12V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" stroke="var(--color-border)" strokeWidth="2" />
                <path d="M20 28h20M20 35h12" stroke="var(--color-border-dark)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="47" cy="47" r="10" fill="var(--color-surface-raised)" stroke="var(--color-border)" strokeWidth="2" />
                <path d="M43 47h8M47 43v8" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            title="No applications yet"
            description="Add applications manually or track them directly from your Job Match History."
            cta={{
              label: "Add Your First Application",
              onClick: openAddApp,
              className: "applications_add-btn applications_add-btn-lg",
            }}
            secondaryCta={{
              label: "View Job History",
              onClick: () => navigate("/job-history"),
              className: "applications_secondary-btn",
            }}
          />
        ) : (
          <>
            <div className="applications_panel">
              <div className="applications_toolbar">
                <div className="applications_search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search company, role, location, notes"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  className="applications_filter-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ApplicationStatus | "all");
                    setPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses ({applications.length})</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label} ({counts[s]})
                    </option>
                  ))}
                </select>
              </div>

              {sorted.length === 0 ? (
                <div className="applications_no-results">
                  No applications match your search.
                </div>
              ) : (
                <div className="applications_table-wrap">
                  <table className="applications_table">
                    <thead>
                      <tr>
                        {th("Company", "company")}
                        {th("Role", "role")}
                        {th("Location", "location")}
                        {th("Status", "status")}
                        <th>Note</th>
                        {th("Last Updated", "updatedAt")}
                        <th className="applications_actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((app) => {
                        const open = expandedId === app.id;
                        const note = mainNote(app);
                        return (
                          <Fragment key={app.id}>
                            <tr
                              className={`applications_row ${open ? "is-open" : ""}`}
                              onClick={() =>
                                setExpandedId((cur) =>
                                  cur === app.id ? null : app.id,
                                )
                              }
                            >
                              <td data-label="Company" className="applications_cell-company">
                                {app.company || "Unknown Company"}
                              </td>
                              <td data-label="Role" className="applications_cell-role">
                                {app.role || "-"}
                              </td>
                              <td data-label="Location" className="applications_cell-location">
                                {app.location || "-"}
                              </td>
                              <td data-label="Status" className="applications_cell-status">
                                <span
                                  className={`applications_status-tag applications_status-${app.status}`}
                                >
                                  <span
                                    className="applications_status-dot"
                                    aria-hidden="true"
                                  />
                                  {STATUS_CONFIG[app.status].label}
                                </span>
                              </td>
                              <td data-label="Note" className="applications_cell-note">
                                {note ? (
                                  <span className="applications_note-snippet">
                                    {note}
                                  </span>
                                ) : (
                                  <span className="applications_note-empty">-</span>
                                )}
                              </td>
                              <td data-label="Last Updated" className="applications_cell-updated">
                                {formatDate(app.updatedAt)}
                              </td>
                              <td
                                data-label="Actions"
                                className="applications_cell-actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <RowActions
                                  onEdit={() => openEditApp(app)}
                                  onDelete={() =>
                                    setAppModal({ type: "delete", id: app.id })
                                  }
                                />
                              </td>
                            </tr>
                            <tr className="applications_nested-row">
                              <td colSpan={7} className="applications_nested-cell">
                                <div
                                  className={`applications_collapsible ${open ? "is-open" : ""}`}
                                >
                                  <div className="applications_collapsible-inner">
                                    <NestedDetails
                                      app={app}
                                      onChange={(history) =>
                                        handleHistoryChange(app.id, history)
                                      }
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="applications_pagination">
                <button
                  className="applications_page-nav"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`applications_page-btn ${p === currentPage ? "is-active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="applications_page-nav"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={appModal?.type === "add" || appModal?.type === "edit"}
        title={appModal?.type === "edit" ? "Edit Application" : "Add Application"}
        icon={
          appModal?.type === "edit" ? (
            <Pencil size={18} color={NAVY} />
          ) : (
            <Briefcase size={18} color={ORANGE} />
          )
        }
        onClose={() => setAppModal(null)}
        footer={
          <>
            <button
              className="modal_btn modal_btn-cancel"
              onClick={() => setAppModal(null)}
            >
              Cancel
            </button>
            <button
              className={`modal_btn ${appModal?.type === "edit" ? "modal_btn-primary" : "modal_btn-accent"}`}
              onClick={submitApp}
            >
              {appModal?.type === "edit" ? "Save" : "Add"}
            </button>
          </>
        }
      >
        <div className="applications_modal-form">
          <label className="applications_modal-field">
            <span className="applications_modal-label">Company</span>
            <input
              className="applications_modal-input"
              type="text"
              placeholder="Company name"
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              autoFocus
            />
          </label>
          <label className="applications_modal-field">
            <span className="applications_modal-label">Role</span>
            <input
              className="applications_modal-input"
              type="text"
              placeholder="Role / Job title"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            />
          </label>
          <label className="applications_modal-field">
            <span className="applications_modal-label">Location</span>
            <input
              className="applications_modal-input"
              type="text"
              placeholder="Location"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={appModal?.type === "delete"}
        title="Delete application"
        icon={<Trash2 size={18} color={RED} />}
        tone="danger"
        onClose={() => setAppModal(null)}
        footer={
          <>
            <button
              className="modal_btn modal_btn-cancel"
              onClick={() => setAppModal(null)}
            >
              Cancel
            </button>
            <button
              className="modal_btn modal_btn-danger"
              onClick={() => {
                if (appModal?.type === "delete") handleDelete(appModal.id);
                setAppModal(null);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="applications_modal-confirm">
            <p className="applications_modal-confirm-lead">
              Delete "{deleteTarget.company || "this application"}"?
            </p>
            <p className="applications_modal-confirm-sub">
              The application and its full status timeline will be removed. You
              can undo this right after.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
