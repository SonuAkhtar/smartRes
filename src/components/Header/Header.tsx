import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./Header.css";

const AI_TOOLS = [
  {
    to: "/job-matcher",
    label: "Job Matcher",
    desc: "Tailor your resume to any job",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    to: "/cover-letter",
    label: "Cover Letter",
    desc: "Generate a tailored cover letter",
    icon: (
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
      </svg>
    ),
  },
  {
    to: "/interview-prep",
    label: "Interview Prep",
    desc: "Practice with AI-generated questions",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const TRACKER = [
  {
    to: "/applications",
    label: "Applications",
    desc: "Track every job you apply to",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: "/job-history",
    label: "Job History",
    desc: "Review past job analyses",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const CHEVRON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="header_subnav-chevron"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openSubnav, setOpenSubnav] = useState<string | null>(null);
  const [mobileSubnav, setMobileSubnav] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const isHome = location.pathname === "/";

  const aiActive = AI_TOOLS.some((l) => location.pathname === l.to);
  const trackActive = TRACKER.some((l) => location.pathname === l.to);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 20);
      setScrollPct(total > 0 ? Math.min((y / total) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setOpenSubnav(null);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setOpenSubnav(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDropdownOpen(false);
        setOpenSubnav(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "?");

  const headerClass = [
    "header",
    isHome ? "header-transparent" : "header-solid",
    scrolled ? "header-scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className="header_progress-track">
        <div
          className="header_progress-fill"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      <div className="header_container">
        <Link to="/" className="header_logo">
          <span className="header_logo-wordmark">SmartRes</span>
          <span className="header_logo-monogram">SR</span>
        </Link>

        <nav
          id="header-mobile-nav"
          ref={navRef}
          className={`header_nav ${mobileOpen ? "header_nav-open" : ""}`}
        >
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `header_nav-link ${isActive ? "header_nav-link-active" : ""}`
                }
              >
                Dashboard
              </NavLink>

              <div
                className="header_subnav-group"
                onMouseEnter={() => setOpenSubnav("ai")}
                onMouseLeave={() => setOpenSubnav(null)}
              >
                <button
                  className={`header_nav-link header_subnav-trigger ${aiActive ? "header_nav-link-active" : ""} ${openSubnav === "ai" ? "header_subnav-trigger-open" : ""}`}
                  onClick={() =>
                    setMobileSubnav((v) => (v === "ai" ? null : "ai"))
                  }
                  aria-expanded={openSubnav === "ai" || mobileSubnav === "ai"}
                >
                  AI Tools
                  {CHEVRON}
                </button>

                <div
                  className={`header_subnav-panel ${openSubnav === "ai" ? "header_subnav-panel-open" : ""}`}
                >
                  {AI_TOOLS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`header_subnav-item ${location.pathname === item.to ? "header_subnav-item-active" : ""}`}
                    >
                      <span className="header_subnav-item-icon">
                        {item.icon}
                      </span>
                      <span className="header_subnav-item-text">
                        <span className="header_subnav-item-label">
                          {item.label}
                        </span>
                        <span className="header_subnav-item-desc">
                          {item.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                {mobileSubnav === "ai" && (
                  <div className="header_subnav-mobile">
                    {AI_TOOLS.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`header_subnav-mobile-item ${location.pathname === item.to ? "header_subnav-item-active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="header_subnav-mobile-icon">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="header_subnav-group"
                onMouseEnter={() => setOpenSubnav("tracker")}
                onMouseLeave={() => setOpenSubnav(null)}
              >
                <button
                  className={`header_nav-link header_subnav-trigger ${trackActive ? "header_nav-link-active" : ""} ${openSubnav === "tracker" ? "header_subnav-trigger-open" : ""}`}
                  onClick={() =>
                    setMobileSubnav((v) => (v === "tracker" ? null : "tracker"))
                  }
                  aria-expanded={
                    openSubnav === "tracker" || mobileSubnav === "tracker"
                  }
                >
                  Tracker
                  {CHEVRON}
                </button>

                <div
                  className={`header_subnav-panel ${openSubnav === "tracker" ? "header_subnav-panel-open" : ""}`}
                >
                  {TRACKER.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`header_subnav-item ${location.pathname === item.to ? "header_subnav-item-active" : ""}`}
                    >
                      <span className="header_subnav-item-icon">
                        {item.icon}
                      </span>
                      <span className="header_subnav-item-text">
                        <span className="header_subnav-item-label">
                          {item.label}
                        </span>
                        <span className="header_subnav-item-desc">
                          {item.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                {mobileSubnav === "tracker" && (
                  <div className="header_subnav-mobile">
                    {TRACKER.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`header_subnav-mobile-item ${location.pathname === item.to ? "header_subnav-item-active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="header_subnav-mobile-icon">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/auth" className="header_nav-link header_cta-btn">
              Get Started
            </Link>
          )}

          {user && (
            <div className="header_user-mobile">
              <div className="header_user-mobile-info">
                <span className="header_user-mobile-name">
                  {user.name || user.email}
                </span>
              </div>
              <Link
                to="/profile"
                className="header_nav-link"
                onClick={() => setMobileOpen(false)}
              >
                My Profile
              </Link>
              <Link
                to="/templates"
                className="header_nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Templates
              </Link>
              <Link
                to="/upgrade"
                className="header_nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Upgrade to Pro
              </Link>
              <Link
                to="/settings"
                className="header_nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Settings
              </Link>
              <button
                className="header_nav-link header_theme-mobile"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 16, height: 16 }}
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Dark Mode
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 16, height: 16 }}
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
                    Light Mode
                  </>
                )}
              </button>
              <button
                className="header_logout-btn-mobile"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>

        {user && (
          <div className="header_avatar-wrapper" ref={dropdownRef}>
            <button
              className={`header_user-avatar ${dropdownOpen ? "header_user-avatar-active" : ""}`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div className="header_dropdown">
                <div className="header_dropdown-user">
                  <div className="header_dropdown-avatar">{initials}</div>
                  <div className="header_dropdown-info">
                    <span className="header_dropdown-name">
                      {user.name || "User"}
                    </span>
                    <span className="header_dropdown-email">{user.email}</span>
                  </div>
                </div>
                <div className="header_dropdown-divider" />
                <Link
                  to="/profile"
                  className="header_dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
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
                  My Profile
                </Link>
                <Link
                  to="/templates"
                  className="header_dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Templates
                </Link>
                <Link
                  to="/upgrade"
                  className="header_dropdown-item header_dropdown-item-upgrade"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Upgrade to Pro
                </Link>
                <Link
                  to="/settings"
                  className="header_dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
                <button
                  className="header_dropdown-item"
                  onClick={() => {
                    toggleTheme();
                    setDropdownOpen(false);
                  }}
                >
                  {theme === "light" ? (
                    <>
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
                      Dark Mode
                    </>
                  ) : (
                    <>
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
                      Light Mode
                    </>
                  )}
                </button>
                <div className="header_dropdown-divider" />
                <button
                  className="header_dropdown-item header_dropdown-item-danger"
                  onClick={() => {
                    logout();
                    navigate("/");
                    setDropdownOpen(false);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        <button
          className={`header_hamburger ${mobileOpen ? "header_hamburger-open" : ""}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="header-mobile-nav"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="header_backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
