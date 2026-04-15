import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer/Footer";
import "./Home.css";

gsap.registerPlugin(ScrollTrigger);

// ── Intro loading screen ──────────────────────────────────────
function AppIntro({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out quad: shoots up fast, settles near 100
      const eased = 1 - Math.pow(1 - t, 2);
      setPct(Math.round(eased * 100));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setPct(100);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => onDoneRef.current(), 600);
        }, 200);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className={`app-intro${exiting ? " app-intro--exit" : ""}`}
      aria-hidden="true"
    >
      <span className="app-intro__brand">SmartRes</span>
      <div className="app-intro__pct">{pct}%</div>
      <div className="app-intro__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Marquee ───────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Google",
  "Senior Engineer",
  "Meta",
  "Product Manager",
  "Stripe",
  "Data Scientist",
  "Airbnb",
  "DevOps Engineer",
  "Netflix",
  "UI Designer",
  "Spotify",
  "Backend Developer",
  "Figma",
  "ML Engineer",
  "Notion",
  "Full-Stack Developer",
  "Linear",
  "Cloud Architect",
];

// ── App carousel ──────────────────────────────────────────────
const SLIDE_DURATION = 4200;
const APP_SLIDES = [
  { id: "matcher", label: "Job Matcher" },
  { id: "builder", label: "Profile Builder" },
  { id: "tracker", label: "Applications" },
  { id: "interview", label: "Interview Prep" },
] as const;

const TRACKER_APPS = [
  {
    co: "G",
    name: "Google",
    role: "Product Manager",
    status: "Interview",
    variant: "blue",
  },
  {
    co: "A",
    name: "Airbnb",
    role: "UI Designer",
    status: "Offer",
    variant: "green",
  },
  {
    co: "N",
    name: "Netflix",
    role: "ML Engineer",
    status: "Applied",
    variant: "orange",
  },
  {
    co: "F",
    name: "Figma",
    role: "Backend Developer",
    status: "Screening",
    variant: "purple",
  },
] as const;

// ── Features ──────────────────────────────────────────────────
const features: Array<{
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
  banner: string;
  stat: string;
  to: string;
  pill: string;
}> = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Smart Profile Builder",
    desc: "Answer one question at a time. Our guided form makes building your profile feel effortless - just like a conversation.",
    accent: "teal",
    banner: "Profile Builder",
    stat: "11 Steps",
    to: "/profile-builder",
    pill: "Guided",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    title: "AI-Powered Job Matching",
    desc: "Paste any job description and instantly see which skills match and what to add. Tailored suggestions in seconds.",
    accent: "peach",
    banner: "Job Matcher",
    stat: "AI Powered",
    to: "/job-matcher",
    pill: "Instant",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: "One-Click Downloads",
    desc: "Export your tailored resume as a pixel-perfect PDF or editable Word document with a single click.",
    accent: "rose",
    banner: "Resume Export",
    stat: "PDF + DOCX",
    to: "/dashboard",
    pill: "One-Click",
  },
];

// ── Testimonials ──────────────────────────────────────────────
const testimonials = [
  {
    text: "I tailored my resume to 3 different roles in under 20 minutes. Got callbacks from all three. The AI matching is genuinely useful, not just buzzwords.",
    name: "Priya S.",
    role: "Software Engineer, ex-Meta",
    initials: "PS",
    badge: "Top Hire",
    badgeColor: "green",
  },
  {
    text: "Built my resume from scratch in 10 minutes, matched it to a Google JD, and landed the interview. The skills gap feature is a game-changer.",
    name: "James K.",
    role: "Product Manager",
    initials: "JK",
    badge: "Interview Win",
    badgeColor: "blue",
  },
  {
    text: "I've tried 5 resume tools. This is the only one that actually tells you what's missing for each specific job, not just generic advice.",
    name: "Aisha R.",
    role: "Data Analyst",
    initials: "AR",
    badge: "5× Callbacks",
    badgeColor: "coral",
  },
];

// ── Steps ─────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    title: "Create Account",
    desc: "Sign up in seconds - no credit card, no hassle.",
    badge: "Free",
  },
  {
    number: "02",
    title: "Build Your Profile",
    desc: "Complete our guided form with your experience, skills, and education.",
    badge: "Guided",
  },
  {
    number: "03",
    title: "Match to Jobs",
    desc: "Paste any job description and get instant tailored recommendations.",
    badge: "Instant",
  },
  {
    number: "04",
    title: "Download & Apply",
    desc: "Export your optimized resume as PDF or Word and start applying.",
    badge: "PDF + Word",
  },
];

// ── Stats ─────────────────────────────────────────────────────
const stats = [
  { numeric: 10, suffix: "K+", label: "Resumes Created" },
  { numeric: 3, suffix: "×", label: "More Interview Calls" },
  { numeric: 2, suffix: " min", label: "Avg. Tailor Time" },
  { numeric: 98, suffix: "%", label: "ATS-Friendly Rate" },
];

// ── ParticleCanvas (Feature B) ────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(
      48,
      Math.floor((window.innerWidth * window.innerHeight) / 20000),
    );
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.4,
      dx: (Math.random() - 0.5) * 0.22,
      dy: (Math.random() - 0.5) * 0.22,
      o: Math.random() * 0.22 + 0.04,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.dataset.theme === "dark";
      const rgb = isDark ? "112, 145, 230" : "61, 82, 160";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;
        if (p.y < -4) p.y = canvas.height + 4;
        if (p.y > canvas.height + 4) p.y = -4;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="home_particles-canvas"
      aria-hidden="true"
    />
  );
}

// ── StatCounter ───────────────────────────────────────────────
function StatCounter({ numeric, suffix }: { numeric: number; suffix: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const duration = 1500;
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(eased * numeric));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numeric]);

  return (
    <div ref={ref} className="home_stat-value">
      {displayed}
      {suffix}
    </div>
  );
}

// ── Home page ─────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  // ── Carousel auto-advance ──────────────────────────────────
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  useEffect(() => {
    setSlideProgress(0);
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / SLIDE_DURATION, 1);
      setSlideProgress(p * 100);
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setSlideIdx((i) => (i + 1) % APP_SLIDES.length);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [slideIdx]);

  // ── E: Feature card spotlight ──────────────────────────────
  const handleSpotlight = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  // ── GSAP scroll animations ─────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroEls = gsap.utils.toArray<HTMLElement>(".home_hero-content > *");
      gsap.fromTo(
        heroEls,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: "power3.out",
          delay: 0.15,
        },
      );
      // Accent wordmark: per-character stagger (footer-style reveal)
      gsap.set(".home_hero-accent-char", { opacity: 0, y: 32, rotateX: -55 });
      gsap.to(".home_hero-accent-char", {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.038,
        duration: 0.68,
        ease: "back.out(1.3)",
        delay: 0.55,
      });
      gsap.fromTo(
        ".home_hero-visual",
        { opacity: 0, x: 48, scale: 0.94 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.35,
        },
      );

      gsap.utils.toArray<HTMLElement>(".home_section-header").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          },
        );
      });

      gsap.fromTo(
        ".home_feature-card",
        { opacity: 0, y: 48, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.13,
          duration: 0.72,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home_features-grid",
            start: "top 78%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".home_step",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.14,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home_steps-grid",
            start: "top 78%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".home_step-connector",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          stagger: 0.14,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".home_steps-grid",
            start: "top 78%",
            once: true,
          },
          delay: 0.4,
        },
      );

      gsap.fromTo(
        ".home_testimonial-card",
        { opacity: 0, y: 36, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.12,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home_testimonials-grid",
            start: "top 80%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".home_final-cta-container > *",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home_final-cta",
            start: "top 75%",
            once: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="home">
      {showIntro && <AppIntro onDone={() => setShowIntro(false)} />}
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="home_hero">
        <div className="home_hero-bg">
          {/* B: Particle field */}
          <ParticleCanvas />
        </div>

        <div className="home_hero-content">
          <div className="home_hero-badge">
            <span className="home_hero-badge-dot" />
            AI-Powered Resume Tailoring
          </div>

          <h1 className="home_hero-title">
            <span className="home_hero-title-line1">
              Build Smarter Resumes &{" "}
            </span>
            <span
              className="home_hero-accent-block"
              aria-label="Land Better Jobs."
            >
              {"Land Better Jobs.".split("").map((ch, i) => (
                <span
                  key={i}
                  className="home_hero-accent-char"
                  aria-hidden="true"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
          </h1>

          <p className="home_hero-subtitle">
            Tailor your resume to any job description in minutes. Our
            intelligent platform matches your skills, suggests improvements, and
            exports a professional resume that stands out.
          </p>

          <div className="home_hero-actions">
            {user ? (
              <Link to="/dashboard" className="home_cta-primary">
                Go to Dashboard <span className="home_cta-arrow">→</span>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="home_cta-primary">
                  Build My Resume Free <span className="home_cta-arrow">→</span>
                </Link>
                <a href="#how-it-works" className="home_cta-secondary">
                  See How It Works
                </a>
              </>
            )}
          </div>
        </div>

        {/* App screen carousel */}
        <div className="home_hero-visual">
          <div className="home_app-window">
            {/* macOS-style chrome */}
            <div className="home_app-chrome">
              <span className="home_app-chrome-dot home_app-chrome-dot--red" />
              <span className="home_app-chrome-dot home_app-chrome-dot--yellow" />
              <span className="home_app-chrome-dot home_app-chrome-dot--green" />
              <span className="home_app-chrome-label">
                {APP_SLIDES[slideIdx].label}
              </span>
            </div>

            {/* Slides */}
            <div className="home_app-slides">
              {/* Slide 0: Job Matcher */}
              <div
                className={`home_app-slide${slideIdx === 0 ? " home_app-slide--active" : ""}`}
              >
                <div className="home_slide-row home_slide-row--spread">
                  <div className="home_slide-row">
                    <div className="home_slide-company-icon">S</div>
                    <div>
                      <div className="home_slide-job-title">
                        Senior Frontend Engineer
                      </div>
                      <div className="home_slide-job-meta">Stripe · Remote</div>
                    </div>
                  </div>
                  <div className="home_slide-score-ring">
                    <svg viewBox="0 0 36 36" fill="none">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        strokeWidth="3"
                        className="home_slide-ring-bg"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        strokeWidth="3"
                        strokeDasharray="76 88"
                        strokeDashoffset="22"
                        strokeLinecap="round"
                        className="home_slide-ring-fill"
                      />
                    </svg>
                    <span className="home_slide-score-num">87%</span>
                  </div>
                </div>
                <div className="home_slide-section-label">Matched Skills</div>
                <div className="home_slide-tags">
                  {["React", "TypeScript", "Node.js"].map((s) => (
                    <span
                      key={s}
                      className="home_slide-tag home_slide-tag--matched"
                    >
                      {s}
                    </span>
                  ))}
                  <span className="home_slide-tag home_slide-tag--missing">
                    + AWS
                  </span>
                </div>
                <div className="home_slide-bar-track">
                  <div
                    className="home_slide-bar-fill"
                    style={{ width: "87%" }}
                  />
                </div>
                <div className="home_slide-action">Tailor My Resume →</div>
              </div>

              {/* Slide 1: Profile Builder */}
              <div
                className={`home_app-slide${slideIdx === 1 ? " home_app-slide--active" : ""}`}
              >
                <div className="home_slide-steps">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`home_slide-step-dot${n < 3 ? " home_slide-step-dot--done" : n === 3 ? " home_slide-step-dot--active" : ""}`}
                    >
                      {n < 3 ? "✓" : n + 1}
                    </span>
                  ))}
                  <span className="home_slide-steps-label">Step 4 of 11</span>
                </div>
                <div className="home_slide-step-heading">Work Experience</div>
                <div className="home_slide-field">
                  <div className="home_slide-field-label">Job Title</div>
                  <div className="home_slide-field-value">
                    Senior Frontend Engineer
                  </div>
                </div>
                <div className="home_slide-field home_slide-field--active">
                  <div className="home_slide-field-label">Company</div>
                  <div className="home_slide-field-value">
                    Stripe<span className="home_slide-cursor">|</span>
                  </div>
                </div>
                <div className="home_slide-overall-track">
                  <div
                    className="home_slide-overall-fill"
                    style={{ width: "36%" }}
                  />
                </div>
                <div className="home_slide-overall-label">
                  36% profile complete
                </div>
              </div>

              {/* Slide 2: Applications Tracker */}
              <div
                className={`home_app-slide${slideIdx === 2 ? " home_app-slide--active" : ""}`}
              >
                <div className="home_slide-tracker-header">
                  <span className="home_slide-tracker-count">
                    12 Applications
                  </span>
                  <span className="home_slide-tracker-add">+ New</span>
                </div>
                {TRACKER_APPS.map((app) => (
                  <div key={app.name} className="home_slide-app-row">
                    <div className="home_slide-app-icon">{app.co}</div>
                    <div className="home_slide-app-info">
                      <span className="home_slide-app-name">{app.name}</span>
                      <span className="home_slide-app-role">{app.role}</span>
                    </div>
                    <span
                      className={`home_slide-app-badge home_slide-app-badge--${app.variant}`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Slide 3: Interview Prep */}
              <div
                className={`home_app-slide${slideIdx === 3 ? " home_app-slide--active" : ""}`}
              >
                <div className="home_slide-interview-meta">
                  <span className="home_slide-interview-cat">Behavioral</span>
                  <span className="home_slide-interview-diff home_slide-interview-diff--medium">
                    Medium
                  </span>
                </div>
                <div className="home_slide-question">
                  "Tell me about a time you led a team through a challenging
                  technical decision."
                </div>
                <div className="home_slide-ai-tip">
                  <span className="home_slide-ai-label">AI Tip</span>
                  Use the STAR method: Situation → Task → Action → Result
                </div>
                <button className="home_slide-record-btn">
                  <span className="home_slide-record-dot" />
                  Record Answer
                </button>
              </div>
            </div>

            {/* Progress segments */}
            <div className="home_app-progress">
              {APP_SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  className={`home_app-progress-seg${i === slideIdx ? " home_app-progress-seg--active" : i < slideIdx ? " home_app-progress-seg--done" : ""}`}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`View ${slide.label}`}
                >
                  {i === slideIdx && (
                    <span
                      className="home_app-progress-fill"
                      style={{ width: `${slideProgress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="home_hero-orb home_hero-orb-1" />
          <div className="home_hero-orb home_hero-orb-2" />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="home_stats">
        <div className="home_stats-container">
          {stats.map((stat) => (
            <div key={stat.label} className="home_stat">
              <StatCounter numeric={stat.numeric} suffix={stat.suffix} />
              <div className="home_stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="home_features" id="features">
        <div className="home_features-container">
          <div className="home_section-header">
            <div className="home_section-badge">Features</div>
            <h2 className="home_section-title">
              Everything you need to get hired
            </h2>
            <p className="home_section-subtitle">
              From profile creation to tailored downloads - our platform handles
              every step of your job application journey.
            </p>
          </div>
          <div className="home_features-grid">
            {features.map((f) => (
              <div
                key={f.title}
                className={`home_feature-card home_feature-card-${f.accent}`}
                onMouseMove={handleSpotlight}
              >
                <div className="home_feature-spotlight" aria-hidden="true" />
                {/* Colored accent banner */}
                <div
                  className={`home_feature-banner home_feature-banner-${f.accent}`}
                >
                  <span className="home_feature-banner-label">{f.banner}</span>
                  <span className="home_feature-banner-stat">{f.stat}</span>
                </div>
                {/* Card body */}
                <div className="home_feature-body">
                  <div className="home_feature-card-icon-wrap">{f.icon}</div>
                  <div className="home_feature-title-row">
                    <h3 className="home_feature-card-title">{f.title}</h3>
                    <span className="home_feature-pill">{f.pill}</span>
                  </div>
                  <p className="home_feature-card-desc">{f.desc}</p>
                  <Link to={f.to} className="home_feature-cta">
                    Try it free
                    <span className="home_cta-arrow">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="home_testimonials">
        <div className="home_testimonials-container">
          <div className="home_section-header">
            <div className="home_section-badge">Testimonials</div>
            <h2 className="home_section-title">Loved by job seekers</h2>
            <p className="home_section-subtitle">
              Real results from real people who used SmartRes to land interviews
              and offers.
            </p>
          </div>
          <div className="home_testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="home_testimonial-card">
                {/* Person header — name, role, badge */}
                <div className="home_testimonial-header">
                  <div className="home_testimonial-avatar">{t.initials}</div>
                  <div className="home_testimonial-author-info">
                    <div className="home_testimonial-name">{t.name}</div>
                    <div className="home_testimonial-role">{t.role}</div>
                  </div>
                  <span
                    className={`home_testimonial-badge home_testimonial-badge-${t.badgeColor}`}
                  >
                    {t.badge}
                  </span>
                </div>
                {/* Stars */}
                <div className="home_testimonial-stars" aria-label="5 stars">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="#f59e0b"
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="home_testimonial-text">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="home_steps" id="how-it-works">
        <div className="home_steps-container">
          <div className="home_section-header">
            <div className="home_section-badge">Process</div>
            <h2 className="home_section-title">How it works</h2>
            <p className="home_section-subtitle">
              Get from zero to interview-ready in under 10 minutes.
            </p>
          </div>
          <div className="home_steps-grid">
            {steps.map((step) => (
              <div key={step.number} className="home_step">
                <div className="home_step-top">
                  <span className="home_step-badge">{step.badge}</span>
                  <span className="home_step-big-num">{step.number}</span>
                </div>
                <div className="home_step-bottom">
                  <h3 className="home_step-title">{step.title}</h3>
                  <p className="home_step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="home_final-cta">
        <div className="home_final-cta-container">
          <div className="home_final-cta-orb" />
          <div className="home_section-badge home_section-badge-light">
            Get Started
          </div>
          <h2 className="home_final-cta-title">
            Ready to land your{" "}
            <span className="home_hero-title-accent">dream job?</span>
          </h2>
          <p className="home_final-cta-subtitle">
            Join thousands of professionals who have already supercharged their
            job search with SmartRes.
          </p>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="home_final-cta-btn"
          >
            {user ? "Go to Dashboard" : "Start for Free - No Card Required"}
            <span className="home_cta-arrow">→</span>
          </Link>
          {!user && (
            <a href="#how-it-works" className="home_cta-ghost-link">
              See how it works →
            </a>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
