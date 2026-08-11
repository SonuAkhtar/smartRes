import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner/Spinner";
import "../Auth/Auth.css";

export default function ResetPassword() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (!result.ok) {
        setError(result.error ?? "Could not update password. The link may have expired.");
        return;
      }
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth_bg" />
      <div className="auth_container">
        <div className="auth_card">
          <div className="auth_card-body">
            <h1 className="auth_title">Set a new password</h1>

            {loading ? (
              <p className="auth_subtitle">Verifying your reset link...</p>
            ) : !user ? (
              <>
                <p className="auth_subtitle">
                  This reset link is invalid or has expired. Request a new one from the login page.
                </p>
                <Link to="/auth" className="auth_submit-btn" style={{ textDecoration: "none" }}>
                  Back to Login
                </Link>
              </>
            ) : done ? (
              <div className="auth_success" role="status">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Password updated, redirecting...
              </div>
            ) : (
              <form className="auth_form" onSubmit={handleSubmit} noValidate>
                <p className="auth_subtitle">Choose a new password for your account.</p>

                <div className="auth_field">
                  <label className="auth_field-label" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password" type="password" className="auth_field-input"
                    placeholder="Min. 6 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required autoFocus autoComplete="new-password"
                  />
                </div>

                <div className="auth_field">
                  <label className="auth_field-label" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password" type="password" className="auth_field-input"
                    placeholder="Re-enter password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="auth_error" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <button className="auth_submit-btn" type="submit" disabled={submitting}>
                  {submitting ? (
                    <Spinner size="sm" color="#ffffff" label="Updating password" />
                  ) : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
