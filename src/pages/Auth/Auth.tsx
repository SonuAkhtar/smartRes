import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner/Spinner";
import "./Auth.css";

type Tab = "signin" | "signup";

const USERNAME_MIN = 5;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

type UsernameStatus =
  | "idle"
  | "short"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

interface PasswordStrength {
  label: string;
  score: number;
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
  if (score <= 2) return { label: "Weak",   score: 2, color: "#e07030" };
  if (score === 3) return { label: "Fair",   score: 3, color: "#e8a030" };
  if (score === 4) return { label: "Good",   score: 4, color: "#116466" };
  return             { label: "Strong", score: 4, color: "#116466" };
}

export default function Auth() {
  const { login, signup, checkUsernameAvailable, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // tab
  const [tab, setTab] = useState<Tab>("signin");

  // email form
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // feedback
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]     = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const strength = tab === "signup" ? getPasswordStrength(password) : null;

  useEffect(() => {
    if (tab !== "signup") return;
    const u = username.trim();

    if (u.length === 0) { setUsernameStatus("idle"); return; }
    if (u.length < USERNAME_MIN) { setUsernameStatus("short"); return; }
    if (!USERNAME_RE.test(u)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { available, error } = await checkUsernameAvailable(u);
      setUsernameStatus(error ? "error" : available ? "available" : "taken");
    }, 450);

    return () => clearTimeout(timer);
  }, [username, tab, checkUsernameAvailable]);

  if (user) return <Navigate to="/dashboard" replace />;

  // Email / password
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (tab === "signin") {
        const result = await login(email, password);
        if (!result.ok) { setError(result.error ?? "Invalid email or password."); return; }
        navigate("/dashboard");
      } else {
        const u = username.trim();
        if (u.length < USERNAME_MIN) { setError(`Username must be at least ${USERNAME_MIN} characters.`); return; }
        if (!USERNAME_RE.test(u)) { setError("Username can only contain letters, numbers, and underscores."); return; }
        if (usernameStatus === "taken") { setError("That username is already taken."); return; }
        if (usernameStatus === "checking") { setError("Please wait, still checking that username."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
        const result = await signup(u, email, password);
        if (!result.ok) {
          setError(result.error ?? "Could not create account. Try a different email.");
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

  const handleForgotPassword = async () => {
    setError("");
    setSuccessMsg("");
    const em = email.trim();
    if (!em.includes("@")) {
      setError("Enter your email address first, then click Forgot Password.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(em);
      if (!result.ok) {
        setError(result.error ?? "Could not send reset email. Try again.");
        return;
      }
      setSuccessMsg("Password reset email sent. Check your inbox.");
    } finally {
      setLoading(false);
    }
  };

  // Tab switching
  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccessMsg("");
  };

  // Small helpers
  const ErrorMsg = ({ msg }: { msg: string }) => (
    <div className="auth_error" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );

  const SuccessMsg = ({ msg }: { msg: string }) => (
    <div className="auth_success" role="status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {msg}
    </div>
  );

  // Render
  return (
    <div className="auth">
      <div className="auth_bg" />
      <div className="auth_container">
        <div className="auth_card">
          <div className="auth_tabs">
            <button
              className={`auth_tab ${tab === "signin" ? "auth_tab-active" : ""}`}
              onClick={() => switchTab("signin")}
            >Login</button>
            <button
              className={`auth_tab ${tab === "signup" ? "auth_tab-active" : ""}`}
              onClick={() => switchTab("signup")}
            >Signup</button>
            <div className={`auth_tab-indicator ${tab === "signup" ? "auth_tab-indicator-right" : ""}`} />
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
                  <label className="auth_field-label" htmlFor="username">Username</label>
                  <input
                    id="username" type="text" className="auth_field-input"
                    placeholder="jane_doe" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required autoFocus autoComplete="username"
                    minLength={USERNAME_MIN}
                    aria-describedby="username-status"
                  />
                  {usernameStatus !== "idle" && (
                    <span
                      id="username-status"
                      className={`auth_username-status auth_username-status--${usernameStatus}`}
                      role="status"
                    >
                      {usernameStatus === "checking" && "Checking availability..."}
                      {usernameStatus === "available" && "Username is available"}
                      {usernameStatus === "taken" && "Username is already taken"}
                      {usernameStatus === "short" && `Must be at least ${USERNAME_MIN} characters`}
                      {usernameStatus === "invalid" && "Only letters, numbers, and underscores"}
                      {usernameStatus === "error" && "Couldn't check right now, try again"}
                    </span>
                  )}
                </div>
              )}

              <div className="auth_field">
                <label className="auth_field-label" htmlFor="email">
                  {tab === "signin" ? "Email or Username" : "Email Address"}
                </label>
                <input
                  id="email" type={tab === "signin" ? "text" : "email"}
                  className="auth_field-input"
                  placeholder={tab === "signin" ? "jane@example.com or jane_doe" : "jane@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoFocus={tab === "signin"}
                  autoComplete={tab === "signin" ? "username" : "email"}
                />
              </div>

              <div className="auth_field">
                <div className="auth_field-label-row">
                  <label className="auth_field-label" htmlFor="password">Password</label>
                  {tab === "signin" && (
                    <button
                      type="button"
                      className="auth_forgot-link"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password" type="password" className="auth_field-input"
                  placeholder={tab === "signin" ? "••••••••" : "Min. 6 characters"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                />
                {tab === "signup" && strength && strength.score > 0 && (
                  <div className="auth_strength">
                    <div className="auth_strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className="auth_strength-seg"
                          style={{ background: i <= strength.score ? strength.color : undefined }}
                        />
                      ))}
                    </div>
                    <span className="auth_strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {tab === "signup" && (
                <div className="auth_field">
                  <label className="auth_field-label" htmlFor="confirm">Confirm Password</label>
                  <input
                    id="confirm" type="password" className="auth_field-input"
                    placeholder="Re-enter password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required autoComplete="new-password"
                  />
                </div>
              )}

              {error      && <ErrorMsg msg={error} />}
              {successMsg && <SuccessMsg msg={successMsg} />}

              <button className="auth_submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <Spinner size="sm" color="#ffffff" label="Signing in" />
                ) : tab === "signin" ? "Login" : "Create Account"}
              </button>

            </form>

            <p className="auth_footer">
              {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                className="auth_footer-link"
                onClick={() => switchTab(tab === "signin" ? "signup" : "signin")}
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
