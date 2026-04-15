import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner/Spinner";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { saveProfile } from "../../lib/db";
import { useToast } from "../../context/ToastContext";
import { extractTextFromFile } from "../../utils/resumeParser";
import ResumeDocument from "../../components/ResumeDocument/ResumeDocument";
import type { UserProfile } from "../../types";
import "./Dashboard.css";

type DashTab = "ai" | "original";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    profile,
    tailoredResume,
    originalResumeDataUrl,
    originalResumeFileName,
    setProfile,
    setOriginalResume,
    setResumeText,
  } = useResume();
  const navigate = useNavigate();
  const {
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
  } = useToast();
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>("ai");
  const [zoom, setZoom] = useState(100);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [scoreCopied, setScoreCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Local editable copy of profile for the drawer
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Sync draft when edit drawer opens; lock body scroll
  useEffect(() => {
    if (editOpen && profile)
      setDraft({ ...profile, skills: [...profile.skills] });
    document.body.style.overflow = editOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editOpen, profile]);

  // Close drawer on Escape; zoom keyboard shortcuts on AI tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditOpen(false);
        return;
      }
      // Zoom shortcuts - only when not typing in an input
      if (editOpen) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (activeTab === "ai") {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          setZoom((z) => Math.min(150, z + 10));
        }
        if (e.key === "-") {
          e.preventDefault();
          setZoom((z) => Math.max(50, z - 10));
        }
        if (e.key === "0") {
          e.preventDefault();
          setZoom(100);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeTab, editOpen]);

  const persistDraft = useCallback(
    (updated: UserProfile) => {
      setDraft(updated);
      setProfile(updated);
      if (user) saveProfile(user.id, updated);
    },
    [setProfile, user],
  );

  const handleOriginalUpload = async (file: File) => {
    try {
      // Parse text for future re-analysis
      const text = await extractTextFromFile(file);
      setResumeText(text);

      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setOriginalResume(e.target.result as string, file.name);
            toastSuccess("Resume uploaded and ready to view.");
          }
        };
        reader.onerror = () => toastError("Failed to read PDF file.");
        reader.readAsDataURL(file);
      } else {
        // For non-PDF, store a placeholder so the tab shows something
        setOriginalResume("non-pdf", file.name);
        toastSuccess(
          `Resume "${file.name}" uploaded. PDF format shows inline preview.`,
        );
      }
    } catch {
      toastError("Failed to process the uploaded file.");
    }
  };

  const downloadPDF = async () => {
    // Ensure the AI resume tab is visible before capturing
    if (activeTab !== "ai") setActiveTab("ai");
    // Wait a tick for the DOM to render the resume element
    await new Promise((r) => setTimeout(r, 80));
    const el = document.getElementById("resume-preview");
    if (!el) {
      toastError("Could not find resume preview. Please try again.");
      return;
    }
    setDownloading("pdf");
    toastInfo("Generating your PDF…");
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${profile?.name ?? "resume"}_resume.pdf`);
      toastSuccess("PDF downloaded successfully!");
    } catch {
      toastError("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const downloadDOCX = async () => {
    if (!profile) return;
    setDownloading("docx");
    try {
      const resume = tailoredResume ?? profile;
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: profile.name,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: profile.title,
                    bold: true,
                    color: "116466",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun(
                    `${profile.email}  |  ${profile.phone}  |  ${profile.location}`,
                  ),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),

              ...(resume.summary
                ? [
                    new Paragraph({
                      text: "PROFESSIONAL SUMMARY",
                      heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({ text: resume.summary }),
                    new Paragraph({ text: "" }),
                  ]
                : []),

              ...(profile.skills.length > 0
                ? [
                    new Paragraph({
                      text: "SKILLS",
                      heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                      children: [
                        new TextRun(profile.skills.join("  •  ")),
                        ...(tailoredResume?.suggestedSkills.length
                          ? [
                              new TextRun({
                                text: `  •  ${tailoredResume.suggestedSkills.join("  •  ")} (suggested)`,
                                italics: true,
                              }),
                            ]
                          : []),
                      ],
                    }),
                    new Paragraph({ text: "" }),
                  ]
                : []),

              ...(profile.experiences?.length > 0
                ? [
                    new Paragraph({
                      text: "EXPERIENCE",
                      heading: HeadingLevel.HEADING_2,
                    }),
                    ...profile.experiences.flatMap((exp) => [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: exp.title || profile.title,
                            bold: true,
                          }),
                          new TextRun(`  -  ${exp.company}`),
                          ...(exp.duration
                            ? [new TextRun(`  (${exp.duration})`)]
                            : []),
                        ],
                      }),
                      ...(exp.description
                        ? [new Paragraph({ text: exp.description })]
                        : []),
                    ]),
                    new Paragraph({ text: "" }),
                  ]
                : []),

              ...(profile.educations?.length > 0
                ? [
                    new Paragraph({
                      text: "EDUCATION",
                      heading: HeadingLevel.HEADING_2,
                    }),
                    ...profile.educations.map(
                      (edu) =>
                        new Paragraph({
                          children: [
                            new TextRun({ text: edu.degree, bold: true }),
                            new TextRun(`  -  ${edu.school}`),
                            ...(edu.year
                              ? [new TextRun(`  (${edu.year})`)]
                              : []),
                          ],
                        }),
                    ),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.name ?? "resume"}_resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Word document downloaded successfully!");
    } catch {
      toastError("Failed to generate Word document. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const printResume = () => {
    window.print();
  };

  if (!profile) {
    return (
      <div className="dashboard">
        <div className="dashboard_bg" />
        <EmptyState
          className="dashboard_empty"
          icon={
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="10"
                y="6"
                width="44"
                height="52"
                rx="6"
                stroke="#116466"
                strokeWidth="2"
                strokeOpacity="0.35"
              />
              <rect
                x="14"
                y="10"
                width="36"
                height="44"
                rx="4"
                fill="rgba(17,100,102,0.06)"
                stroke="#116466"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <line
                x1="22"
                y1="22"
                x2="42"
                y2="22"
                stroke="#ffcb9a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="22"
                y1="30"
                x2="42"
                y2="30"
                stroke="#116466"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
              <line
                x1="22"
                y1="37"
                x2="36"
                y2="37"
                stroke="#116466"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
              <circle
                cx="48"
                cy="48"
                r="10"
                fill="var(--color-bg)"
                stroke="#116466"
                strokeWidth="2"
              />
              <line
                x1="48"
                y1="44"
                x2="48"
                y2="52"
                stroke="#116466"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="44"
                y1="48"
                x2="52"
                y2="48"
                stroke="#116466"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
          title={`No resume yet, ${user?.name?.split(" ")[0] ?? "there"}!`}
          description="Build your professional profile to generate your personalized, ATS-friendly resume in minutes."
          cta={{
            label: "Build My Profile →",
            onClick: () => navigate("/profile-builder"),
            className: "dashboard_action-btn dashboard_action-btn-primary",
          }}
        />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard_bg" />
      <div className="dashboard_container">
        {/* Top bar */}
        <div className="dashboard_topbar">
          <div className="dashboard_topbar-info">
            <h1 className="dashboard_title">Your Resume</h1>
            <p className="dashboard_subtitle">
              {tailoredResume
                ? `Tailored for job match · ${tailoredResume.matchScore}% match`
                : 'Based on your profile · Click "Match a Job" to tailor it'}
            </p>
          </div>
          <div className="dashboard_topbar-actions">
            <button
              className="dashboard_action-btn dashboard_action-btn-ghost"
              onClick={() => setEditOpen(true)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Resume
            </button>
            <button
              className="dashboard_action-btn dashboard_action-btn-ghost"
              onClick={() => navigate("/profile")}
            >
              ✎ Edit Profile
            </button>
            <button
              className="dashboard_action-btn dashboard_action-btn-secondary"
              onClick={() => navigate("/job-matcher")}
            >
              🎯 Match a Job
            </button>
            <div className="dashboard_download-group">
              <button
                className="dashboard_action-btn dashboard_action-btn-primary"
                onClick={downloadPDF}
                disabled={downloading !== null}
              >
                {downloading === "pdf" ? (
                  <Spinner size="sm" />
                ) : (
                  "⬇ Download PDF"
                )}
              </button>
              <button
                className="dashboard_action-btn dashboard_action-btn-outline"
                onClick={downloadDOCX}
                disabled={downloading !== null}
              >
                {downloading === "docx" ? (
                  <Spinner size="sm" />
                ) : (
                  "⬇ Download DOCX"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Match Score Bar */}
        {tailoredResume && (
          <div className="dashboard_match-bar">
            <div className="dashboard_match-bar-info">
              <span className="dashboard_match-bar-label">Job Match Score</span>
              <div className="dashboard_match-bar-right">
                <button
                  className="dashboard_match-bar-score"
                  title="Click to copy score"
                  aria-label="Copy match score"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(`${tailoredResume.matchScore}%`)
                      .catch(() => {});
                    setScoreCopied(true);
                    setTimeout(() => setScoreCopied(false), 1800);
                  }}
                >
                  {scoreCopied ? "✓ Copied!" : `${tailoredResume.matchScore}%`}
                </button>
                <button
                  className="dashboard_match-bar-toggle"
                  onClick={() => setScoreExpanded((v) => !v)}
                  aria-expanded={scoreExpanded}
                >
                  {scoreExpanded ? "Hide breakdown ▲" : "See breakdown ▼"}
                </button>
              </div>
            </div>
            <div className="dashboard_match-bar-track">
              <div
                className="dashboard_match-bar-fill"
                style={{ width: `${tailoredResume.matchScore}%` }}
              />
            </div>

            {/* Expandable breakdown */}
            {scoreExpanded && (
              <div className="dashboard_score-breakdown">
                {tailoredResume.matchedSkills.length > 0 && (
                  <div className="dashboard_score-section">
                    <span className="dashboard_score-section-label dashboard_score-section-label--matched">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Matched ({tailoredResume.matchedSkills.length})
                    </span>
                    <div className="dashboard_score-chips">
                      {tailoredResume.matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="dashboard_score-chip dashboard_score-chip--matched"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tailoredResume.suggestedSkills.length > 0 && (
                  <div className="dashboard_score-section">
                    <span className="dashboard_score-section-label dashboard_score-section-label--missing">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Suggested to add ({tailoredResume.suggestedSkills.length})
                    </span>
                    <div className="dashboard_score-chips">
                      {tailoredResume.suggestedSkills.map((s) => (
                        <span
                          key={s}
                          className="dashboard_score-chip dashboard_score-chip--missing"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab switcher */}
        <div className="dashboard_tabs">
          <button
            className={`dashboard_tab ${activeTab === "ai" ? "dashboard_tab-active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            AI Resume
            {tailoredResume && (
              <Badge variant="primary">{tailoredResume.matchScore}%</Badge>
            )}
          </button>
          <button
            className={`dashboard_tab ${activeTab === "original" ? "dashboard_tab-active" : ""}`}
            onClick={() => setActiveTab("original")}
          >
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
            </svg>
            Original Resume
            {originalResumeFileName && (
              <span className="dashboard_tab-filename">
                {originalResumeFileName}
              </span>
            )}
          </button>
        </div>

        {/* AI Resume Preview */}
        {activeTab === "ai" && (
          <>
            <div className="dashboard_preview-toolbar">
              <div className="dashboard_zoom-controls">
                <button
                  className="dashboard_zoom-btn"
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <input
                  type="range"
                  className="dashboard_zoom-slider"
                  min={50}
                  max={150}
                  step={5}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom level"
                  style={
                    {
                      "--zoom-pct": `${((zoom - 50) / 100) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <button
                  className="dashboard_zoom-btn"
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <span className="dashboard_zoom-label">{zoom}%</span>
                <button
                  className="dashboard_zoom-reset"
                  onClick={() => setZoom(100)}
                  aria-label="Reset zoom"
                  style={{ display: zoom !== 100 ? undefined : "none" }}
                >
                  Reset
                </button>
              </div>
              <button
                className="dashboard_action-btn dashboard_action-btn-ghost dashboard_print-btn"
                onClick={printResume}
                aria-label="Print resume"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>
            <div className="dashboard_preview" ref={previewRef}>
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease",
                }}
              >
                <ResumeDocument profile={profile} tailored={tailoredResume} />
              </div>
            </div>
          </>
        )}

        {/* Original Resume Preview */}
        {activeTab === "original" && (
          <div className="dashboard_original-resume">
            {/* Hidden upload input */}
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleOriginalUpload(file);
                e.target.value = "";
              }}
            />

            {originalResumeDataUrl && originalResumeDataUrl !== "non-pdf" ? (
              <>
                <div className="dashboard_original-toolbar">
                  <span className="dashboard_original-label">
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
                    </svg>
                    {originalResumeFileName}
                  </span>
                  <div className="dashboard_original-toolbar-actions">
                    <button
                      className="dashboard_action-btn dashboard_action-btn-ghost"
                      onClick={() => uploadInputRef.current?.click()}
                      title="Replace with a new resume"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4.87" />
                      </svg>
                      Replace
                    </button>
                    <a
                      href={originalResumeDataUrl}
                      download={originalResumeFileName ?? "resume.pdf"}
                      className="dashboard_action-btn dashboard_action-btn-outline"
                    >
                      ⬇ Download Original
                    </a>
                  </div>
                </div>
                <object
                  data={originalResumeDataUrl}
                  type="application/pdf"
                  className="dashboard_pdf-viewer"
                  title="Original uploaded resume"
                  aria-label="Original uploaded resume"
                >
                  <div className="dashboard_pdf-fallback">
                    <p>Your browser cannot display PDFs inline.</p>
                    <a
                      href={originalResumeDataUrl}
                      download={originalResumeFileName ?? "resume.pdf"}
                      className="dashboard_action-btn dashboard_action-btn-primary"
                    >
                      ⬇ Download PDF
                    </a>
                  </div>
                </object>
              </>
            ) : originalResumeDataUrl === "non-pdf" ? (
              /* Non-PDF uploaded - show info + replace option */
              <div className="dashboard_original-empty">
                <div className="dashboard_original-nonpdf-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3>{originalResumeFileName}</h3>
                <p>
                  Inline preview is only available for PDF files. Upload a PDF
                  to view it here.
                </p>
                <button
                  className="dashboard_action-btn dashboard_action-btn-primary"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload PDF Resume
                </button>
              </div>
            ) : (
              <EmptyState
                className="dashboard_original-empty"
                icon={
                  <svg
                    width="52"
                    height="52"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                }
                title="No resume uploaded yet"
                description="Upload your original resume to review it here. PDF files show inline preview."
                cta={{
                  label: (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Resume
                    </>
                  ),
                  onClick: () => uploadInputRef.current?.click(),
                  className:
                    "dashboard_action-btn dashboard_action-btn-primary",
                }}
                secondaryCta={{
                  label: "Go to Profile Builder",
                  onClick: () => navigate("/profile-builder"),
                  className:
                    "dashboard_action-btn dashboard_action-btn-secondary",
                }}
              />
            )}
          </div>
        )}

        {/* ----- Edit Resume Drawer ----- */}
        {editOpen && draft && (
          <>
            {/* Backdrop */}
            <div
              className="dashboard_drawer-backdrop"
              onClick={() => setEditOpen(false)}
              aria-hidden="true"
            />
            <aside className="dashboard_drawer" aria-label="Edit resume fields">
              <div className="dashboard_drawer-header">
                <h2 className="dashboard_drawer-title">Edit Resume</h2>
                <button
                  className="dashboard_drawer-close"
                  onClick={() => setEditOpen(false)}
                  aria-label="Close editor"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="dashboard_drawer-body">
                {/* Basic Info */}
                <div className="dashboard_drawer-section">
                  <h3 className="dashboard_drawer-section-title">Basic Info</h3>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">Full Name</label>
                    <input
                      className="dashboard_drawer-input"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, name: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                    />
                  </div>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">Job Title</label>
                    <input
                      className="dashboard_drawer-input"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, title: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                    />
                  </div>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">Email</label>
                    <input
                      className="dashboard_drawer-input"
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, email: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                    />
                  </div>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">Phone</label>
                    <input
                      className="dashboard_drawer-input"
                      type="tel"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, phone: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                    />
                  </div>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">Location</label>
                    <input
                      className="dashboard_drawer-input"
                      value={draft.location}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, location: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="dashboard_drawer-section">
                  <h3 className="dashboard_drawer-section-title">Summary</h3>
                  <div className="dashboard_drawer-field">
                    <textarea
                      className="dashboard_drawer-input dashboard_drawer-textarea"
                      value={draft.summary}
                      rows={5}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, summary: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                      placeholder="Professional summary…"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="dashboard_drawer-section">
                  <h3 className="dashboard_drawer-section-title">Skills</h3>
                  <div className="dashboard_drawer-skills">
                    {draft.skills.map((s) => (
                      <span key={s} className="dashboard_drawer-skill">
                        {s}
                        <button
                          className="dashboard_drawer-skill-remove"
                          aria-label={`Remove ${s}`}
                          onClick={() => {
                            const updated = {
                              ...draft,
                              skills: draft.skills.filter((sk) => sk !== s),
                            };
                            persistDraft(updated);
                            setDraft(updated);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="dashboard_drawer-skill-input-row">
                    <input
                      className="dashboard_drawer-input"
                      placeholder="Add skill…"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          (e.key === "Enter" || e.key === ",") &&
                          skillInput.trim()
                        ) {
                          e.preventDefault();
                          const s = skillInput.trim().replace(/,$/, "");
                          if (
                            s &&
                            !draft.skills.some(
                              (sk) => sk.toLowerCase() === s.toLowerCase(),
                            )
                          ) {
                            const updated = {
                              ...draft,
                              skills: [...draft.skills, s],
                            };
                            persistDraft(updated);
                            setDraft(updated);
                          }
                          setSkillInput("");
                        }
                      }}
                    />
                    <button
                      className="dashboard_drawer-add-btn"
                      disabled={!skillInput.trim()}
                      onClick={() => {
                        const s = skillInput.trim();
                        if (
                          s &&
                          !draft.skills.some(
                            (sk) => sk.toLowerCase() === s.toLowerCase(),
                          )
                        ) {
                          const updated = {
                            ...draft,
                            skills: [...draft.skills, s],
                          };
                          persistDraft(updated);
                          setDraft(updated);
                        }
                        setSkillInput("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Links */}
                <div className="dashboard_drawer-section">
                  <h3 className="dashboard_drawer-section-title">Links</h3>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">
                      LinkedIn URL
                    </label>
                    <input
                      className="dashboard_drawer-input"
                      type="url"
                      value={draft.linkedIn}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, linkedIn: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                      placeholder="https://linkedin.com/in/…"
                    />
                  </div>
                  <div className="dashboard_drawer-field">
                    <label className="dashboard_drawer-label">
                      Portfolio / Website
                    </label>
                    <input
                      className="dashboard_drawer-input"
                      type="url"
                      value={draft.portfolio}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, portfolio: e.target.value } : d,
                        )
                      }
                      onBlur={() => draft && persistDraft(draft)}
                      placeholder="https://…"
                    />
                  </div>
                </div>

                <p className="dashboard_drawer-deep-link">
                  Need to edit experience or education?{" "}
                  <button
                    className="dashboard_drawer-profile-link"
                    onClick={() => {
                      setEditOpen(false);
                      navigate("/profile");
                    }}
                  >
                    Open Profile page →
                  </button>
                </p>
              </div>
            </aside>
          </>
        )}

        {/* Footer actions */}
        <div className="dashboard_footer-actions">
          <button
            className="dashboard_action-btn dashboard_action-btn-primary dashboard_action-btn-large"
            onClick={downloadPDF}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? (
              <>
                <Spinner size="sm" /> Generating PDF…
              </>
            ) : (
              "⬇ Download as PDF"
            )}
          </button>
          <button
            className="dashboard_action-btn dashboard_action-btn-outline dashboard_action-btn-large"
            onClick={downloadDOCX}
            disabled={downloading !== null}
          >
            {downloading === "docx" ? (
              <>
                <Spinner size="sm" /> Generating DOCX…
              </>
            ) : (
              "⬇ Download as Word (.docx)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
