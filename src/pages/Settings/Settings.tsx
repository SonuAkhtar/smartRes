import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useResume } from "../../context/ResumeContext";
import { useToast } from "../../context/ToastContext";
import type { ThemePreference } from "../../context/ThemeContext";
import "./Settings.css";

const THEME_OPTIONS: { value: ThemePreference; label: string; desc: string }[] =
  [
    { value: "light", label: "Light", desc: "Always use light mode" },
    { value: "dark", label: "Dark", desc: "Always use dark mode" },
    { value: "system", label: "System", desc: "Follow your device setting" },
  ];

export default function Settings() {
  const { user, logout } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const { profile, jobHistory, applications, clearData } = useResume();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Notification preferences (localStorage for now)
  const [weeklyDigest, setWeeklyDigest] = useState(
    () => localStorage.getItem("notif_weekly_digest") === "true",
  );
  const [jobMatchTips, setJobMatchTips] = useState(
    () => localStorage.getItem("notif_job_match_tips") === "true",
  );

  // Delete account confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleDigestToggle = (val: boolean) => {
    setWeeklyDigest(val);
    localStorage.setItem("notif_weekly_digest", String(val));
    success(val ? "Weekly digest enabled" : "Weekly digest disabled");
  };

  const handleTipsToggle = (val: boolean) => {
    setJobMatchTips(val);
    localStorage.setItem("notif_job_match_tips", String(val));
    success(val ? "Job match tips enabled" : "Job match tips disabled");
  };

  const handleExportData = () => {
    try {
      const data = {
        profile,
        jobHistory,
        applications,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartres-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success("Your data has been exported");
    } catch {
      error("Export failed - please try again");
    }
  };

  const handleClearLocalData = () => {
    clearData();
    success("All local data cleared");
  };

  const handleDeleteAccount = () => {
    if (deleteInput.trim().toLowerCase() !== "delete") return;
    clearData();
    logout();
    navigate("/");
    success("Account deleted. Sorry to see you go.");
  };

  return (
    <div className="settings">
      <div className="settings_bg" />
      <div className="settings_container">
        <motion.div
          className="settings_header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="settings_title">Settings</h1>
          <p className="settings_subtitle">
            Manage your account, appearance, and data preferences.
          </p>
        </motion.div>

        {/* ----- Account ----- */}
        <motion.section
          className="settings_section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <h2 className="settings_section-title">Account</h2>
          <div className="settings_section-body">
            <div className="settings_field">
              <label className="settings_label">Email address</label>
              <div className="settings_value-row">
                <span className="settings_value-text">{user?.email}</span>
                <span className="settings_badge">Read-only</span>
              </div>
            </div>

            <div className="settings_divider" />

            <div className="settings_field">
              <label className="settings_label">Display name</label>
              <div className="settings_value-row">
                <span className="settings_value-text settings_value-muted">
                  {profile?.name || user?.name || "Not set"}
                </span>
                <button
                  className="settings_link-btn"
                  onClick={() => navigate("/profile")}
                >
                  Edit in Profile →
                </button>
              </div>
            </div>

            <div className="settings_divider" />

            <div className="settings_field settings_field-danger">
              <div>
                <label className="settings_label settings_label-danger">
                  Delete account
                </label>
                <p className="settings_helper">
                  Permanently delete your account and all associated data. This
                  cannot be undone.
                </p>
              </div>
              {!confirmDelete ? (
                <button
                  className="settings_danger-btn"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Account
                </button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    className="settings_confirm-box"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <p className="settings_confirm-prompt">
                      Type <strong>delete</strong> to confirm:
                    </p>
                    <div className="settings_confirm-row">
                      <input
                        className="settings_confirm-input"
                        type="text"
                        placeholder="delete"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="settings_danger-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleteInput.trim().toLowerCase() !== "delete"}
                      >
                        Confirm Delete
                      </button>
                      <button
                        className="settings_cancel-btn"
                        onClick={() => {
                          setConfirmDelete(false);
                          setDeleteInput("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.section>

        {/* ----- Notifications ----- */}
        <motion.section
          className="settings_section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="settings_section-title">Notifications</h2>
          <div className="settings_section-body">
            <div className="settings_toggle-row">
              <div className="settings_toggle-info">
                <span className="settings_toggle-label">
                  Weekly career digest email
                </span>
                <span className="settings_toggle-desc">
                  Job match summaries and tips every Monday
                </span>
              </div>
              <button
                role="switch"
                aria-checked={weeklyDigest}
                className={`settings_toggle ${weeklyDigest ? "settings_toggle-on" : ""}`}
                onClick={() => handleDigestToggle(!weeklyDigest)}
                aria-label="Toggle weekly career digest"
              >
                <span className="settings_toggle-thumb" />
              </button>
            </div>

            <div className="settings_divider" />

            <div className="settings_toggle-row">
              <div className="settings_toggle-info">
                <span className="settings_toggle-label">
                  Job match tips via email
                </span>
                <span className="settings_toggle-desc">
                  Personalised tips based on your recent job analyses
                </span>
              </div>
              <button
                role="switch"
                aria-checked={jobMatchTips}
                className={`settings_toggle ${jobMatchTips ? "settings_toggle-on" : ""}`}
                onClick={() => handleTipsToggle(!jobMatchTips)}
                aria-label="Toggle job match tips"
              >
                <span className="settings_toggle-thumb" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* ----- Appearance ----- */}
        <motion.section
          className="settings_section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="settings_section-title">Appearance</h2>
          <div className="settings_section-body">
            <div className="settings_field">
              <label className="settings_label">Theme</label>
              <div
                className="settings_theme-options"
                role="radiogroup"
                aria-label="Theme preference"
              >
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={themePreference === opt.value}
                    className={`settings_theme-btn ${themePreference === opt.value ? "settings_theme-btn-active" : ""}`}
                    onClick={() => setThemePreference(opt.value)}
                  >
                    <span className="settings_theme-icon" aria-hidden="true">
                      {opt.value === "light" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      )}
                      {opt.value === "dark" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      )}
                      {opt.value === "system" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      )}
                    </span>
                    <span className="settings_theme-name">{opt.label}</span>
                    <span className="settings_theme-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ----- Data & Privacy ----- */}
        <motion.section
          className="settings_section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="settings_section-title">Data & Privacy</h2>
          <div className="settings_section-body">
            <div className="settings_action-row">
              <div>
                <span className="settings_toggle-label">Export my data</span>
                <span className="settings_toggle-desc">
                  Download a JSON file with all your profile, job history, and
                  applications
                </span>
              </div>
              <button
                className="settings_action-btn"
                onClick={handleExportData}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export JSON
              </button>
            </div>

            <div className="settings_divider" />

            <div className="settings_action-row">
              <div>
                <span className="settings_toggle-label">
                  Clear all local data
                </span>
                <span className="settings_toggle-desc">
                  Removes your profile, job history, and applications from this
                  device
                </span>
              </div>
              <button
                className="settings_action-btn settings_action-btn-muted"
                onClick={handleClearLocalData}
              >
                Clear Data
              </button>
            </div>

            <div className="settings_divider" />

            <div className="settings_action-row">
              <div>
                <span className="settings_toggle-label">Privacy Policy</span>
                <span className="settings_toggle-desc">
                  How we collect, use, and protect your data
                </span>
              </div>
              <a href="/privacy" className="settings_link-btn">
                View →
              </a>
            </div>

            <div className="settings_divider" />

            <div className="settings_action-row">
              <div>
                <span className="settings_toggle-label">Terms of Service</span>
                <span className="settings_toggle-desc">
                  Your rights, responsibilities, and our usage policies
                </span>
              </div>
              <a href="/terms" className="settings_link-btn">
                View →
              </a>
            </div>

            <div className="settings_divider" />

            <div className="settings_action-row">
              <div>
                <span className="settings_toggle-label">Cookie Policy</span>
                <span className="settings_toggle-desc">
                  What cookies and local storage we use and why
                </span>
              </div>
              <a href="/cookies" className="settings_link-btn">
                View →
              </a>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
