import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useResume } from "../../context/ResumeContext";
import { saveProfile } from "../../lib/db";
import type { UserProfile, Experience } from "../../types";
import { extractTextFromFile, parseResumeText } from "../../utils/resumeParser";
import type { ParsedFields } from "../../utils/resumeParser";
import Badge from "../../components/Badge/Badge";
import OnboardingModal from "../../components/OnboardingModal/OnboardingModal";
import "./ProfileBuilder.css";

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  yearsOfExperience: string;
  skills: string[];
  degree: string;
  school: string;
  gradYear: string;
  jobTitle: string;
  company: string;
  duration: string;
  jobDesc: string;
  summary: string;
  linkedIn: string;
  portfolio: string;
  resumeFileName: string;
}

type UploadState = "idle" | "parsing" | "done";
const TOTAL_STEPS = 11;

function initForm(
  profile: UserProfile | null,
  user: { name: string; email: string } | null,
): FormData {
  const firstExp = profile?.experiences?.[0];
  const firstEdu = profile?.educations?.[0];
  return {
    name: profile?.name || user?.name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    title: profile?.title || "",
    yearsOfExperience: profile?.yearsOfExperience || "",
    skills: profile?.skills || [],
    degree: firstEdu?.degree || "",
    school: firstEdu?.school || "",
    gradYear: firstEdu?.year || "",
    jobTitle: firstExp?.title || "",
    company: firstExp?.company || "",
    duration: firstExp?.duration || "",
    jobDesc: firstExp?.description || "",
    summary: profile?.summary || "",
    linkedIn: profile?.linkedIn || "",
    portfolio: profile?.portfolio || "",
    resumeFileName: profile?.resumeFileName || "",
  };
}

export default function ProfileBuilder() {
  const { user } = useAuth();
  const { profile, setProfile, setResumeText, setOriginalResume } = useResume();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const hasExisting = !!profile;

  const [showOnboarding, setShowOnboarding] = useState(
    () => !hasExisting && !localStorage.getItem("onboarding_seen"),
  );

  const [showUpload, setShowUpload] = useState(!hasExisting);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState<FormData>(() => initForm(profile, user));
  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());

  const [extraExperiences, setExtraExperiences] = useState<Experience[]>([]);
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [triedProceed, setTriedProceed] = useState(false);

  useEffect(() => {
    if (!showUpload) setTimeout(() => inputRef.current?.focus(), 60);
  }, [step, showUpload]);

  const setField = (key: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setPrefilled((prev) => {
      const n = new Set(prev);
      n.delete(key as string);
      return n;
    });
  };

  const addSkill = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, "");
    if (
      trimmed &&
      !form.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setField("skills", [...form.skills, trimmed]);
    }
    setSkillInput("");
  };

  const getSkillSuggestions = (): string[] => {
    const title = form.title.toLowerCase();
    const map: Record<string, string[]> = {
      frontend: [
        "React",
        "TypeScript",
        "CSS",
        "HTML",
        "Next.js",
        "Git",
        "Figma",
        "Jest",
      ],
      react: [
        "React",
        "TypeScript",
        "Redux",
        "CSS",
        "Next.js",
        "Vite",
        "Testing Library",
        "Git",
      ],
      backend: [
        "Node.js",
        "Python",
        "SQL",
        "REST APIs",
        "Docker",
        "Git",
        "PostgreSQL",
        "Redis",
      ],
      fullstack: [
        "React",
        "Node.js",
        "TypeScript",
        "SQL",
        "Docker",
        "REST APIs",
        "Git",
        "AWS",
      ],
      python: [
        "Python",
        "Django",
        "FastAPI",
        "SQL",
        "Docker",
        "REST APIs",
        "Git",
        "Pandas",
      ],
      data: [
        "Python",
        "SQL",
        "Pandas",
        "Machine Learning",
        "Tableau",
        "Excel",
        "R",
        "Statistics",
      ],
      ml: [
        "Python",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "SQL",
        "Git",
        "Jupyter",
        "Statistics",
      ],
      design: [
        "Figma",
        "Adobe XD",
        "Sketch",
        "UI/UX",
        "Prototyping",
        "Illustrator",
        "Photoshop",
        "CSS",
      ],
      product: [
        "Product Strategy",
        "Roadmapping",
        "Agile",
        "SQL",
        "Figma",
        "Analytics",
        "A/B Testing",
        "Jira",
      ],
      devops: [
        "Docker",
        "Kubernetes",
        "AWS",
        "CI/CD",
        "Terraform",
        "Linux",
        "Git",
        "Monitoring",
      ],
      cloud: [
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "Terraform",
        "CI/CD",
        "Linux",
      ],
      mobile: [
        "React Native",
        "Swift",
        "Kotlin",
        "TypeScript",
        "REST APIs",
        "Git",
        "App Store",
        "Expo",
      ],
      android: [
        "Kotlin",
        "Java",
        "Android SDK",
        "REST APIs",
        "Git",
        "MVVM",
        "Room",
        "Jetpack",
      ],
      ios: [
        "Swift",
        "SwiftUI",
        "UIKit",
        "REST APIs",
        "Git",
        "Xcode",
        "Core Data",
        "Combine",
      ],
      marketing: [
        "Google Analytics",
        "SEO",
        "Content Strategy",
        "Social Media",
        "Copywriting",
        "HubSpot",
        "Email Marketing",
        "CRM",
      ],
      manager: [
        "Leadership",
        "Project Management",
        "Agile",
        "Communication",
        "Stakeholder Management",
        "Budgeting",
        "Jira",
        "OKRs",
      ],
    };
    const keys = Object.keys(map);
    const match = keys.find((k) => title.includes(k));
    if (match) return map[match];
    return [
      "Communication",
      "Problem Solving",
      "Teamwork",
      "Microsoft Office",
      "Project Management",
      "Adaptability",
      "Time Management",
      "Leadership",
    ];
  };

  const removeSkill = (skill: string) =>
    setField(
      "skills",
      form.skills.filter((s) => s !== skill),
    );

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && !skillInput && form.skills.length)
      setField("skills", form.skills.slice(0, -1));
  };

  const processFile = async (file: File) => {
    setParseError("");
    setUploadState("parsing");
    setExtraExperiences([]);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);

      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setOriginalResume(e.target.result as string, file.name);
          }
        };
        reader.onerror = () => {
          console.error("Failed to read PDF for preview");
        };
        reader.readAsDataURL(file);
      }

      const parsed = parseResumeText(text);
      setParsedFields(parsed);

      const newPrefilled = new Set<string>();
      const patch: Partial<FormData> = { resumeFileName: file.name };

      const tryMerge = <K extends keyof FormData>(
        k: K,
        val: FormData[K] | undefined,
      ) => {
        if (
          val !== undefined &&
          (Array.isArray(val)
            ? (val as string[]).length > 0
            : (val as string).length > 0)
        ) {
          patch[k] = val;
          newPrefilled.add(k as string);
        }
      };

      tryMerge("name", parsed.name);
      tryMerge("email", parsed.email);
      tryMerge("phone", parsed.phone);
      tryMerge("location", parsed.location);
      tryMerge("title", parsed.title);
      tryMerge("yearsOfExperience", parsed.yearsOfExperience);
      tryMerge("skills", parsed.skills as FormData["skills"] | undefined);
      tryMerge("degree", parsed.degree);
      tryMerge("school", parsed.school);
      tryMerge("gradYear", parsed.gradYear);
      tryMerge("jobTitle", parsed.jobTitle);
      tryMerge("company", parsed.company);
      tryMerge("duration", parsed.duration);
      tryMerge("jobDesc", parsed.jobDesc);
      tryMerge("summary", parsed.summary);
      tryMerge("linkedIn", parsed.linkedIn);
      tryMerge("portfolio", parsed.portfolio ?? parsed.github);

      setForm((prev) => ({ ...prev, ...patch }));
      setPrefilled(newPrefilled);

      if (parsed.experiences && parsed.experiences.length > 1) {
        setExtraExperiences(
          parsed.experiences.slice(1).map((e, i) => ({
            id: (Date.now() + i + 100).toString(),
            title: e.title,
            company: e.company,
            duration: e.duration,
            description: e.description,
          })),
        );
      }

      setUploadState("done");
    } catch (err) {
      setParseError((err as Error).message || "Failed to read file");
      setUploadState("idle");
    }
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const go = (delta: 1 | -1) => {
    if (animating) return;
    setTriedProceed(false);
    setDirection(delta === 1 ? "forward" : "backward");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + delta);
      setAnimating(false);
    }, 220);
  };

  const getStepError = (): string => {
    if (!triedProceed) return "";
    switch (step) {
      case 0:
        return form.name.trim().length < 2
          ? "Please enter your full name (at least 2 characters)."
          : "";
      case 1:
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
          ? "Please enter a valid email address."
          : "";
      case 2:
        return form.phone.trim().length < 6
          ? "Please enter a valid phone number."
          : "";
      case 3:
        return form.location.trim().length < 2
          ? "Please enter your city or location."
          : "";
      case 4:
        return form.title.trim().length < 2
          ? "Please enter your current or target job title."
          : "";
      case 6:
        return form.skills.length === 0
          ? "Add at least one skill to continue."
          : "";
      case 7:
        return form.degree.trim().length === 0
          ? "Please enter your highest degree."
          : "";
      case 8:
        return form.company.trim().length === 0
          ? "Please enter the company name."
          : "";
      case 9:
        return form.summary.trim().length < 20
          ? "Your summary should be at least 20 characters."
          : "";
      default:
        return "";
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return form.name.trim().length > 1;
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      case 2:
        return form.phone.trim().length > 5;
      case 3:
        return form.location.trim().length > 1;
      case 4:
        return form.title.trim().length > 1;
      case 5:
        return form.yearsOfExperience !== "";
      case 6:
        return form.skills.length > 0;
      case 7:
        return form.degree.trim().length > 0;
      case 8:
        return form.company.trim().length > 0;
      case 9:
        return form.summary.trim().length > 20;
      case 10:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      setTriedProceed(true);
      return;
    }
    setTriedProceed(false);
    if (step === TOTAL_STEPS - 1) submitProfile();
    else go(1);
  };

  const handleEnterKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && step !== 9 && step !== 8) {
      e.preventDefault();
      handleNext();
    }
  };

  const submitProfile = async () => {
    setSaving(true);

    const primaryExp: Experience[] = form.company
      ? [
          {
            id: profile?.experiences?.[0]?.id ?? (Date.now() + 1).toString(),
            title: form.jobTitle,
            company: form.company,
            duration: form.duration,
            description: form.jobDesc,
          },
        ]
      : [];

    const experiences: Experience[] = [
      ...primaryExp,
      ...extraExperiences,
    ].slice(0, 5);

    const p: UserProfile = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      location: form.location,
      title: form.title,
      yearsOfExperience: form.yearsOfExperience,
      skills: form.skills,
      educations: form.degree
        ? [
            {
              id: profile?.educations?.[0]?.id ?? Date.now().toString(),
              degree: form.degree,
              school: form.school,
              year: form.gradYear,
            },
          ]
        : (profile?.educations ?? []),
      experiences,
      summary: form.summary,
      linkedIn: form.linkedIn,
      portfolio: form.portfolio,
      resumeFileName: form.resumeFileName,
    };

    setProfile(p);

    if (user) {
      try {
        await saveProfile(user.id, p);
      } catch (err) {
        console.error("Failed to save profile:", err);
      }
    }

    setSaving(false);
    navigate(hasExisting ? "/profile" : "/job-matcher");
  };

  const fieldBadge = (key: string) =>
    prefilled.has(key) ? (
      <span className="profile-builder_prefill-badge">✦ from resume</span>
    ) : null;

  const progress = (step / TOTAL_STEPS) * 100;

  const steps = [
    {
      label: "Full Name",
      question: "What's your full name?",
      hint: "This appears at the top of your resume.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("name")}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="profile-builder_input"
            type="text"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onKeyDown={handleEnterKey}
            autoComplete="name"
          />
        </div>
      ),
    },
    {
      label: "Email",
      question: "What's your professional email?",
      hint: "Used for your resume contact section.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("email")}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="profile-builder_input"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onKeyDown={handleEnterKey}
            autoComplete="email"
          />
        </div>
      ),
    },
    {
      label: "Phone",
      question: "What's your phone number?",
      hint: "Include country code for international applications.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("phone")}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="profile-builder_input"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            onKeyDown={handleEnterKey}
            autoComplete="tel"
          />
        </div>
      ),
    },
    {
      label: "Location",
      question: "Where are you based?",
      hint: 'City and country - e.g. "San Francisco, CA" or "London, UK".',
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("location")}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="profile-builder_input"
            type="text"
            placeholder="San Francisco, CA"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            onKeyDown={handleEnterKey}
            autoComplete="address-level2"
          />
        </div>
      ),
    },
    {
      label: "Job Title",
      question: "What's your current job title?",
      hint: "Or the title you're targeting.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("title")}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="profile-builder_input"
            type="text"
            placeholder="Senior Frontend Engineer"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            onKeyDown={handleEnterKey}
          />
        </div>
      ),
    },
    {
      label: "Experience",
      question: "How many years of experience do you have?",
      hint: "Total professional experience in your field.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("yearsOfExperience")}
          <div
            className="profile-builder_options"
            role="radiogroup"
            aria-label="Years of experience"
          >
            {[
              "Less than 1 year",
              "1–3 years",
              "3–5 years",
              "5–10 years",
              "10+ years",
            ].map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={form.yearsOfExperience === opt}
                className={`profile-builder_option ${form.yearsOfExperience === opt ? "profile-builder_option-selected" : ""}`}
                onClick={() => {
                  setField("yearsOfExperience", opt);
                  setTimeout(() => go(1), 200);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Skills",
      question: "What are your top professional skills?",
      hint: "Type a skill and press Enter or comma to add it.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("skills")}
          <div className="profile-builder_tags-wrapper">
            <div className="profile-builder_tags-input-row">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="profile-builder_input"
                type="text"
                placeholder="e.g. React, Python, Leadership…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => skillInput && addSkill(skillInput)}
              />
              <button
                className="profile-builder_add-btn"
                onClick={() => addSkill(skillInput)}
                disabled={!skillInput.trim()}
              >
                Add
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="profile-builder_tags">
                {form.skills.map((s) => (
                  <span key={s} className="profile-builder_tag">
                    {s}
                    <button
                      className="profile-builder_tag-remove"
                      onClick={() => removeSkill(s)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {parsedFields?.skills && parsedFields.skills.length > 0 && (
              <div className="profile-builder_suggestions profile-builder_resume-skills">
                <span className="profile-builder_suggestions-label profile-builder_resume-skills-label">
                  ✦ Detected from your resume
                </span>
                <div className="profile-builder_suggestions-chips">
                  {parsedFields.skills.map((s) => {
                    const added = form.skills.some(
                      (sk) => sk.toLowerCase() === s.toLowerCase(),
                    );
                    return (
                      <button
                        key={s}
                        className={`profile-builder_suggestion-chip ${added ? "profile-builder_suggestion-chip--added" : ""}`}
                        onClick={() => !added && addSkill(s)}
                        type="button"
                        tabIndex={added ? -1 : 0}
                      >
                        {added ? "✓ " : "+ "}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {(() => {
              const suggestions = getSkillSuggestions().filter(
                (s) =>
                  !parsedFields?.skills?.some(
                    (ps) => ps.toLowerCase() === s.toLowerCase(),
                  ),
              );
              if (suggestions.length === 0) return null;
              return (
                <div className="profile-builder_suggestions">
                  <span className="profile-builder_suggestions-label">
                    {parsedFields?.skills?.length
                      ? "More suggestions"
                      : "Suggested for you"}
                  </span>
                  <div className="profile-builder_suggestions-chips">
                    {suggestions.map((s) => {
                      const added = form.skills.some(
                        (sk) => sk.toLowerCase() === s.toLowerCase(),
                      );
                      return (
                        <button
                          key={s}
                          className={`profile-builder_suggestion-chip ${added ? "profile-builder_suggestion-chip--added" : ""}`}
                          onClick={() => !added && addSkill(s)}
                          type="button"
                          tabIndex={added ? -1 : 0}
                        >
                          {added ? "✓ " : "+ "}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ),
    },
    {
      label: "Education",
      question: "Tell us about your education.",
      hint: "Your most recent or highest degree.",
      content: (
        <div className="profile-builder_multi-inputs">
          <div className="profile-builder_field-wrap">
            {fieldBadge("degree")}
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="profile-builder_input"
              type="text"
              placeholder="Degree - e.g. B.S. Computer Science"
              value={form.degree}
              onChange={(e) => setField("degree", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("school")}
            <input
              className="profile-builder_input"
              type="text"
              placeholder="School / University"
              value={form.school}
              onChange={(e) => setField("school", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("gradYear")}
            <input
              className="profile-builder_input profile-builder_input-sm"
              type="text"
              placeholder="Graduation Year - e.g. 2022"
              value={form.gradYear}
              onChange={(e) => setField("gradYear", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Experience",
      question: "Describe your most recent role.",
      hint: "Your current or last job. Be achievement-focused.",
      content: (
        <div className="profile-builder_multi-inputs">
          <div className="profile-builder_field-wrap">
            {fieldBadge("jobTitle")}
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="profile-builder_input"
              type="text"
              placeholder="Your Job Title"
              value={form.jobTitle}
              onChange={(e) => setField("jobTitle", e.target.value)}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("company")}
            <input
              className="profile-builder_input"
              type="text"
              placeholder="Company Name"
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("duration")}
            <input
              className="profile-builder_input profile-builder_input-sm"
              type="text"
              placeholder="Duration - e.g. Jan 2022 – Present"
              value={form.duration}
              onChange={(e) => setField("duration", e.target.value)}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("jobDesc")}
            <textarea
              className="profile-builder_input profile-builder_input-textarea"
              placeholder="Key responsibilities and achievements…"
              value={form.jobDesc}
              onChange={(e) => setField("jobDesc", e.target.value)}
              rows={3}
            />
          </div>
          {extraExperiences.length > 0 && (
            <div className="profile-builder_extra-experiences">
              <span className="profile-builder_extra-exp-label">
                ✦ {extraExperiences.length} more role
                {extraExperiences.length > 1 ? "s" : ""} detected from your
                resume
              </span>
              {extraExperiences.map((exp) => (
                <div key={exp.id} className="profile-builder_extra-exp-card">
                  <div className="profile-builder_extra-exp-header">
                    <span className="profile-builder_extra-exp-title">
                      {exp.title || "Role"}
                    </span>
                    {exp.duration && (
                      <span className="profile-builder_extra-exp-duration">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                  {exp.company && (
                    <span className="profile-builder_extra-exp-company">
                      {exp.company}
                    </span>
                  )}
                  {exp.description && (
                    <p className="profile-builder_extra-exp-desc">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Summary",
      question: "Write a brief professional summary.",
      hint: "2–4 sentences about your expertise and what you bring to the table.",
      content: (
        <div className="profile-builder_field-wrap">
          {fieldBadge("summary")}
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="profile-builder_input profile-builder_input-textarea profile-builder_input-large"
            placeholder="Experienced engineer with 5+ years building scalable web applications…"
            value={form.summary}
            onChange={(e) => setField("summary", e.target.value)}
            rows={5}
          />
        </div>
      ),
    },
    {
      label: "Links",
      question: "Any online presence to add? (Optional)",
      hint: "LinkedIn and portfolio links strengthen your resume.",
      content: (
        <div className="profile-builder_multi-inputs">
          <div className="profile-builder_field-wrap">
            {fieldBadge("linkedIn")}
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="profile-builder_input"
              type="url"
              placeholder="LinkedIn URL"
              value={form.linkedIn}
              onChange={(e) => setField("linkedIn", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
          <div className="profile-builder_field-wrap">
            {fieldBadge("portfolio")}
            <input
              className="profile-builder_input"
              type="url"
              placeholder="Portfolio or Website URL"
              value={form.portfolio}
              onChange={(e) => setField("portfolio", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
        </div>
      ),
    },
  ];

  if (showUpload) {
    const foundCount = parsedFields
      ? Object.values(parsedFields).filter((v) =>
          Array.isArray(v) ? v.length > 0 : !!v,
        ).length
      : 0;

    const foundSummary = parsedFields
      ? ([
          parsedFields.name && "Name",
          parsedFields.email && "Email",
          parsedFields.phone && "Phone",
          parsedFields.location && "Location",
          parsedFields.title && "Job Title",
          parsedFields.skills?.length
            ? `${parsedFields.skills.length} Skills`
            : null,
          parsedFields.degree && "Education",
          parsedFields.company && "Experience",
          parsedFields.summary && "Summary",
          parsedFields.linkedIn && "LinkedIn",
        ].filter(Boolean) as string[])
      : [];

    return (
      <div className="profile-builder">
        <div className="profile-builder_bg" />
        <div className="profile-builder_upload-phase">
          {uploadState === "idle" && (
            <>
              <div className="profile-builder_upload-header">
                <div className="profile-builder_upload-badge">Step 1</div>
                <h1 className="profile-builder_upload-title">
                  {hasExisting
                    ? "Update your profile"
                    : "Let's build your profile"}
                </h1>
                <p className="profile-builder_upload-subtitle">
                  {hasExisting
                    ? "Upload a new resume to refresh your details, or continue editing your existing profile."
                    : "Upload your resume and we'll auto-fill everything - then you just confirm and tweak."}
                </p>
              </div>

              <div
                ref={dropRef}
                className={`profile-builder_drop-zone ${isDragging ? "profile-builder_drop-zone-active" : ""}`}
                onClick={() =>
                  document.getElementById("pb-file-input")?.click()
                }
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="profile-builder_drop-icon">📄</div>
                <div className="profile-builder_drop-title">
                  {isDragging ? "Drop it here!" : "Drag & drop your resume"}
                </div>
                <div className="profile-builder_drop-subtitle">
                  or click to browse - PDF, DOCX, DOC, TXT supported
                </div>
                <input
                  id="pb-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>

              {parseError && (
                <div className="profile-builder_parse-error">
                  ⚠ {parseError}
                </div>
              )}

              {hasExisting ? (
                <button
                  className="profile-builder_skip-to-steps"
                  onClick={() => setShowUpload(false)}
                >
                  Continue editing my existing profile →
                </button>
              ) : (
                <button
                  className="profile-builder_skip-to-steps"
                  onClick={() => setShowUpload(false)}
                >
                  Skip - I'll enter details manually →
                </button>
              )}
            </>
          )}

          {uploadState === "parsing" && (
            <div className="profile-builder_parsing">
              <div className="profile-builder_parsing-icon">🔍</div>
              <h2 className="profile-builder_parsing-title">
                Reading your resume…
              </h2>
              <p className="profile-builder_parsing-subtitle">
                Extracting your professional details intelligently
              </p>
              <div className="profile-builder_parsing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {uploadState === "done" && (
            <div className="profile-builder_parse-done">
              <div className="profile-builder_parse-done-icon">✅</div>
              <h2 className="profile-builder_parse-done-title">
                Resume parsed successfully!
              </h2>
              <p className="profile-builder_parse-done-subtitle">
                We found <strong>{foundCount} fields</strong> from your resume.
                Review and confirm each one.
              </p>

              <div className="profile-builder_found-grid">
                {foundSummary.map((item, i) => (
                  <div
                    key={item}
                    className="profile-builder_found-item"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="profile-builder_found-check">✓</span>
                    {item}
                  </div>
                ))}
              </div>

              <button
                className="profile-builder_next-btn profile-builder_confirm-btn"
                onClick={() => setShowUpload(false)}
              >
                Confirm & personalize your profile →
              </button>
              <button
                className="profile-builder_skip-to-steps"
                onClick={() => {
                  setUploadState("idle");
                  setParsedFields(null);
                }}
              >
                ← Upload a different resume
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
      <div className="profile-builder">
        <div className="profile-builder_bg" />

        <div className="profile-builder_progress">
          <div className="profile-builder_progress-bar">
            <div
              className="profile-builder_progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="profile-builder_step-meta">
          <span className="profile-builder_step-counter">
            {step + 1} of {TOTAL_STEPS}
          </span>
          {prefilled.size > 0 && (
            <Badge variant="warning">
              ✦ {prefilled.size} field{prefilled.size > 1 ? "s" : ""} pre-filled
              from your resume
            </Badge>
          )}
        </div>

        <div
          className={`profile-builder_card ${animating ? `profile-builder_card-${direction}` : ""}`}
        >
          <div className="profile-builder_step-label">{currentStep.label}</div>
          <h2 className="profile-builder_question">{currentStep.question}</h2>
          <p className="profile-builder_hint">{currentStep.hint}</p>

          <div className="profile-builder_field">{currentStep.content}</div>

          {triedProceed && getStepError() && (
            <div className="profile-builder_field-error" role="alert">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {getStepError()}
            </div>
          )}

          <div className="profile-builder_actions">
            {step > 0 ? (
              <button
                className="profile-builder_back-btn"
                onClick={() => go(-1)}
                disabled={saving}
              >
                ← Back
              </button>
            ) : (
              <button
                className="profile-builder_back-btn"
                onClick={() => setShowUpload(true)}
                disabled={saving}
              >
                ← Upload
              </button>
            )}
            <div className="profile-builder_actions-right">
              {step === TOTAL_STEPS - 1 && (
                <button
                  className="profile-builder_skip-btn"
                  onClick={submitProfile}
                  disabled={saving}
                >
                  {hasExisting ? "Skip & Update" : "Skip & Finish"}
                </button>
              )}
              <button
                className={`profile-builder_next-btn ${!canProceed() ? "profile-builder_next-btn--invalid" : ""}`}
                onClick={handleNext}
                disabled={saving}
                aria-disabled={!canProceed() || saving}
                aria-label={
                  !canProceed() && getStepError()
                    ? (getStepError() ?? undefined)
                    : undefined
                }
              >
                {saving
                  ? "Saving…"
                  : step === TOTAL_STEPS - 1
                    ? hasExisting
                      ? "Update Profile →"
                      : "Build My Resume →"
                    : "Continue →"}
              </button>
            </div>
          </div>

          {step < TOTAL_STEPS - 1 && step !== 5 && (
            <p className="profile-builder_enter-hint">
              Press <kbd>Enter</kbd> to continue
            </p>
          )}
        </div>
      </div>
    </>
  );
}
