import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner/Spinner";
import "./Auth.css";

type Tab = "signin" | "signup";

interface PasswordStrength {
  label: string;
  score: number; // 0–4
  color: string;
}

function getPasswordStrength(pwd: string): PasswordStrength {
  if (pwd.length === 0) return { label: "", score: 0, color: "" };
  if (pwd.length < 6) return { label: "Too short", score: 1, color: "#c0392b" };
  const checks = [
    /[A-Z]/.test(pwd),
    /[a-z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
    pwd.length >= 10,
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 2) return { label: "Weak", score: 2, color: "#e07030" };
  if (score === 3) return { label: "Fair", score: 3, color: "#e8a030" };
  if (score === 4) return { label: "Good", score: 4, color: "#116466" };
  return { label: "Strong", score: 4, color: "#116466" };
}

export default function Auth() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = tab === "signup" ? getPasswordStrength(password) : null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (tab === "signin") {
        const result = await login(email, password);
        if (!result.ok) {
          setError(result.error ?? "Invalid email or password.");
          return;
        }
        navigate("/dashboard");
      } else {
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        const result = await signup(name, email, password);
        if (!result.ok) {
          setError(
            result.error ?? "Could not create account. Try a different email.",
          );
          return;
        }
        if (result.confirmEmail) {
          navigate(`/auth/confirm?email=${encodeURIComponent(email)}`);
          return;
        }
        navigate("/profile-builder");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
  };

  return (
    <div className="auth">
      <div className="auth_bg" />
      <div className="auth_container">
        <Link to="/" className="auth_logo">
          <span className="auth_logo-icon">R</span>
          <span className="auth_logo-text">SmartRes</span>
        </Link>

        <div className="auth_card">
          <div className="auth_tabs">
            <button
              className={`auth_tab ${tab === "signin" ? "auth_tab-active" : ""}`}
              onClick={() => switchTab("signin")}
            >
              Sign In
            </button>
            <button
              className={`auth_tab ${tab === "signup" ? "auth_tab-active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
            <div
              className={`auth_tab-indicator ${tab === "signup" ? "auth_tab-indicator-right" : ""}`}
            />
          </div>

          <div className="auth_card-body">
            <h1 className="auth_title">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="auth_subtitle">
              {tab === "signin"
                ? "Sign in to access your resumes and job matches."
                : "Join thousands of professionals building better resumes."}
            </p>

            <form className="auth_form" onSubmit={handleSubmit} noValidate>
              {tab === "signup" && (
                <div className="auth_field">
                  <label className="auth_field-label" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="auth_field-input"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="auth_field">
                <label className="auth_field-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="auth_field-input"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={tab === "signin"}
                  autoComplete="email"
                />
              </div>

              <div className="auth_field">
                <div className="auth_field-label-row">
                  <label className="auth_field-label" htmlFor="password">
                    Password
                  </label>
                  {tab === "signin" && (
                    <button
                      type="button"
                      className="auth_forgot-link"
                      onClick={() => {
                        if (email) {
                          setSuccessMsg(
                            "Password reset email sent - check your inbox.",
                          );
                        } else {
                          setError(
                            "Enter your email address first, then click Forgot Password.",
                          );
                        }
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  className="auth_field-input"
                  placeholder={
                    tab === "signin" ? "••••••••" : "Min. 6 characters"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={
                    tab === "signin" ? "current-password" : "new-password"
                  }
                />
                {/* Password strength indicator - signup only */}
                {tab === "signup" && strength && strength.score > 0 && (
                  <div className="auth_strength">
                    <div className="auth_strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="auth_strength-seg"
                          style={{
                            background:
                              i <= strength.score ? strength.color : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="auth_strength-label"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {tab === "signup" && (
                <div className="auth_field">
                  <label className="auth_field-label" htmlFor="confirm">
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    className="auth_field-input"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <div className="auth_error" role="alert">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="auth_success" role="status">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {successMsg}
                </div>
              )}

              <button
                className="auth_submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Spinner
                    size="sm"
                    color="rgba(44,53,49,0.9)"
                    label="Signing in"
                  />
                ) : tab === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>

              {tab === "signup" && (
                <p className="auth_legal-note">
                  By creating an account you agree to our{" "}
                  <Link to="/terms" className="auth_legal-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="auth_legal-link">
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
            </form>

            <p className="auth_footer">
              {tab === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                className="auth_footer-link"
                onClick={() =>
                  switchTab(tab === "signin" ? "signup" : "signin")
                }
              >
                {tab === "signin" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
