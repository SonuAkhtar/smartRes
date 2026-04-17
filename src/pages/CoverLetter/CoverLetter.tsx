import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import Spinner from "../../components/Spinner/Spinner";
import { useResume } from "../../context/ResumeContext";
import { useToast } from "../../context/ToastContext";
import { fadeUpVariants, EASE_SPRING, DURATION } from "../../lib/motion";
import "./CoverLetter.css";

type Source = "history" | "paste";
type Tone = "professional" | "conversational" | "bold";

const TONE_OPTIONS: { value: Tone; label: string; desc: string }[] = [
  {
    value: "professional",
    label: "Professional",
    desc: "Formal, measured, polished",
  },
  {
    value: "conversational",
    label: "Conversational",
    desc: "Friendly, natural, approachable",
  },
  { value: "bold", label: "Bold", desc: "Confident, direct, memorable" },
];

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function buildLocalCoverLetter(
  profile: {
    name: string;
    title: string;
    summary: string;
    skills: string[];
  } | null,
  company: string,
  role: string,
  tone: Tone,
): string {
  const name = profile?.name ?? "Your Name";
  const title = profile?.title ?? "Professional";
  const skills = profile?.skills?.slice(0, 5).join(", ") ?? "relevant skills";
  const greeting = company
    ? `Dear ${company} Hiring Team,`
    : "Dear Hiring Manager,";

  const openers: Record<Tone, string> = {
    professional: `I am writing to express my interest in the ${role || "open position"} at ${company || "your company"}. With my background as a ${title} and experience in ${skills}, I am confident in my ability to contribute meaningfully to your team.`,
    conversational: `I'd love to be considered for the ${role || "open role"} at ${company || "your company"}. As a ${title} who has worked with ${skills}, I think this could be a great fit for both of us.`,
    bold: `The ${role || "open position"} at ${company || "your company"} is exactly the challenge I've been looking for. As a ${title} specialising in ${skills}, I don't just meet your requirements - I exceed them.`,
  };

  const middles: Record<Tone, string> = {
    professional: `Throughout my career I have developed strong competencies in ${skills}. I am particularly drawn to ${company || "your company"} because of its reputation for innovation and commitment to excellence. I believe my background aligns closely with the requirements of this role and I am eager to bring my skills to your team.\n\nIn my previous roles I have successfully delivered results by applying a structured, detail-oriented approach. I am a collaborative team member who thrives in fast-paced environments and consistently meets deadlines.`,
    conversational: `I've spent my career building up experience in ${skills}, and I genuinely enjoy the craft. What caught my eye about ${company || "your company"} is how seriously you take both the product and the people who build it. That matters to me.\n\nI'm the kind of person who digs in, asks good questions, and gets things done - without a lot of hand-holding. I work well across teams and I'm comfortable with ambiguity.`,
    bold: `I have a proven track record of delivering results in ${skills} - not just checking boxes, but driving meaningful outcomes. ${company || "Your company"}'s work in this space is exactly where I want to be.\n\nI bring a rare combination of technical depth and strategic thinking. I don't wait to be told what needs fixing - I find it, and I fix it.`,
  };

  const closers: Record<Tone, string> = {
    professional: `I would welcome the opportunity to discuss how my experience can contribute to ${company || "your organisation"}. Thank you for your time and consideration. I look forward to hearing from you.`,
    conversational: `I'd love to chat more about the role and what you're building. Thanks so much for taking the time to read this - I hope to hear from you soon!`,
    bold: `I'm ready to hit the ground running from day one. Let's talk about how I can make an impact at ${company || "your company"}.`,
  };

  return `${greeting}\n\n${openers[tone]}\n\n${middles[tone]}\n\n${closers[tone]}\n\nSincerely,\n${name}`;
}

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

async function generateWithAI(
  jd: string,
  company: string,
  role: string,
  profile: {
    name: string;
    title: string;
    summary: string;
    skills: string[];
  } | null,
  tone: Tone,
): Promise<string> {
  if (!API_KEY) throw new Error("No API key");
  const toneGuide: Record<Tone, string> = {
    professional:
      "formal, measured, and polished - suitable for corporate roles",
    conversational:
      "friendly, natural, and approachable - warm but professional",
    bold: "confident, direct, and memorable - assertive without arrogance",
  };
  const prompt = `Write a cover letter for the following job. Return ONLY the cover letter text - no JSON, no markdown, no commentary.

Tone: ${toneGuide[tone]}
Applicant name: ${profile?.name ?? "Applicant"}
Applicant title: ${profile?.title ?? "Professional"}
Applicant skills: ${profile?.skills?.join(", ") ?? ""}
Applicant summary: ${profile?.summary ?? ""}
Company: ${company}
Role: ${role}
Job Description:
${jd.slice(0, 2000)}

Write a 3-paragraph cover letter. Start with "Dear ${company ? `${company} Hiring Team` : "Hiring Manager"}," and end with "Sincerely,\\n${profile?.name ?? "Applicant"}".`;

  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
    );
    if (res.status === 404) continue; // model not available, try next
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (text) return text;
  }

  throw new Error("All Gemini models unavailable");
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function CoverLetter() {
  const { profile, jobHistory } = useResume();
  const { success, error } = useToast();

  const [source, setSource] = useState<Source>("paste");
  const [selectedEntry, setSelectedEntry] = useState<string>("");
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [usedAI, setUsedAI] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectiveJd =
    source === "history"
      ? (jobHistory.find((e) => e.id === selectedEntry)?.fullJD ?? "")
      : jd;

  const effectiveCompany =
    source === "history"
      ? (jobHistory.find((e) => e.id === selectedEntry)?.company ?? company)
      : company;

  const canGenerate =
    (source === "paste" ? jd.trim().length > 20 : !!selectedEntry) &&
    !!role.trim();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    try {
      let text = "";
      if (API_KEY) {
        try {
          text = await generateWithAI(
            effectiveJd,
            effectiveCompany,
            role,
            profile,
            tone,
          );
          setUsedAI(true);
        } catch (aiErr) {
          console.warn("AI generation failed, using local template:", aiErr);
          text = buildLocalCoverLetter(profile, effectiveCompany, role, tone);
          setUsedAI(false);
          error("AI unavailable - generated using local template instead.");
        }
      } else {
        text = buildLocalCoverLetter(profile, effectiveCompany, role, tone);
        setUsedAI(false);
      }
      setLetter(text);
    } catch {
      const text = buildLocalCoverLetter(profile, effectiveCompany, role, tone);
      setLetter(text);
      setUsedAI(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success("Copied to clipboard");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${effectiveCompany || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    const paragraphs = letter.split("\n").map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
          spacing: { after: line === "" ? 120 : 0 },
        }),
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${effectiveCompany || "draft"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    success("Downloaded as .docx");
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(letter, maxWidth);
    let y = margin;
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
    doc.save(`cover-letter-${effectiveCompany || "draft"}.pdf`);
    success("Downloaded as .pdf");
  };

  const wc = wordCount(letter);
  const readMins = Math.max(1, Math.round(wc / 200));

  return (
    <div className="cl">
      <div className="cl_bg" aria-hidden="true" />
      <div className="cl_container">
        <motion.div
          className="cl_header"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="cl_badge">AI-Powered</span>
          <h1 className="cl_title">Cover Letter Generator</h1>
          <p className="cl_subtitle">
            Generate a tailored cover letter in seconds. Edit it to make it
            yours.
          </p>
        </motion.div>

        <div className="cl_layout">
          <motion.div
            className="cl_panel cl_panel-left"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="cl_section">
              <label className="cl_label">Job Source</label>
              <div className="cl_source-toggle" role="group">
                <button
                  className={`cl_source-btn ${source === "paste" ? "cl_source-btn-active" : ""}`}
                  onClick={() => setSource("paste")}
                >
                  Paste JD
                </button>
                <button
                  className={`cl_source-btn ${source === "history" ? "cl_source-btn-active" : ""}`}
                  onClick={() => setSource("history")}
                  disabled={jobHistory.length === 0}
                  title={
                    jobHistory.length === 0 ? "No job history yet" : undefined
                  }
                >
                  From History
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {source === "paste" ? (
                <motion.div
                  key="paste"
                  className="cl_section"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: DURATION.fast, ease: EASE_SPRING }}
                >
                  <label className="cl_label" htmlFor="cl-jd">
                    Job Description
                  </label>
                  <textarea
                    id="cl-jd"
                    className="cl_textarea"
                    placeholder="Paste the job description here…"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    rows={6}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  className="cl_section"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: DURATION.fast, ease: EASE_SPRING }}
                >
                  <label className="cl_label" htmlFor="cl-history">
                    Select Analysis
                  </label>
                  <select
                    id="cl-history"
                    className="cl_select"
                    value={selectedEntry}
                    onChange={(e) => {
                      setSelectedEntry(e.target.value);
                      const entry = jobHistory.find(
                        (h) => h.id === e.target.value,
                      );
                      if (entry) setCompany(entry.company);
                    }}
                  >
                    <option value="">Choose a job analysis…</option>
                    {jobHistory.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.company} -{" "}
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="cl_row">
              <div className="cl_section cl_section-half">
                <label className="cl_label" htmlFor="cl-company">
                  Company
                </label>
                <input
                  id="cl-company"
                  className="cl_input"
                  placeholder="Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="cl_section cl_section-half">
                <label className="cl_label" htmlFor="cl-role">
                  Role <span className="cl_required">*</span>
                </label>
                <input
                  id="cl-role"
                  className="cl_input"
                  placeholder="Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="cl_section">
              <label className="cl_label">Tone</label>
              <div className="cl_tone-grid">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`cl_tone-card ${tone === opt.value ? "cl_tone-card-active" : ""}`}
                    onClick={() => setTone(opt.value)}
                    role="radio"
                    aria-checked={tone === opt.value}
                  >
                    <span className="cl_tone-label">{opt.label}</span>
                    <span className="cl_tone-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="cl_generate-btn"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Generating…
                </>
              ) : letter ? (
                <>↺ Regenerate</>
              ) : (
                <>Generate Cover Letter →</>
              )}
            </button>

            {!canGenerate && !loading && (
              <p className="cl_hint">
                {source === "paste" && jd.trim().length <= 20
                  ? "Paste a job description to continue"
                  : source === "history" && !selectedEntry
                    ? "Select a job analysis to continue"
                    : "Enter a role title to continue"}
              </p>
            )}
          </motion.div>

          <motion.div
            className="cl_panel cl_panel-right"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {letter ? (
              <>
                <div className="cl_output-meta">
                  <span className="cl_word-count">
                    {wc} words · ~{readMins} min read
                  </span>
                  {usedAI && <span className="cl_ai-badge">AI-generated</span>}
                </div>

                <textarea
                  ref={textareaRef}
                  className="cl_output-textarea"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  spellCheck
                  aria-label="Cover letter content"
                />

                <div className="cl_action-bar">
                  <button className="cl_action-btn" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ width: 14, height: 14 }}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ width: 14, height: 14 }}
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button className="cl_action-btn" onClick={handleDownloadTxt}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    .txt
                  </button>
                  <button className="cl_action-btn" onClick={handleDownloadPdf}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    .pdf
                  </button>
                  <button
                    className="cl_action-btn"
                    onClick={handleDownloadDocx}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    .docx
                  </button>
                </div>
              </>
            ) : (
              <div className="cl_empty-output">
                <div className="cl_empty-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <p className="cl_empty-text">
                  Your cover letter will appear here
                </p>
                <p className="cl_empty-sub">
                  Fill in the details on the left and click Generate
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
