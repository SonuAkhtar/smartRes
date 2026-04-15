import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUpVariants } from "../../lib/motion";
import "./Legal.css";

const SECTIONS = [
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "ai-processing", title: "AI Processing & Third-Party Services" },
  { id: "data-storage", title: "Data Storage & Security" },
  { id: "your-rights", title: "Your Rights & Choices" },
  { id: "cookies", title: "Cookies & Tracking" },
  { id: "data-retention", title: "Data Retention" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPolicy() {
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
            <h1 className="legal_title">Privacy Policy</h1>
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
              Your privacy matters to us. This policy explains what data
              SmartRes collects, why we collect it, and how you can control it.
              We are committed to handling your information responsibly and
              transparently.
            </p>
          </div>

          {/* 1 */}
          <section id="information-we-collect" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">1</span>
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly and information
              generated automatically when you use our service.
            </p>
            <p>
              <strong>Information you provide:</strong>
            </p>
            <ul>
              <li>
                <strong>Account information</strong> - your name, email address,
                and password when you create an account.
              </li>
              <li>
                <strong>Profile data</strong> - work experience, education,
                skills, and any other details you enter in the Profile Builder.
              </li>
              <li>
                <strong>Job descriptions</strong> - text you paste or upload
                when using the Job Matcher or Cover Letter generator.
              </li>
              <li>
                <strong>Application tracking data</strong> - company names,
                roles, application statuses, and notes you add to your
                Applications board.
              </li>
              <li>
                <strong>Preferences</strong> - theme, notification settings, and
                selected resume template stored in your browser.
              </li>
            </ul>
            <p>
              <strong>Information collected automatically:</strong>
            </p>
            <ul>
              <li>
                <strong>Usage data</strong> - pages visited, features used, and
                time spent on the platform to help us improve the product.
              </li>
              <li>
                <strong>Device information</strong> - browser type, operating
                system, and IP address for security and analytics purposes.
              </li>
              <li>
                <strong>Cookies and local storage</strong> - small files stored
                in your browser. See Section 6 for details.
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section id="how-we-use" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">2</span>
              How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, operate, and improve the SmartRes platform.</li>
              <li>
                Generate AI-tailored resumes and cover letters personalised to
                job descriptions you provide.
              </li>
              <li>
                Match your profile against job requirements and calculate fit
                scores.
              </li>
              <li>Authenticate your account and maintain session security.</li>
              <li>
                Send transactional emails (e.g., email confirmation, password
                reset). Marketing emails are only sent with your explicit
                consent.
              </li>
              <li>
                Analyse aggregate, anonymised usage patterns to improve our AI
                models and user experience. Individual data is never used to
                train AI models without explicit consent.
              </li>
              <li>Comply with legal obligations and resolve disputes.</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to any
              third party for their marketing purposes.
            </p>
          </section>

          {/* 3 */}
          <section id="ai-processing" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">3</span>
              AI Processing &amp; Third-Party Services
            </h2>
            <p>
              SmartRes uses Google's Gemini API to power AI features such as
              resume tailoring, job matching, and cover letter generation. When
              you use these features, relevant portions of your profile and the
              job description are sent to Google's servers for processing.
            </p>
            <div className="legal_highlight">
              <p>
                <strong>What is shared with AI providers:</strong> only the data
                necessary to fulfil the specific request - your resume data and
                the job description. We do not send your email, password, or
                payment information to AI providers.
              </p>
            </div>
            <p>
              Google's use of data submitted via their API is governed by
              Google's API Service Data Policy. We encourage you to review their
              policy at{" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                ai.google.dev/gemini-api/terms
              </a>
              .
            </p>
            <p>
              <strong>Other third-party services we use:</strong>
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> - database and authentication. Your
                profile and account data is stored on Supabase infrastructure.
                Data is encrypted at rest and in transit.
              </li>
              <li>
                <strong>Stripe</strong> (Pro plan) - payment processing. We
                never store your card details; all payment information is
                handled directly by Stripe.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section id="data-storage" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">4</span>
              Data Storage &amp; Security
            </h2>
            <p>
              Your data is stored on secure servers provided by Supabase, with
              infrastructure hosted in geographically redundant data centres.
              All data is encrypted in transit using TLS 1.2+ and encrypted at
              rest using AES-256.
            </p>
            <p>We implement the following security measures:</p>
            <ul>
              <li>
                Bcrypt password hashing - we never store plain-text passwords.
              </li>
              <li>
                Row-level security (RLS) policies ensuring users can only access
                their own data.
              </li>
              <li>Session tokens with automatic expiry.</li>
              <li>Regular security reviews and dependency audits.</li>
            </ul>
            <p>
              While we take strong measures to protect your data, no system is
              100% immune to breaches. In the event of a data breach affecting
              your personal information, we will notify you in accordance with
              applicable law.
            </p>
          </section>

          {/* 5 */}
          <section id="your-rights" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">5</span>
              Your Rights &amp; Choices
            </h2>
            <p>
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul>
              <li>
                <strong>Access</strong> - request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Correction</strong> - update or correct inaccurate
                information through your Profile or Settings page.
              </li>
              <li>
                <strong>Deletion</strong> - delete your account and all
                associated data from the Settings page, or by contacting us.
                Deletion is permanent and cannot be undone.
              </li>
              <li>
                <strong>Portability</strong> - export all your data as a JSON
                file from{" "}
                <Link to="/settings">Settings → Data &amp; Privacy</Link>.
              </li>
              <li>
                <strong>Opt-out of marketing</strong> - unsubscribe at any time
                via the link in any marketing email or through Settings →
                Notifications.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at the details in
              Section 10. We will respond within 30 days.
            </p>
          </section>

          {/* 6 */}
          <section id="cookies" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">6</span>
              Cookies &amp; Tracking
            </h2>
            <p>
              SmartRes uses cookies and browser local storage to keep you signed
              in, remember your preferences, and understand how the product is
              used. For full details, please see our{" "}
              <Link to="/cookies">Cookie Policy</Link>.
            </p>
            <p>
              You can control cookies through your browser settings. Disabling
              essential cookies may affect your ability to sign in or use
              certain features.
            </p>
          </section>

          {/* 7 */}
          <section id="data-retention" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">7</span>
              Data Retention
            </h2>
            <p>
              We retain your personal data for as long as your account is active
              or as needed to provide the service. If you delete your account,
              your data is permanently removed from our active databases within
              30 days. Anonymised, aggregated analytics data may be retained
              indefinitely.
            </p>
            <p>
              Certain data may be retained for longer periods where required by
              law (e.g., billing records for tax purposes).
            </p>
          </section>

          {/* 8 */}
          <section id="childrens-privacy" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">8</span>
              Children's Privacy
            </h2>
            <p>
              SmartRes is not intended for children under the age of 16. We do
              not knowingly collect personal information from children under 16.
              If you believe we have inadvertently collected information from a
              child, please contact us immediately and we will delete it
              promptly.
            </p>
          </section>

          {/* 9 */}
          <section id="changes" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">9</span>
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              material changes, we will notify you by posting a notice on the
              platform or sending an email to the address associated with your
              account. The "Last updated" date at the top of this page reflects
              the most recent revision.
            </p>
            <p>
              Your continued use of SmartRes after any changes constitutes your
              acceptance of the updated policy.
            </p>
          </section>

          {/* 10 */}
          <section id="contact" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">10</span>
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your rights, please reach out:
            </p>
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
            <Link
              to="/privacy"
              className="legal_footer-link legal_footer-link-active"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="legal_footer-link">
              Terms of Service
            </Link>
            <Link to="/cookies" className="legal_footer-link">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
