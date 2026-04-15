import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUpVariants } from "../../lib/motion";
import "./Templates.css";

export type TemplateId = "classic" | "modern" | "minimal" | "executive";

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  desc: string;
  pro: boolean;
  preview: React.ReactNode;
}> = [
  {
    id: "classic",
    name: "Classic",
    desc: "Clean, universal, ATS-friendly",
    pro: false,
    preview: (
      <svg viewBox="0 0 140 180" fill="none" className="tmpl_svg">
        {/* Header block */}
        <rect
          x="12"
          y="12"
          width="116"
          height="28"
          rx="3"
          fill="rgba(17,100,102,0.12)"
        />
        <rect
          x="20"
          y="18"
          width="60"
          height="7"
          rx="2"
          fill="var(--color-primary)"
          opacity="0.5"
        />
        <rect
          x="20"
          y="29"
          width="40"
          height="4"
          rx="1.5"
          fill="var(--color-border)"
        />
        {/* Divider */}
        <rect
          x="12"
          y="44"
          width="116"
          height="1.5"
          fill="var(--color-primary)"
          opacity="0.25"
        />
        {/* Section rows */}
        {[52, 76, 100, 124, 148].map((y, i) => (
          <g key={y}>
            <rect
              x="12"
              y={y}
              width={i === 0 ? 36 : 32}
              height="4"
              rx="1.5"
              fill="var(--color-primary)"
              opacity="0.3"
            />
            <rect
              x="12"
              y={y + 9}
              width="116"
              height="3"
              rx="1.5"
              fill="var(--color-border)"
              opacity="0.7"
            />
            <rect
              x="12"
              y={y + 15}
              width={80 + (i % 3) * 10}
              height="3"
              rx="1.5"
              fill="var(--color-border)"
              opacity="0.5"
            />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Two-column layout with sidebar",
    pro: false,
    preview: (
      <svg viewBox="0 0 140 180" fill="none" className="tmpl_svg">
        {/* Sidebar */}
        <rect
          x="0"
          y="0"
          width="46"
          height="180"
          rx="0"
          fill="rgba(17,100,102,0.08)"
        />
        <circle cx="23" cy="22" r="12" fill="rgba(17,100,102,0.2)" />
        <rect
          x="8"
          y="40"
          width="30"
          height="4"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.4"
        />
        {[52, 62, 72, 82, 92, 102, 112, 122].map((y) => (
          <rect
            key={y}
            x="8"
            y={y}
            width={18 + (y % 3) * 4}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            key={y}
          />
        ))}
        {/* Main content */}
        <rect
          x="56"
          y="12"
          width="76"
          height="7"
          rx="2"
          fill="var(--color-primary)"
          opacity="0.45"
        />
        <rect
          x="56"
          y="23"
          width="52"
          height="3.5"
          rx="1.5"
          fill="var(--color-border)"
        />
        <rect
          x="56"
          y="36"
          width="30"
          height="4"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        {[44, 54, 64, 80, 90, 100, 116, 126, 136, 152, 162].map((y, i) => (
          <rect
            key={y}
            x="56"
            y={y}
            width={i % 2 === 0 ? 72 : 54}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            opacity="0.6"
          />
        ))}
      </svg>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Spacious, elegant, lots of whitespace",
    pro: true,
    preview: (
      <svg viewBox="0 0 140 180" fill="none" className="tmpl_svg">
        {/* Centered name */}
        <rect
          x="30"
          y="14"
          width="80"
          height="8"
          rx="2"
          fill="var(--color-primary)"
          opacity="0.4"
        />
        <rect
          x="44"
          y="26"
          width="52"
          height="4"
          rx="1.5"
          fill="var(--color-border)"
        />
        {/* Thin divider */}
        <rect
          x="50"
          y="36"
          width="40"
          height="1"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        {/* Spaced sections */}
        {[48, 80, 116, 150].map((y, i) => (
          <g key={y}>
            <rect
              x="12"
              y={y}
              width={28 + i * 4}
              height="3.5"
              rx="1.5"
              fill="var(--color-primary)"
              opacity="0.25"
            />
            <rect
              x="12"
              y={y + 7}
              width="116"
              height="2.5"
              rx="1"
              fill="var(--color-border)"
              opacity="0.6"
            />
            <rect
              x="12"
              y={y + 13}
              width={88}
              height="2.5"
              rx="1"
              fill="var(--color-border)"
              opacity="0.45"
            />
            <rect
              x="12"
              y={y + 19}
              width={70}
              height="2.5"
              rx="1"
              fill="var(--color-border)"
              opacity="0.35"
            />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "executive",
    name: "Executive",
    desc: "Bold header band, dual-column body",
    pro: true,
    preview: (
      <svg viewBox="0 0 140 180" fill="none" className="tmpl_svg">
        {/* Top colour band */}
        <rect
          x="0"
          y="0"
          width="140"
          height="38"
          rx="0"
          fill="rgba(17,100,102,0.18)"
        />
        <rect
          x="12"
          y="10"
          width="70"
          height="8"
          rx="2"
          fill="var(--color-primary)"
          opacity="0.6"
        />
        <rect
          x="12"
          y="22"
          width="48"
          height="4"
          rx="1.5"
          fill="rgba(17,100,102,0.35)"
        />
        {/* Two columns */}
        <rect
          x="12"
          y="48"
          width="52"
          height="4"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        {[56, 64, 72, 80, 88, 96].map((y) => (
          <rect
            key={y}
            x="12"
            y={y}
            width={44 + (y % 4) * 3}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            opacity="0.65"
          />
        ))}
        <rect
          x="76"
          y="48"
          width="52"
          height="4"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        {[56, 64, 72, 80, 88, 96].map((y) => (
          <rect
            key={y}
            x="76"
            y={y}
            width={40 + (y % 3) * 4}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            opacity="0.65"
          />
        ))}
        {/* Full-width section */}
        <rect
          x="12"
          y="112"
          width="52"
          height="4"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        {[120, 128, 136, 144, 152, 160].map((y) => (
          <rect
            key={y}
            x="12"
            y={y}
            width={96 + (y % 5) * 4}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            opacity="0.6"
          />
        ))}
      </svg>
    ),
  },
];

const TEMPLATE_STORAGE_KEY = "active_template";

export default function Templates() {
  const navigate = useNavigate();
  const [active, setActive] = useState<TemplateId>(
    () =>
      (localStorage.getItem(TEMPLATE_STORAGE_KEY) as TemplateId | null) ??
      "classic",
  );
  const [hoveredPro, setHoveredPro] = useState<TemplateId | null>(null);

  const handleSelect = (id: TemplateId, pro: boolean) => {
    if (pro) {
      setHoveredPro(id);
      return;
    }
    setActive(id);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
  };

  return (
    <div className="templates">
      <div className="templates_bg" aria-hidden="true" />
      <div className="templates_container">
        {/* Header */}
        <motion.div
          className="templates_header"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="templates_badge">Templates</span>
          <h1 className="templates_title">Resume Templates</h1>
          <p className="templates_subtitle">
            4 designs - switch anytime. Your content stays the same.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="templates_grid"
          variants={{
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {TEMPLATES.map((tmpl) => {
            const isActive = active === tmpl.id;
            const showProHint = hoveredPro === tmpl.id;
            return (
              <motion.div
                key={tmpl.id}
                className={`templates_card ${isActive ? "templates_card-active" : ""} ${tmpl.pro ? "templates_card-pro-locked" : ""}`}
                variants={fadeUpVariants}
              >
                {/* Pro badge */}
                {tmpl.pro && <span className="templates_pro-badge">Pro</span>}

                {/* Active badge */}
                {isActive && (
                  <span className="templates_active-badge">Active</span>
                )}

                {/* Preview */}
                <div
                  className="templates_preview"
                  onMouseEnter={() => tmpl.pro && setHoveredPro(tmpl.id)}
                  onMouseLeave={() => setHoveredPro(null)}
                >
                  {tmpl.preview}

                  {/* Pro lock overlay */}
                  {tmpl.pro && (
                    <div className="templates_lock-overlay">
                      <div className="templates_lock-content">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="templates_lock-icon"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <button
                          className="templates_upgrade-btn"
                          onClick={() => navigate("/upgrade")}
                        >
                          Pro only - Upgrade →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="templates_card-body">
                  <h3 className="templates_card-name">{tmpl.name}</h3>
                  <p className="templates_card-desc">{tmpl.desc}</p>
                  <button
                    className={`templates_use-btn ${isActive ? "templates_use-btn-active" : ""}`}
                    onClick={() => handleSelect(tmpl.id, tmpl.pro)}
                    disabled={isActive}
                  >
                    {isActive
                      ? "✓ Active template"
                      : tmpl.pro
                        ? "Upgrade to use"
                        : "Use this template"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          className="templates_note"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          Your active template is used when generating PDF and DOCX downloads
          from the Dashboard.
        </motion.p>
      </div>
    </div>
  );
}
