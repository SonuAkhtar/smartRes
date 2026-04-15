import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUpVariants } from "../../lib/motion";
import "./Legal.css";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "Description of Service" },
  { id: "accounts", title: "Accounts & Registration" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "ai-features", title: "AI Features & Limitations" },
  { id: "subscription", title: "Subscription & Billing" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "disclaimers", title: "Disclaimers & Limitation of Liability" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "contact", title: "Contact Us" },
];

export default function TermsOfService() {
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
            <h1 className="legal_title">Terms of Service</h1>
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
              Please read these Terms of Service carefully before using
              SmartRes. By creating an account or using our platform, you agree
              to be bound by these terms. If you do not agree, please do not use
              the service.
            </p>
          </div>

          {/* 1 */}
          <section id="acceptance" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">1</span>
              Acceptance of Terms
            </h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding
              agreement between you ("User", "you") and SmartRes ("we", "us",
              "our") governing your use of the SmartRes platform, including all
              features, AI tools, and related services (collectively, the
              "Service").
            </p>
            <p>
              By accessing or using the Service, you confirm that you are at
              least 16 years old, have read and understood these Terms, and
              agree to be legally bound by them. If you are using the Service on
              behalf of an organisation, you represent that you have the
              authority to bind that organisation to these Terms.
            </p>
          </section>

          {/* 2 */}
          <section id="description" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">2</span>
              Description of Service
            </h2>
            <p>
              SmartRes is a career tools platform that helps professionals
              build, tailor, and optimise their resumes and job applications
              using artificial intelligence. Our core features include:
            </p>
            <ul>
              <li>AI-powered resume tailoring to specific job descriptions</li>
              <li>Job match scoring and gap analysis</li>
              <li>Cover letter generation</li>
              <li>Interview preparation tools</li>
              <li>Application tracking (kanban board)</li>
              <li>Resume templates and PDF/DOCX export</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect
              of the Service at any time with reasonable notice.
            </p>
          </section>

          {/* 3 */}
          <section id="accounts" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">3</span>
              Accounts &amp; Registration
            </h2>
            <p>
              To access most features, you must create an account with a valid
              email address and a password. You are responsible for:
            </p>
            <ul>
              <li>
                Keeping your account credentials confidential. Do not share your
                password with anyone.
              </li>
              <li>
                All activity that occurs under your account, whether authorised
                by you or not.
              </li>
              <li>
                Notifying us immediately at{" "}
                <a href="mailto:support@smartres.app">support@smartres.app</a>{" "}
                if you suspect unauthorised access.
              </li>
              <li>
                Providing accurate and up-to-date information when registering.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that are
              inactive for extended periods or that violate these Terms.
            </p>
          </section>

          {/* 4 */}
          <section id="acceptable-use" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">4</span>
              Acceptable Use
            </h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Submit false, misleading, or fraudulent information in resumes
                or applications.
              </li>
              <li>
                Attempt to reverse-engineer, scrape, or systematically extract
                data from the platform.
              </li>
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws or regulations.
              </li>
              <li>
                Attempt to gain unauthorised access to our systems or another
                user's account.
              </li>
              <li>
                Transmit viruses, malware, or any other malicious or harmful
                code.
              </li>
              <li>
                Use automated tools to access the Service without our prior
                written consent.
              </li>
              <li>
                Harass, abuse, or harm another person through the platform.
              </li>
            </ul>
            <p>
              Violation of this section may result in immediate account
              termination and, where appropriate, reporting to law enforcement.
            </p>
          </section>

          {/* 5 */}
          <section id="ai-features" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">5</span>
              AI Features &amp; Limitations
            </h2>
            <p>
              SmartRes leverages large language models (including Google Gemini)
              to provide AI-generated content suggestions. By using AI features,
              you acknowledge and agree that:
            </p>
            <ul>
              <li>
                <strong>AI output is not guaranteed to be accurate.</strong> AI
                suggestions are starting points, not final content. You are
                responsible for reviewing, editing, and verifying all
                AI-generated text before submitting it to employers.
              </li>
              <li>
                <strong>You own your content.</strong> Any resume content,
                profile data, or cover letters you create remain yours. You
                grant us a limited licence to process this content solely to
                provide the Service.
              </li>
              <li>
                <strong>We do not guarantee job outcomes.</strong> Using
                SmartRes does not guarantee job interviews or employment offers.
              </li>
              <li>
                <strong>Data shared with AI providers.</strong> Job descriptions
                and profile data are sent to third-party AI providers (Google
                Gemini) to generate AI suggestions. See our{" "}
                <Link to="/privacy">Privacy Policy</Link> for details.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section id="subscription" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">6</span>
              Subscription &amp; Billing
            </h2>
            <p>
              SmartRes offers a free tier with limited usage and a Pro
              subscription with expanded features.
            </p>
            <p>
              <strong>Free plan:</strong> available without payment. Certain
              features are limited in usage frequency (e.g., 3 AI tailoring
              runs/month). Limits are subject to change with notice.
            </p>
            <p>
              <strong>Pro plan ($9/month):</strong>
            </p>
            <ul>
              <li>
                Billed monthly in advance. Subscriptions auto-renew unless
                cancelled.
              </li>
              <li>
                You may cancel at any time from Settings. Your Pro access
                remains active until the end of the current billing period. No
                refunds are issued for partial months.
              </li>
              <li>
                We reserve the right to change pricing with 30 days' advance
                notice. Price changes will not affect your current billing
                period.
              </li>
              <li>
                Payments are processed by Stripe. By subscribing, you also agree
                to Stripe's Terms of Service.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section id="intellectual-property" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">7</span>
              Intellectual Property
            </h2>
            <p>
              <strong>Our IP:</strong> The SmartRes platform, including its
              design, code, branding, and AI models, is owned by SmartRes and
              protected by applicable intellectual property laws. You may not
              copy, reproduce, or distribute any part of the Service without our
              prior written consent.
            </p>
            <p>
              <strong>Your content:</strong> You retain full ownership of all
              content you create on SmartRes - your resume data, profile
              information, and generated documents. You grant SmartRes a
              non-exclusive, worldwide, royalty-free licence to store, display,
              and process your content solely for the purpose of operating and
              improving the Service.
            </p>
            <p>
              <strong>Feedback:</strong> Any feedback, suggestions, or ideas you
              share with us may be used by SmartRes without restriction or
              compensation.
            </p>
          </section>

          {/* 8 */}
          <section id="disclaimers" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">8</span>
              Disclaimers &amp; Limitation of Liability
            </h2>
            <p>
              <strong>
                The Service is provided "as is" and "as available"
              </strong>{" "}
              without warranties of any kind, express or implied, including
              fitness for a particular purpose, accuracy, or uninterrupted
              availability.
            </p>
            <p>
              To the maximum extent permitted by applicable law, SmartRes shall
              not be liable for:
            </p>
            <ul>
              <li>
                Any indirect, incidental, special, or consequential damages
                arising from your use of the Service.
              </li>
              <li>
                Loss of employment opportunities or career outcomes based on
                content generated or suggested by SmartRes.
              </li>
              <li>
                Data loss resulting from technical failures, provided reasonable
                backups are maintained.
              </li>
              <li>
                Any errors, inaccuracies, or omissions in AI-generated content.
              </li>
            </ul>
            <p>
              Our total liability in any matter related to these Terms or the
              Service shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </section>

          {/* 9 */}
          <section id="termination" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">9</span>
              Termination
            </h2>
            <p>
              <strong>By you:</strong> You may delete your account at any time
              from Settings → Account. This permanently removes your data and
              cancels any active subscription.
            </p>
            <p>
              <strong>By us:</strong> We may suspend or terminate your account
              with immediate effect if you violate these Terms, engage in
              fraudulent activity, or for any reason with 7 days' notice.
            </p>
            <p>
              Sections 7 (Intellectual Property), 8 (Disclaimers), and 10
              (Governing Law) survive termination of these Terms.
            </p>
          </section>

          {/* 10 */}
          <section id="governing-law" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">10</span>
              Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with
              applicable law. Any disputes arising out of or related to these
              Terms or the Service shall be resolved through good-faith
              negotiation first, then binding arbitration if necessary.
            </p>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will continue in full force and effect.
            </p>
          </section>

          {/* 11 */}
          <section id="contact" className="legal_section">
            <h2 className="legal_section-title">
              <span className="legal_section-num">11</span>
              Contact Us
            </h2>
            <p>Questions about these Terms? Contact us:</p>
            <div className="legal_contact">
              <p className="legal_contact-title">SmartRes Legal</p>
              <p>
                Email:{" "}
                <a href="mailto:legal@smartres.app">legal@smartres.app</a>
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
            <Link
              to="/terms"
              className="legal_footer-link legal_footer-link-active"
            >
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
