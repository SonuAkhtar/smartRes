import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Footer.css";

gsap.registerPlugin(ScrollTrigger);

const productLinks = [
  { label: "Job Matcher", to: "/job-matcher" },
  { label: "Job History", to: "/job-history" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Profile", to: "/profile" },
];

const resourceLinks = [
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Features", to: "/#features" },
  { label: "Get Started", to: "/auth" },
];

const ticker = [
  "AI-Powered Matching",
  "ATS-Friendly Exports",
  "PDF & Word Downloads",
  "Smart Profile Builder",
  "Real-Time Suggestions",
  "Interview-Ready Resumes",
];

const WORDMARK = "SMARTRES";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer_wordmark-char",
        { opacity: 0, y: 50, rotateX: -55 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.055,
          duration: 0.75,
          ease: "back.out(1.3)",
          scrollTrigger: {
            trigger: ".footer_wordmark",
            start: "top 90%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".footer_hero-headline",
        { opacity: 0, x: -48 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".footer_hero",
            start: "top 88%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".footer_hero-cta",
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: "back.out(1.5)",
          delay: 0.25,
          scrollTrigger: {
            trigger: ".footer_hero",
            start: "top 88%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".footer_brand-col",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".footer_grid",
            start: "top 90%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".footer_link-col",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: "power3.out",
          delay: 0.12,
          scrollTrigger: {
            trigger: ".footer_grid",
            start: "top 90%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".footer_bottom",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".footer_bottom",
            start: "top 96%",
            once: true,
          },
        },
      );

      gsap.to(".footer_orb-1", {
        y: -22,
        x: 12,
        duration: 5.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(".footer_orb-2", {
        y: 18,
        x: -14,
        duration: 7,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(".footer_orb-3", {
        y: -14,
        x: 9,
        duration: 6.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1,
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer_orb footer_orb-1" />
      <div className="footer_orb footer_orb-2" />
      <div className="footer_orb footer_orb-3" />

      <div className="footer_ticker-wrap" aria-hidden>
        <div className="footer_ticker">
          {[...ticker, ...ticker].map((item, i) => (
            <span key={i} className="footer_ticker-item">
              <span className="footer_ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="footer_container">
        <div className="footer_wordmark" aria-hidden>
          {WORDMARK.split("").map((ch, i) => (
            <span key={i} className="footer_wordmark-char">
              {ch}
            </span>
          ))}
        </div>

        <div className="footer_hero">
          <h2 className="footer_hero-headline">
            Land your dream job.
            <br />
            <span className="footer_hero-headline--accent">Start for free.</span>
          </h2>
          <Link to="/auth" className="footer_hero-cta">
            Get Started
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="footer_divider" />

        <div className="footer_grid">
          <div className="footer_brand-col">
            <Link to="/" className="footer_logo">
              <div className="footer_logo-icon">R</div>
              <span className="footer_logo-name">SmartRes</span>
            </Link>
            <p className="footer_tagline">
              AI-powered resume tailoring built for modern job seekers.
            </p>
            <div className="footer_social-row">
              <a href="#" className="footer_social-btn" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a href="#" className="footer_social-btn" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="footer_social-btn" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer_link-col">
            <h4 className="footer_col-title">Product</h4>
            <ul className="footer_link-list">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="footer_link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer_link-col">
            <h4 className="footer_col-title">Resources</h4>
            <ul className="footer_link-list">
              {resourceLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="footer_link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer_bottom">
          <p className="footer_copy">
            © 2026 SmartRes. Built with ♥ for job seekers worldwide.
          </p>
          <div className="footer_legal-links">
            <Link to="/privacy" className="footer_legal-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="footer_legal-link">
              Terms of Service
            </Link>
            <Link to="/cookies" className="footer_legal-link">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
