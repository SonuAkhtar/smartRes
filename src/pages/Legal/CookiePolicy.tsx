import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUpVariants } from "../../lib/motion";
import "./Legal.css";

const SECTIONS = [
  { id: "what-are-cookies", title: "What Are Cookies?" },
  { id: "types-we-use", title: "Types of Cookies We Use" },
  { id: "local-storage", title: "Local Storage & Session Data" },
  { id: "third-party", title: "Third-Party Cookies" },
  { id: "your-choices", title: "Your Choices & Cookie Control" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

const COOKIE_TYPES = [
  {
    name: "Essential Cookies",
    required: true,
    description:
      "These cookies are strictly necessary to provide the core functionality of SmartRes. They enable authentication sessions, maintain your signed-in state, and ensure secure access to your account. The service cannot function properly without them.",
    examples: ["supabase-auth-token", "sb-access-token", "sb-refresh-token"],
    duration: "Session / up to 1 year",
  },
  {
    name: "Preference Cookies",
    required: false,
    description:
      "These store your personal settings so the app behaves consistently across visits. Examples include your chosen theme (light/dark/system), selected resume template, and notification preferences.",
    examples: [
      "theme_preference",
      "active_template",
      "notif_weekly_digest",
      "onboarding_seen",
    ],
    duration: "Persistent (stored in localStorage)",
  },
  {
    name: "Analytics Cookies",
    required: false,
    description:
      "These help us understand how users interact with SmartRes - which features are most popular, how users navigate the platform, and where improvements can be made. Data is aggregated and anonymised; it is not used to identify individuals.",
    examples: ["_ga", "_gid (Google Analytics, if enabled)"],
    duration: "Up to 2 years",
  },
];

export default function CookiePolicy() {
  const navigate = useNavigate();

  return (
    <div className="legal">
      <div className="legal_bg" aria-hidden="true" />
      <div className="legal_container">
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="legal_back">
            <button className="legal_back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          <div className="legal_header">
            <span className="legal_badge">Legal</span>
            <h1 className="legal_title">Cookie Policy</h1>
            <div className="legal_meta">
              <span>SmartRes</span>
              <span className="legal_meta-dot" />
              <span>Effective: April 8, 2026</span>
              <span className="legal_meta-dot" />
              <span>Last updated: April 8, 2026</span>
            </div>
          </div>
        </motion.div>

        {/* Table of contents */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <div className="legal_toc">
            <p className="legal_toc-title">Contents</p>
            <ul className="legal_toc-list">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="legal_toc-link">
                    <span className="legal_toc-num">{i + 1}.</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          className="legal_body"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div className="legal_highlight">
            <p>
              This Cookie Policy explains how SmartRes uses cookies and similar
              technologies to recognise you when you visit our platform. It
              explains what these technologies are, why we use them, and your
              rights to control our use of them.
            </p>
          </div>

          {/* 1 */}
          <section id="what-are-cookies" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">1</span>
              What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device (computer,
              smartphone, or tablet) by websites you visit. They are widely used
              to make websites work, remember your preferences, and provide
              information to site owners about how their site is used.
            </p>
            <p>
              In addition to traditional cookies, SmartRes also uses{" "}
              <strong>browser local storage</strong> - a similar technology that
              stores data in your browser but does not send it to a server with
              every request. Local storage is used to persist your preferences
              and app state between sessions.
            </p>
          </section>

          {/* 2 */}
          <section id="types-we-use" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">2</span>
              Types of Cookies We Use
            </h2>
            <p>
              SmartRes uses the following categories of cookies and storage
              technologies:
            </p>

            <div className="legal_cookie-grid">
              {COOKIE_TYPES.map((ct) => (
                <div key={ct.name} className="legal_cookie-card">
                  <div className="legal_cookie-card-head">
                    <span className="legal_cookie-card-name">{ct.name}</span>
                    <span
                      className={`legal_cookie-badge ${
                        ct.required
                          ? "legal_cookie-badge-required"
                          : "legal_cookie-badge-optional"
                      }`}
                    >
                      {ct.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p>{ct.description}</p>
                </div>
              ))}
            </div>

            <p>
              <strong>Detailed examples of what we store:</strong>
            </p>
            <ul>
              {COOKIE_TYPES.map((ct) => (
                <li key={ct.name}>
                  <strong>{ct.name}</strong> - {ct.examples.join(", ")} (
                  {ct.duration})
                </li>
              ))}
            </ul>
          </section>

          {/* 3 */}
          <section id="local-storage" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">3</span>
              Local Storage &amp; Session Data
            </h2>
            <p>
              SmartRes stores the following data in your browser's local storage
              to provide a seamless experience:
            </p>
            <ul>
              <li>
                <strong>Theme preference</strong> (<code>theme_preference</code>
                ) - light, dark, or system
              </li>
              <li>
                <strong>Active resume template</strong> (
                <code>active_template</code>) - your selected template design
              </li>
              <li>
                <strong>Notification preferences</strong> - weekly digest and
                job match tip toggles
              </li>
              <li>
                <strong>Onboarding status</strong> (<code>onboarding_seen</code>
                ) - whether you have completed the welcome tour
              </li>
            </ul>
            <p>
              This data never leaves your device unless you explicitly export or
              sync your profile. You can clear this data at any time from{" "}
              <Link to="/settings">
                Settings → Data &amp; Privacy → Clear local data
              </Link>
              , or by clearing your browser's local storage directly.
            </p>
          </section>

          {/* 4 */}
          <section id="third-party" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">4</span>
              Third-Party Cookies
            </h2>
            <p>
              Some cookies on SmartRes are set by third-party services we rely
              on:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> - sets authentication cookies to
                maintain your signed-in session. These are essential and cannot
                be disabled.
              </li>
              <li>
                <strong>Stripe</strong> - if you subscribe to Pro, Stripe may
                set cookies during the checkout flow for fraud prevention and
                session continuity. Stripe's cookie policy applies.
              </li>
              <li>
                <strong>Analytics</strong> - we may use Google Analytics or a
                privacy-focused alternative to measure aggregate platform usage.
                These cookies can be opted out of (see Section 5).
              </li>
            </ul>
            <p>
              We do not use advertising cookies or allow third-party advertisers
              to place cookies on our platform.
            </p>
          </section>

          {/* 5 */}
          <section id="your-choices" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">5</span>
              Your Choices &amp; Cookie Control
            </h2>
            <p>You have several options to control cookies:</p>
            <ul>
              <li>
                <strong>Browser settings</strong> - most browsers allow you to
                view, delete, and block cookies. Visit your browser's help
                centre for instructions (Chrome, Firefox, Safari, Edge).
              </li>
              <li>
                <strong>Local storage</strong> - clear app preferences via{" "}
                <Link to="/settings">
                  Settings → Data &amp; Privacy → Clear local data
                </Link>
                , or use your browser's developer tools.
              </li>
              <li>
                <strong>Analytics opt-out</strong> - if we use Google Analytics,
                you can opt out using the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Analytics opt-out browser add-on
                </a>
                .
              </li>
            </ul>
            <div className="legal_highlight">
              <p>
                <strong>Note:</strong> Disabling essential cookies (Supabase
                authentication cookies) will prevent you from signing in to
                SmartRes. Optional cookies can be blocked without affecting core
                functionality.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section id="changes" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">6</span>
              Changes to This Policy
            </h2>
            <p>
              We may update this Cookie Policy as our use of cookies changes or
              in response to changes in applicable law. When we make material
              changes, we will post an updated version with a revised "Last
              updated" date. Continued use of the platform following any changes
              constitutes acceptance.
            </p>
          </section>

          {/* 7 */}
          <section id="contact" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">7</span>
              Contact Us
            </h2>
            <p>Questions about our use of cookies?</p>
            <div className="legal_contact">
              <p className="legal_contact-title">SmartRes Privacy Team</p>
              <p>
                Email:{" "}
                <a href="mailto:privacy@smartres.app">privacy@smartres.app</a>
              </p>
              <p>Response time: within 30 days</p>
            </div>
          </section>
        </motion.div>

        {/* Footer nav between legal pages */}
        <div className="legal_footer-nav">
          <span className="legal_footer-copy">
            © 2026 SmartRes. All rights reserved.
          </span>
          <div className="legal_footer-links">
            <Link to="/privacy" className="legal_footer-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="legal_footer-link">
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="legal_footer-link legal_footer-link-active"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
