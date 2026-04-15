import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { fadeUpVariants } from "../../lib/motion";
import "./Upgrade.css";

const FEATURES = [
  { label: "Unlimited AI resume tailoring", free: "3 / month", pro: true },
  { label: "Unlimited cover letter generation", free: "1 / month", pro: true },
  { label: "Unlimited interview prep sessions", free: "5 / month", pro: true },
  { label: "All 4 resume templates", free: "Classic only", pro: true },
  { label: "Unlimited resume versions", free: "1 saved", pro: true },
  { label: "Share resume via public link", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes - cancel from your account settings at any time. Your Pro features stay active until the end of your billing period. No questions asked.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "All your resumes, job history, and applications are kept. You just lose access to Pro-only templates and will be limited to the free tier limits going forward.",
  },
  {
    q: "Is my payment secure?",
    a: "Payments are processed by Stripe - the same infrastructure trusted by millions of businesses. We never store your card details.",
  },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="upgrade">
      <div className="upgrade_bg" aria-hidden="true" />
      <div className="upgrade_container">
        {/* Header */}
        <motion.div
          className="upgrade_header"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="upgrade_badge">Pro Plan</span>
          <h1 className="upgrade_title">Go Pro. Get hired faster.</h1>
          <p className="upgrade_subtitle">
            Unlock unlimited AI tailoring, cover letters, and all resume
            templates.
          </p>
        </motion.div>

        {/* Pricing card */}
        <motion.div
          className="upgrade_card"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <div className="upgrade_price-row">
            <span className="upgrade_price">$9</span>
            <span className="upgrade_price-period">/ month</span>
          </div>
          <p className="upgrade_cancel-note">Cancel anytime · No commitment</p>

          <div className="upgrade_divider" />

          <ul className="upgrade_features">
            {FEATURES.map((f) => (
              <li key={f.label} className="upgrade_feature">
                <span className="upgrade_feature-check">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="upgrade_feature-label">{f.label}</span>
                {typeof f.free === "string" && (
                  <span className="upgrade_feature-free">(Free: {f.free})</span>
                )}
              </li>
            ))}
          </ul>

          <button
            className="upgrade_cta"
            onClick={() => alert("Stripe checkout coming soon!")}
          >
            Upgrade to Pro →
          </button>

          <p className="upgrade_current-plan">
            Currently on <strong>Free plan</strong>
          </p>

          <p className="upgrade_legal-note">
            By upgrading you agree to our{" "}
            <Link to="/terms" className="upgrade_legal-link">
              Terms of Service
            </Link>
            . Payments secured by Stripe. See our{" "}
            <Link to="/privacy" className="upgrade_legal-link">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          className="upgrade_comparison"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <h2 className="upgrade_section-title">Free vs Pro</h2>
          <div className="upgrade_table">
            <div className="upgrade_table-header">
              <span />
              <span className="upgrade_col-label">Free</span>
              <span className="upgrade_col-label upgrade_col-pro">Pro</span>
            </div>
            {FEATURES.map((f) => (
              <div key={f.label} className="upgrade_table-row">
                <span className="upgrade_table-feature">{f.label}</span>
                <span className="upgrade_table-cell">
                  {typeof f.free === "string" ? (
                    f.free
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--color-error)",
                      }}
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </span>
                <span className="upgrade_table-cell upgrade_table-cell-pro">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: 14,
                      height: 14,
                      color: "var(--color-primary)",
                    }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="upgrade_faq"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <h2 className="upgrade_section-title">Frequently asked questions</h2>
          <div className="upgrade_faq-list">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`upgrade_faq-item ${openFaq === i ? "upgrade_faq-open" : ""}`}
              >
                <button
                  className="upgrade_faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {faq.q}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="upgrade_faq-chevron"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <motion.p
                    className="upgrade_faq-a"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back link */}
        <div className="upgrade_back">
          <button className="upgrade_back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
