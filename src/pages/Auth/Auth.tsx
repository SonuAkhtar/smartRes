import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/Spinner/Spinner";
import "./Auth.css";

type Tab = "signin" | "signup";
type AuthMethod = "email" | "phone";
type PhoneStep = "enter-phone" | "enter-otp";

interface PasswordStrength {
  label: string;
  score: number;
  color: string;
}

interface CountryEntry {
  code: string;
  country: string;
  flag: string;
  digits: number;
}

const COUNTRY_CODES: CountryEntry[] = [
  { code: "+91",  country: "India",          flag: "🇮🇳", digits: 10 },
  { code: "+1",   country: "US / Canada",    flag: "🇺🇸", digits: 10 },
  { code: "+44",  country: "UK",             flag: "🇬🇧", digits: 10 },
  { code: "+61",  country: "Australia",      flag: "🇦🇺", digits: 9  },
  { code: "+971", country: "UAE",            flag: "🇦🇪", digits: 9  },
  { code: "+65",  country: "Singapore",      flag: "🇸🇬", digits: 8  },
  { code: "+60",  country: "Malaysia",       flag: "🇲🇾", digits: 9  },
  { code: "+92",  country: "Pakistan",       flag: "🇵🇰", digits: 10 },
  { code: "+880", country: "Bangladesh",     flag: "🇧🇩", digits: 10 },
  { code: "+94",  country: "Sri Lanka",      flag: "🇱🇰", digits: 9  },
  { code: "+81",  country: "Japan",          flag: "🇯🇵", digits: 10 },
  { code: "+86",  country: "China",          flag: "🇨🇳", digits: 11 },
  { code: "+49",  country: "Germany",        flag: "🇩🇪", digits: 10 },
  { code: "+33",  country: "France",         flag: "🇫🇷", digits: 9  },
  { code: "+55",  country: "Brazil",         flag: "🇧🇷", digits: 11 },
  { code: "+52",  country: "Mexico",         flag: "🇲🇽", digits: 10 },
  { code: "+27",  country: "South Africa",   flag: "🇿🇦", digits: 9  },
  { code: "+7",   country: "Russia",         flag: "🇷🇺", digits: 10 },
  { code: "+64",  country: "New Zealand",    flag: "🇳🇿", digits: 9  },
  { code: "+234", country: "Nigeria",        flag: "🇳🇬", digits: 10 },
  { code: "+966", country: "Saudi Arabia",   flag: "🇸🇦", digits: 9  },
  { code: "+62",  country: "Indonesia",      flag: "🇮🇩", digits: 9  },
  { code: "+63",  country: "Philippines",    flag: "🇵🇭", digits: 10 },
  { code: "+66",  country: "Thailand",       flag: "🇹🇭", digits: 9  },
  { code: "+84",  country: "Vietnam",        flag: "🇻🇳", digits: 9  },
  { code: "+82",  country: "South Korea",    flag: "🇰🇷", digits: 10 },
  { code: "+20",  country: "Egypt",          flag: "🇪🇬", digits: 10 },
  { code: "+254", country: "Kenya",          flag: "🇰🇪", digits: 9  },
];

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
  const { login, signup, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, user } =
    useAuth();
  const navigate = useNavigate();

  // tab
  const [tab, setTab] = useState<Tab>("signin");

  // email form
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // phone flow
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [phoneStep, setPhoneStep]   = useState<PhoneStep>("enter-phone");
  const [countryCode, setCountryCode] = useState("+91"); // India default
  const [phoneLocal, setPhoneLocal]   = useState("");   // digits only, no country code
  const [otp, setOtp] = useState("");

  // feedback
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]     = useState(false);

  // ── Derived phone state ────────────────────────────────────────────────────
  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];
  const cleanPhoneLocal = phoneLocal.replace(/\D/g, "");
  const isPhoneValid    = cleanPhoneLocal.length === selectedCountry.digits;
  const fullPhone       = `${countryCode}${cleanPhoneLocal}`;

  const strength = tab === "signup" ? getPasswordStrength(password) : null;

  if (user) return <Navigate to="/dashboard" replace />;

  // ── Email / password ───────────────────────────────────────────────────────
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
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
        const result = await signup(name, email, password);
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

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.ok) setError(result.error ?? "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const result = await sendPhoneOtp(fullPhone);
      if (!result.ok) {
        setError(result.error ?? "Failed to send code. Check your number and try again.");
        return;
      }
      setPhoneStep("enter-otp");
      setSuccessMsg(`Code sent to ${countryCode} ${phoneLocal}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccessMsg("");
    setOtp("");
    setLoading(true);
    try {
      const result = await sendPhoneOtp(fullPhone);
      if (!result.ok) { setError(result.error ?? "Failed to resend code."); return; }
      setSuccessMsg("New code sent.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (otp.length < 6) { setError("Please enter the 6-digit verification code."); return; }
    setLoading(true);
    try {
      const result = await verifyPhoneOtp(fullPhone, otp);
      if (!result.ok) { setError(result.error ?? "Invalid code. Please try again."); return; }
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab switching ──────────────────────────────────────────────────────────
  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccessMsg("");
    setAuthMethod("email");
    setPhoneStep("enter-phone");
    setPhoneLocal("");
    setOtp("");
  };

  // ── Small helpers ──────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
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
            >Sign In</button>
            <button
              className={`auth_tab ${tab === "signup" ? "auth_tab-active" : ""}`}
              onClick={() => switchTab("signup")}
            >Sign Up</button>
            <div className={`auth_tab-indicator ${tab === "signup" ? "auth_tab-indicator-right" : ""}`} />
          </div>

          <div className="auth_card-body">
            {authMethod === "phone" ? (
              /* ── Phone OTP flow ──────────────────────────────────────── */
              <div>
                <button
                  type="button"
                  className="auth_phone-back"
                  onClick={() => {
                    setAuthMethod("email");
                    setPhoneStep("enter-phone");
                    setPhoneLocal("");
                    setOtp("");
                    setError("");
                    setSuccessMsg("");
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>

                {phoneStep === "enter-phone" ? (
                  /* Step 1 – phone input */
                  <form className="auth_form" onSubmit={handleSendOtp} noValidate>
                    <h2 className="auth_phone-title">Verify your phone</h2>
                    <p className="auth_phone-subtitle">
                      Select your country and enter your number — no country code needed.
                    </p>

                    <div className="auth_field">
                      <label className="auth_field-label" htmlFor="phone-local">
                        Phone Number
                      </label>

                      {/* Country code + number grouped input */}
                      <div className="auth_phone-group">
                        <select
                          className="auth_phone-select"
                          value={countryCode}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            setPhoneLocal("");
                          }}
                          aria-label="Country code"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.country} ({c.code})
                            </option>
                          ))}
                        </select>

                        <input
                          id="phone-local"
                          type="tel"
                          inputMode="numeric"
                          className="auth_phone-input"
                          placeholder={`${selectedCountry.digits} digits`}
                          value={phoneLocal}
                          onChange={(e) =>
                            setPhoneLocal(e.target.value.replace(/\D/g, ""))
                          }
                          maxLength={selectedCountry.digits}
                          required
                          autoFocus
                          autoComplete="tel-national"
                        />
                      </div>

                      {/* Live digit counter */}
                      {cleanPhoneLocal.length > 0 && (
                        <div className="auth_phone-meta">
                          <span
                            className="auth_phone-count"
                            style={{
                              color: isPhoneValid
                                ? "#116466"
                                : "#e07030",
                            }}
                          >
                            {cleanPhoneLocal.length}/{selectedCountry.digits} digits
                            {isPhoneValid && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 4 }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {error      && <ErrorMsg msg={error} />}
                    {successMsg && <SuccessMsg msg={successMsg} />}

                    <button
                      className="auth_submit-btn"
                      type="submit"
                      disabled={loading || !isPhoneValid}
                    >
                      {loading ? (
                        <Spinner size="sm" color="rgba(44,53,49,0.9)" label="Sending code" />
                      ) : (
                        "Send Code"
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2 – OTP input */
                  <form className="auth_form" onSubmit={handleVerifyOtp} noValidate>
                    <h2 className="auth_phone-title">Enter your code</h2>
                    <p className="auth_phone-subtitle">
                      We sent a 6-digit code to{" "}
                      <strong className="auth_phone-highlight">
                        {countryCode} {phoneLocal}
                      </strong>.
                    </p>

                    <div className="auth_field">
                      <label className="auth_field-label" htmlFor="otp">
                        Verification Code
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        className="auth_field-input auth_otp-input"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        required
                        autoFocus
                        autoComplete="one-time-code"
                      />
                    </div>

                    {error      && <ErrorMsg msg={error} />}
                    {successMsg && <SuccessMsg msg={successMsg} />}

                    <button
                      className="auth_submit-btn"
                      type="submit"
                      disabled={loading || otp.length < 6}
                    >
                      {loading ? (
                        <Spinner size="sm" color="rgba(44,53,49,0.9)" label="Verifying" />
                      ) : (
                        "Verify Code"
                      )}
                    </button>

                    <p className="auth_otp-hint">
                      Didn't get a code?{" "}
                      <button
                        type="button"
                        className="auth_otp-resend"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        Resend
                      </button>
                    </p>
                  </form>
                )}
              </div>
            ) : (
              /* ── Email / password flow ───────────────────────────────── */
              <>
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
                      <label className="auth_field-label" htmlFor="name">Full Name</label>
                      <input
                        id="name" type="text" className="auth_field-input"
                        placeholder="Jane Doe" value={name}
                        onChange={(e) => setName(e.target.value)}
                        required autoFocus autoComplete="name"
                      />
                    </div>
                  )}

                  <div className="auth_field">
                    <label className="auth_field-label" htmlFor="email">Email Address</label>
                    <input
                      id="email" type="email" className="auth_field-input"
                      placeholder="jane@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required autoFocus={tab === "signin"} autoComplete="email"
                    />
                  </div>

                  <div className="auth_field">
                    <div className="auth_field-label-row">
                      <label className="auth_field-label" htmlFor="password">Password</label>
                      {tab === "signin" && (
                        <button
                          type="button"
                          className="auth_forgot-link"
                          onClick={() => {
                            if (email) setSuccessMsg("Password reset email sent - check your inbox.");
                            else setError("Enter your email address first, then click Forgot Password.");
                          }}
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
                      <Spinner size="sm" color="rgba(44,53,49,0.9)" label="Signing in" />
                    ) : tab === "signin" ? "Sign In" : "Create Account"}
                  </button>

                  {tab === "signup" && (
                    <p className="auth_legal-note">
                      By creating an account you agree to our{" "}
                      <Link to="/terms" className="auth_legal-link">Terms of Service</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="auth_legal-link">Privacy Policy</Link>.
                    </p>
                  )}
                </form>

                {/* ── Social / alternative login ── */}
                <div className="auth_divider">
                  <span>or continue with</span>
                </div>

                <div className="auth_social">
                  <button
                    type="button" className="auth_social-btn"
                    onClick={handleGoogleLogin} disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18"
                      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8418H9v3.4818h4.8436c-.2086 1.125-.8427 2.0781-1.7959 2.7167v2.2581h2.9086c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9086-2.2581c-.8059.54-1.8368.8618-3.0477.8618-2.3436 0-4.3282-1.5832-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71c-.18-.54-.2818-1.1168-.2818-1.71s.1018-1.17.2818-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
                      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.6564 3.5795 9 3.5795z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>

                  <button
                    type="button" className="auth_social-btn"
                    onClick={() => { setAuthMethod("phone"); setError(""); setSuccessMsg(""); }}
                    disabled={loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Phone
                  </button>
                </div>

                <p className="auth_footer">
                  {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    className="auth_footer-link"
                    onClick={() => switchTab(tab === "signin" ? "signup" : "signin")}
                  >
                    {tab === "signin" ? "Sign up free" : "Sign in"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
