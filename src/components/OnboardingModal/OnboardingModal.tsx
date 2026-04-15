import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./OnboardingModal.css";

const SLIDES = [
  {
    badge: "Welcome",
    title: "Land your next job\nfaster with AI",
    body: "SmartRes tailors your resume to any job in seconds - highlighting the right skills, fixing gaps, and generating a polished CV that gets past ATS filters.",
    illustration: (
      <svg viewBox="0 0 120 96" fill="none" className="ob_illustration">
        {/* Resume sheet */}
        <rect
          x="20"
          y="8"
          width="80"
          height="80"
          rx="6"
          fill="var(--color-surface-raised)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
        <rect
          x="32"
          y="20"
          width="56"
          height="6"
          rx="3"
          fill="var(--color-primary)"
          opacity="0.3"
        />
        <rect
          x="32"
          y="32"
          width="40"
          height="4"
          rx="2"
          fill="var(--color-border)"
        />
        <rect
          x="32"
          y="40"
          width="48"
          height="4"
          rx="2"
          fill="var(--color-border)"
        />
        <rect
          x="32"
          y="48"
          width="36"
          height="4"
          rx="2"
          fill="var(--color-border)"
        />
        <rect
          x="32"
          y="60"
          width="56"
          height="3"
          rx="1.5"
          fill="var(--color-border)"
          opacity="0.6"
        />
        <rect
          x="32"
          y="67"
          width="44"
          height="3"
          rx="1.5"
          fill="var(--color-border)"
          opacity="0.6"
        />
        <rect
          x="32"
          y="74"
          width="50"
          height="3"
          rx="1.5"
          fill="var(--color-border)"
          opacity="0.6"
        />
        {/* AI sparkle */}
        <circle
          cx="90"
          cy="22"
          r="12"
          fill="rgba(17,100,102,0.12)"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <path
          d="M90 16l1.5 4.5L96 22l-4.5 1.5L90 28l-1.5-4.5L84 22l4.5-1.5z"
          fill="var(--color-primary)"
        />
      </svg>
    ),
  },
  {
    badge: "Step 1",
    title: "Build your profile\nin 3 minutes",
    body: "Answer one question at a time - or just upload your existing resume and we'll auto-fill everything. Your profile is the foundation for every tailored resume.",
    illustration: (
      <svg viewBox="0 0 120 96" fill="none" className="ob_illustration">
        {/* Person circle */}
        <circle
          cx="60"
          cy="32"
          r="16"
          fill="rgba(17,100,102,0.1)"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <circle
          cx="60"
          cy="28"
          r="6"
          fill="var(--color-primary)"
          opacity="0.4"
        />
        <path
          d="M44 48c0-8.8 7.2-16 16-16s16 7.2 16 16"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Progress steps */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle
              cx={22 + i * 26}
              cy="76"
              r="7"
              fill={
                i < 2 ? "var(--color-primary)" : "var(--color-surface-raised)"
              }
              stroke={i < 2 ? "var(--color-primary)" : "var(--color-border)"}
              strokeWidth="1.5"
            />
            {i < 3 && (
              <line
                x1={29 + i * 26}
                y1="76"
                x2={41 + i * 26}
                y2="76"
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
            )}
            {i < 2 && (
              <path
                d={`M${18 + i * 26} 76l3 3 6-6`}
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}
      </svg>
    ),
  },
  {
    badge: "Step 2",
    title: "Match to any job,\ninstantly",
    body: "Paste any job description and get your tailored resume with a match score, missing skills highlighted, and AI-suggested improvements - in seconds.",
    illustration: (
      <svg viewBox="0 0 120 96" fill="none" className="ob_illustration">
        {/* Two documents */}
        <rect
          x="8"
          y="16"
          width="46"
          height="64"
          rx="5"
          fill="var(--color-surface-raised)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
        <rect
          x="66"
          y="16"
          width="46"
          height="64"
          rx="5"
          fill="rgba(17,100,102,0.06)"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        {/* Left doc lines */}
        {[28, 36, 44, 52, 60, 68].map((y, i) => (
          <rect
            key={y}
            x="16"
            y={y}
            width={i % 2 === 0 ? 30 : 22}
            height="3"
            rx="1.5"
            fill="var(--color-border)"
            opacity="0.7"
          />
        ))}
        {/* Right doc lines with highlights */}
        {[28, 36, 44, 52, 60, 68].map((y, i) => (
          <rect
            key={y}
            x="74"
            y={y}
            width={i % 2 === 0 ? 30 : 22}
            height="3"
            rx="1.5"
            fill={i < 3 ? "var(--color-primary)" : "var(--color-border)"}
            opacity={i < 3 ? "0.35" : "0.7"}
          />
        ))}
        {/* Arrow between */}
        <path
          d="M57 48l6 0M60 45l3 3-3 3"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Match score chip */}
        <rect
          x="72"
          y="10"
          width="22"
          height="10"
          rx="5"
          fill="var(--color-primary)"
        />
        <text
          x="83"
          y="17.5"
          textAnchor="middle"
          fontSize="5.5"
          fill="white"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          92%
        </text>
      </svg>
    ),
  },
];

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const navigate = useNavigate();

  const isLast = slide === SLIDES.length - 1;

  const goTo = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const handleCTA = () => {
    localStorage.setItem("onboarding_seen", "true");
    onClose();
    if (slide < SLIDES.length - 1) {
      goTo(slide + 1);
      return;
    }
    navigate("/profile-builder");
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_seen", "true");
    onClose();
  };

  return (
    <div
      className="ob_overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to SmartRes"
    >
      <motion.div
        className="ob_panel"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Progress dots */}
        <div className="ob_dots" aria-label="Slide progress">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ob_dot ${i === slide ? "ob_dot-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="ob_slides-viewport">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={slide}
              className="ob_slide"
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ob_illustration-wrap">
                {SLIDES[slide].illustration}
              </div>
              <span className="ob_badge">{SLIDES[slide].badge}</span>
              <h2 className="ob_title">{SLIDES[slide].title}</h2>
              <p className="ob_body">{SLIDES[slide].body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="ob_actions">
          <button className="ob_cta" onClick={handleCTA}>
            {isLast ? "Let's build your profile →" : "Next →"}
          </button>
          {!isLast && (
            <button className="ob_skip" onClick={handleSkip}>
              Skip for now
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
