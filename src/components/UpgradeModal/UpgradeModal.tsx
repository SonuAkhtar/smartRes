import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./UpgradeModal.css";

interface UpgradeModalProps {
  reason?: string;
  onClose: () => void;
}

export default function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <div
      className="um_overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
    >
      <motion.div
        className="um_panel"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Icon */}
        <div className="um_icon-wrap">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <h2 className="um_title">Upgrade to Pro</h2>

        {reason && <p className="um_reason">{reason}</p>}

        <p className="um_pitch">
          Get unlimited AI tailoring, cover letters, all 4 resume templates, and
          more - for just <strong>$9/month</strong>.
        </p>

        <ul className="um_perks">
          {[
            "Unlimited AI resume tailoring",
            "Unlimited cover letters",
            "All 4 resume templates",
            "Priority support",
          ].map((p) => (
            <li key={p} className="um_perk">
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
              {p}
            </li>
          ))}
        </ul>

        <button
          className="um_cta"
          onClick={() => {
            navigate("/upgrade");
            onClose();
          }}
        >
          Upgrade to Pro →
        </button>

        <button className="um_dismiss" onClick={onClose}>
          Not now
        </button>
      </motion.div>
    </div>
  );
}
