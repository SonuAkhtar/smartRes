/**
 * AI integration module - calls Google Gemini API to tailor a resume to a job description.
 *
 * Requires VITE_GEMINI_API_KEY in .env.local.
 * Always falls back to local keyword analysis if the API is unavailable or fails.
 */

import type {
  UserProfile,
  TailoredResume,
  ResumeSuggestion,
  InterviewQuestion,
  QuestionCategory,
} from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// ----- Local fallback -----

const TECH_KW = [
  "react",
  "angular",
  "vue",
  "next.js",
  "nextjs",
  "typescript",
  "javascript",
  "node.js",
  "nodejs",
  "python",
  "django",
  "fastapi",
  "flask",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "gcp",
  "azure",
  "terraform",
  "ci/cd",
  "git",
  "graphql",
  "rest",
  "api",
  "agile",
  "scrum",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "figma",
  "css",
  "html",
  "tailwind",
  "testing",
  "jest",
  "cypress",
  "swift",
  "kotlin",
  "flutter",
  "rust",
  "go",
  "java",
  "c++",
  "c#",
  "express",
  "spring",
  "rails",
  "php",
  "laravel",
  "linux",
  "bash",
  "microservices",
  "kafka",
  "rabbitmq",
  "elasticsearch",
  "serverless",
  "devops",
  "datadog",
  "prometheus",
  "grafana",
  "webpack",
  "vite",
  "prisma",
  "supabase",
  "excel",
  "powerpoint",
  "word",
  "tableau",
  "power bi",
  "jira",
  "confluence",
  "notion",
  "salesforce",
  "zendesk",
  "hubspot",
  "stripe",
  "firebase",
  "vercel",
  "netlify",
  "redux",
  "zustand",
  "mobx",
  "graphql",
  "trpc",
  "socket.io",
  "websockets",
  "oauth",
  "jwt",
  "auth",
  "security",
  "accessibility",
  "a11y",
  "seo",
  "analytics",
  "leadership",
  "communication",
  "problem-solving",
  "collaboration",
  "mentoring",
];

function normalise(s: string) {
  return s.toLowerCase().replace(/\.js$/i, "").replace(/\s+/g, " ").trim();
}

function skillMatchesJD(skill: string, jdL: string): boolean {
  const norm = normalise(skill);
  if (jdL.includes(norm) || jdL.includes(skill.toLowerCase())) return true;
  // Word-level match: any word > 3 chars from skill appears in JD
  const words = skill.toLowerCase().split(/[\s/,+]+/);
  return words.some((w) => w.length > 3 && jdL.includes(w));
}

function kwInText(kw: string, text: string): boolean {
  const norm = normalise(kw);
  return text.includes(norm) || text.includes(kw.toLowerCase());
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildResumeText(profile: UserProfile, rawText: string): string {
  return [
    profile.name,
    profile.title,
    profile.summary,
    profile.skills.join(" "),
    ...(profile.experiences ?? []).map(
      (e) => `${e.title} ${e.company} ${e.description}`,
    ),
    ...(profile.educations ?? []).map((e) => `${e.degree} ${e.school}`),
    rawText,
  ]
    .join(" ")
    .toLowerCase();
}

// Extract capitalised skill-like words from a JD that aren't already in the profile
function extractJDSkills(jd: string, profileSkillsLower: string[]): string[] {
  const matches =
    jd.match(/\b([A-Z][a-zA-Z0-9.+#-]{1,}(?:\s[A-Z][a-zA-Z0-9.+#-]+)?)\b/g) ??
    [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const key = m.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const alreadyHas = profileSkillsLower.some(
      (s) => s.includes(key) || key.includes(s),
    );
    if (
      !alreadyHas &&
      m.length > 2 &&
      !/^(The|And|Or|For|With|From|This|That|Are|Our|You|Your|We|Be|Is|In|To|Of|A|An|At|On|By|As|If|It|No)$/.test(
        m,
      )
    ) {
      result.push(m);
    }
    if (result.length >= 10) break;
  }
  return result;
}

export function analyzeLocally(
  profile: UserProfile,
  resumeText: string,
  jd: string,
  company: string,
): TailoredResume {
  const jdL = jd.toLowerCase();
  const resumeL = buildResumeText(profile, resumeText);
  const skillsNorm = profile.skills.map(normalise);
  const skillsLower = profile.skills.map((s) => s.toLowerCase());

  // ----- Matched skills ──
  let matchedSkills = profile.skills.filter((s) => skillMatchesJD(s, jdL));

  // Fallback: if nothing matched, try matching TECH_KW that appear in both JD and resume
  if (matchedSkills.length === 0) {
    const resumeKws = TECH_KW.filter(
      (kw) => kwInText(kw, resumeL) && kwInText(kw, jdL),
    );
    matchedSkills = resumeKws.map(cap);
  }

  // ----- Suggested skills (missing from profile but in JD) ──
  let suggestedSkills = TECH_KW.filter((kw) => {
    const inJD = kwInText(kw, jdL);
    const inProfile = skillsNorm.some(
      (us) => normalise(kw) === us || us.includes(normalise(kw)),
    );
    const inResume = kwInText(kw, resumeL);
    return inJD && !inProfile && !inResume;
  })
    .slice(0, 10)
    .map(cap);

  // Fallback: extract capitalised terms from JD not in profile
  if (suggestedSkills.length === 0) {
    suggestedSkills = extractJDSkills(jd, skillsLower).slice(0, 8);
  }

  const missingFromResume = TECH_KW.filter(
    (kw) => kwInText(kw, jdL) && !kwInText(kw, resumeL),
  );

  // ----- Suggestions ──
  const suggestions: ResumeSuggestion[] = [];

  const summaryMissing = TECH_KW.filter(
    (kw) => kwInText(kw, jdL) && !kwInText(kw, profile.summary.toLowerCase()),
  )
    .slice(0, 5)
    .map(cap);

  if (summaryMissing.length > 0) {
    suggestions.push({
      section: "summary",
      priority: "high",
      suggestion:
        "Your Professional Summary lacks key terms from this JD. Update it to include:",
      keywords: summaryMissing,
    });
  }

  if (suggestedSkills.length > 0) {
    suggestions.push({
      section: "skills",
      priority: "high",
      suggestion: `Add these skills to your Skills section - they appear in the ${company ? company + " " : ""}job description:`,
      keywords: suggestedSkills.slice(0, 6),
    });
  }

  const latestExp = profile.experiences?.[0];
  if (latestExp?.company) {
    const expMissing = TECH_KW.filter(
      (kw) =>
        kwInText(kw, jdL) && !kwInText(kw, latestExp.description.toLowerCase()),
    )
      .slice(0, 4)
      .map(cap);
    if (expMissing.length > 0) {
      suggestions.push({
        section: "experience",
        priority: "medium",
        suggestion: `In your ${latestExp.company} role, highlight experience with:`,
        keywords: expMissing,
      });
    }
  }

  if (missingFromResume.length > 4) {
    suggestions.push({
      section: "general",
      priority: "medium",
      suggestion:
        "Your resume is missing several JD keywords. Adding them improves ATS pass-through rates significantly.",
      keywords: missingFromResume.slice(0, 5).map(cap),
    });
  }

  // Always ensure at least 2 suggestions
  if (suggestions.length === 0) {
    const jdTopKws = TECH_KW.filter((kw) => kwInText(kw, jdL))
      .slice(0, 5)
      .map(cap);
    suggestions.push({
      section: "general",
      priority: "medium",
      suggestion:
        "Use the exact language from the job description throughout your resume to improve ATS keyword matching.",
      keywords: jdTopKws.length > 0 ? jdTopKws : suggestedSkills.slice(0, 4),
    });
  }
  if (suggestions.length === 1) {
    suggestions.push({
      section: "experience",
      priority: "low",
      suggestion:
        'Quantify your achievements with metrics (e.g. "improved load time by 40%", "managed team of 6") to strengthen your impact.',
      keywords: ["Impact", "Metrics", "Results", "Ownership"],
    });
  }

  // ----- Score ──
  const keywordOverlap = TECH_KW.filter(
    (kw) => kwInText(kw, jdL) && kwInText(kw, resumeL),
  ).length;
  const totalJDKeywords = TECH_KW.filter((kw) => kwInText(kw, jdL)).length || 1;
  const matchScore = Math.min(
    96,
    Math.max(
      20,
      Math.round(
        (keywordOverlap / totalJDKeywords) * 70 +
          (profile.summary.length > 80 ? 10 : 0) +
          (profile.experiences?.length > 0 ? 10 : 0) +
          (matchedSkills.length > 3 ? 6 : 0),
      ),
    ),
  );

  const addendum =
    summaryMissing.length > 0
      ? ` Experienced with ${summaryMissing.slice(0, 2).join(" and ")}.`
      : "";
  const tailoredSummary = (profile.summary || "").trim() + addendum;

  return {
    ...profile,
    matchedSkills,
    suggestedSkills,
    tailoredSummary,
    matchScore,
    suggestions,
    company,
    analyzedAt: new Date().toISOString(),
    usedAI: false,
  };
}

// ----- Gemini API call -----─────────

interface AIResponse {
  matchScore: number;
  matchedSkills: string[];
  suggestedSkills: string[];
  tailoredSummary: string;
  suggestions: ResumeSuggestion[];
}

function buildPrompt(
  profile: UserProfile,
  resumeText: string,
  jd: string,
  company: string,
): string {
  return `You are an expert resume coach and ATS specialist. Analyze this candidate's resume against the job description and return a JSON object (no markdown, no explanation - raw JSON only).

## Candidate Profile
Name: ${profile.name}
Title: ${profile.title}
Skills: ${profile.skills.join(", ")}
Summary: ${profile.summary || "(none)"}
Experience: ${(profile.experiences ?? []).map((e) => `${e.title} at ${e.company} (${e.duration}): ${e.description}`).join("\n") || "(none)"}
Education: ${(profile.educations ?? []).map((e) => `${e.degree}, ${e.school} ${e.year}`).join("; ") || "(none)"}
${resumeText ? `\nParsed resume text:\n${resumeText.slice(0, 2000)}` : ""}

## Job Description${company ? ` (${company})` : ""}
${jd.slice(0, 3000)}

## Instructions
Return ONLY this JSON (no markdown, no code fences, no extra text):
{
  "matchScore": <integer 0-100, realistic ATS keyword match>,
  "matchedSkills": [<skills from candidate profile that appear in JD>],
  "suggestedSkills": [<up to 8 specific skills from JD not in candidate profile>],
  "tailoredSummary": "<rewritten 2-3 sentence professional summary optimised for this specific role>",
  "suggestions": [
    {
      "section": "<summary|skills|experience|general>",
      "priority": "<high|medium|low>",
      "suggestion": "<specific, actionable improvement>",
      "keywords": [<2-5 keywords from JD relevant to this suggestion>]
    }
  ]
}

Rules:
- matchScore must be honest - a junior with 2/10 skills should score ~25, not 75
- tailoredSummary must incorporate the actual job title and 2-3 key requirements from the JD
- suggestions must be specific and reference actual JD requirements, max 4 suggestions
- suggestedSkills must be skills literally mentioned in the JD, not generic advice`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Model names to try in order - first available wins
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

async function callGeminiModel(model: string, body: object): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY!}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callGemini(prompt: string, attempt = 0): Promise<AIResponse> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  let lastError = "";
  for (const model of GEMINI_MODELS) {
    const response = await callGeminiModel(model, requestBody);

    if (response.status === 429) {
      if (attempt < 3) {
        await sleep(1000 * Math.pow(2, attempt));
        return callGemini(prompt, attempt + 1);
      }
      throw new Error("Gemini rate limit exceeded");
    }

    // 401/403 = invalid API key - no point trying other models
    if (response.status === 401 || response.status === 403) {
      const errText = await response.text();
      throw new Error(
        `Gemini auth error ${response.status}: invalid or expired API key. ${errText}`,
      );
    }

    // 404 = model not found for this key - try next model
    if (response.status === 404) {
      lastError = `Model ${model} not available`;
      continue;
    }

    // 400 may mean model-specific issue - try next model
    if (!response.ok) {
      const errText = await response.text();
      lastError = `Gemini API error ${response.status}: ${errText}`;
      continue;
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Gemini returned empty response");

    const clean = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(clean) as AIResponse;
  }

  throw new Error(lastError || "All Gemini models unavailable");
}

// ----- Public entry point -----─────

/**
 * Tailor a resume to a job description.
 * Uses Gemini 2.0 Flash if VITE_GEMINI_API_KEY is set.
 * ALWAYS falls back to local keyword analysis on any failure - never throws.
 */
export async function tailorResume(
  profile: UserProfile,
  resumeText: string,
  jd: string,
  company: string,
): Promise<TailoredResume> {
  if (API_KEY) {
    try {
      const prompt = buildPrompt(profile, resumeText, jd, company);
      const aiResult = await callGemini(prompt);

      return {
        ...profile,
        matchedSkills: aiResult.matchedSkills ?? [],
        suggestedSkills: aiResult.suggestedSkills ?? [],
        tailoredSummary: aiResult.tailoredSummary ?? profile.summary,
        matchScore: Math.min(100, Math.max(0, aiResult.matchScore ?? 50)),
        suggestions: aiResult.suggestions ?? [],
        company,
        analyzedAt: new Date().toISOString(),
        usedAI: true,
      };
    } catch (err) {
      console.warn(
        "Gemini API failed, using local analysis:",
        err instanceof Error ? err.message : err,
      );
      // Always fall through to local analysis - never propagate the error to the UI
    }
  }

  return analyzeLocally(profile, resumeText, jd, company);
}

// ----- Interview Question Generator -----

const FALLBACK_QUESTIONS: InterviewQuestion[] = [
  // ----- Behavioral (13) -----──────
  {
    category: "behavioral",
    question:
      "Tell me about a time you faced a significant technical challenge. How did you resolve it?",
    tip: "Use the STAR method: Situation, Task, Action, Result. Focus on what you specifically did, not the team.",
  },
  {
    category: "behavioral",
    question:
      "Describe a situation where you had to meet a tight deadline. What was your approach?",
    tip: "Emphasise how you prioritised tasks, communicated progress, and managed trade-offs under pressure.",
  },
  {
    category: "behavioral",
    question:
      "Give an example of a time you disagreed with a team decision. What did you do?",
    tip: "Show constructive disagreement - voice concerns clearly, present alternatives, then commit to the team direction.",
  },
  {
    category: "behavioral",
    question:
      "Tell me about a time you failed. What happened and what did you learn?",
    tip: "Own the failure fully. Interviewers value self-awareness and growth far more than perfection.",
  },
  {
    category: "behavioral",
    question:
      "Describe a time you had to learn a new technology or skill quickly. How did you approach it?",
    tip: "Highlight your learning strategy - documentation, side projects, pairing with experts - and how fast you became productive.",
  },
  {
    category: "behavioral",
    question:
      "Tell me about a time you mentored or helped a colleague grow professionally.",
    tip: "Be specific about the person's challenge, your approach, and the measurable outcome for them and the team.",
  },
  {
    category: "behavioral",
    question:
      "Describe a time you proactively improved a process or system without being asked to.",
    tip: "Show ownership and initiative. Quantify the improvement - time saved, errors reduced, velocity gained.",
  },
  {
    category: "behavioral",
    question:
      "Tell me about a situation where you had to balance multiple competing priorities simultaneously.",
    tip: "Explain your prioritisation framework - urgency vs impact - and how you communicated trade-offs to stakeholders.",
  },
  {
    category: "behavioral",
    question:
      "Describe a time you received difficult or unexpected feedback. How did you respond?",
    tip: "Demonstrate emotional maturity: you listened, reflected, asked clarifying questions, and acted on it.",
  },
  {
    category: "behavioral",
    question:
      "Tell me about a project you're most proud of. What was your specific contribution?",
    tip: "Pick something technically challenging and business-impactful. Be precise about your individual role versus the team's.",
  },
  {
    category: "behavioral",
    question:
      "Describe a situation where you had to work closely with a difficult stakeholder. How did you handle it?",
    tip: "Focus on empathy and communication - understand their concerns before trying to solve the problem.",
  },
  {
    category: "behavioral",
    question:
      "Tell me about a time you had to make an important decision with incomplete information.",
    tip: "Show your reasoning process: what data you gathered, what assumptions you made explicit, and how you mitigated risk.",
  },
  {
    category: "behavioral",
    question:
      "Describe a time you had to push back on a requirement or scope. What happened?",
    tip: "Frame it as advocacy for quality or user experience, not resistance. Show how you proposed an alternative path forward.",
  },

  // ----- Technical (13) -----───────
  {
    category: "technical",
    question:
      "Walk me through how you would debug a production issue causing intermittent 5xx errors.",
    tip: "Cover the full loop: alerts, logs, tracing, reproducing locally, root cause hypothesis, fix, post-mortem.",
  },
  {
    category: "technical",
    question:
      "How do you ensure code quality and consistency in a fast-moving team?",
    tip: "Mention linting, code reviews, automated testing, style guides, and how you balance rigour with speed.",
  },
  {
    category: "technical",
    question:
      "Explain the trade-offs between different state management approaches in a modern frontend application.",
    tip: "Compare local component state, React Context, and external stores (Redux, Zustand, Jotai). Discuss when each is appropriate.",
  },
  {
    category: "technical",
    question:
      "How do you approach designing a system that needs to scale to 10x its current load?",
    tip: "Talk through bottleneck identification, horizontal vs vertical scaling, caching strategies, and async processing.",
  },
  {
    category: "technical",
    question:
      "What is your testing strategy when building a new feature from scratch?",
    tip: "Cover the testing pyramid: unit, integration, and E2E. Discuss what to test at each layer and why.",
  },
  {
    category: "technical",
    question:
      "How do you handle database schema migrations safely in a production environment?",
    tip: "Discuss backward-compatible migrations, feature flags, rolling deploys, and how you avoid locking tables.",
  },
  {
    category: "technical",
    question:
      "Walk me through how you would optimise a slow-performing API endpoint.",
    tip: "Cover profiling tools, N+1 query detection, caching, pagination, and database indexing strategies.",
  },
  {
    category: "technical",
    question: "How do you approach security in the code you write day-to-day?",
    tip: "Mention input validation, parameterised queries, authentication vs authorisation, dependency audits, and OWASP top 10.",
  },
  {
    category: "technical",
    question:
      "Walk me through what a thorough code review looks like for you - what do you check?",
    tip: "Go beyond style: correctness, edge cases, performance implications, security, test coverage, and maintainability.",
  },
  {
    category: "technical",
    question:
      "How do you design and version a public API to avoid breaking downstream consumers?",
    tip: "Discuss semantic versioning, deprecation windows, additive-only changes, and consumer-driven contract testing.",
  },
  {
    category: "technical",
    question:
      "What is your approach to observability - monitoring, logging, and alerting?",
    tip: "Cover the three pillars (metrics, logs, traces), alert fatigue, SLOs/SLAs, and on-call runbooks.",
  },
  {
    category: "technical",
    question:
      "How do you decide between building something in-house versus using a third-party solution?",
    tip: "Frame around build/buy/borrow: maintenance cost, differentiation, vendor risk, team expertise, and time-to-market.",
  },
  {
    category: "technical",
    question:
      "Explain how you would architect a feature that requires real-time updates pushed to many clients.",
    tip: "Compare WebSockets, Server-Sent Events, and polling. Discuss connection management, fan-out, and failure recovery.",
  },

  // ----- Situational (12) -----─────
  {
    category: "situational",
    question:
      "If you joined this team tomorrow, what would your first 30 days look like?",
    tip: "Structure around listen → understand → contribute. Show curiosity and an intent to ship something small early.",
  },
  {
    category: "situational",
    question:
      "How would you handle a scenario where requirements change significantly mid-sprint?",
    tip: "Show adaptability and process: assess impact, communicate to stakeholders, re-prioritise the backlog transparently.",
  },
  {
    category: "situational",
    question:
      "A critical bug hits production on a Friday evening before a long weekend. What do you do?",
    tip: "Cover immediate triage (contain blast radius), communication to stakeholders, fix vs rollback decision, and post-mortem.",
  },
  {
    category: "situational",
    question:
      "You inherit a large, undocumented codebase with no tests. How do you approach it?",
    tip: "Start with running the app and reading entry points. Add tests as you explore. Never refactor before you understand.",
  },
  {
    category: "situational",
    question:
      "You strongly disagree with the technical direction your team is heading. What do you do?",
    tip: "Voice concerns with data and alternatives in the right forum. Escalate if safety or quality is at risk. Commit once decided.",
  },
  {
    category: "situational",
    question:
      "Two days before a release you realise you cannot deliver the full scope. What do you do?",
    tip: "Communicate early - never surprise. Bring a scoped-down proposal with clear trade-offs for the stakeholder to decide.",
  },
  {
    category: "situational",
    question:
      "A colleague's pull requests keep failing review due to recurring quality issues. How do you address it?",
    tip: "Have a private, empathetic conversation focused on patterns. Offer to pair-program or share resources, not just criticise.",
  },
  {
    category: "situational",
    question:
      "You are handed a backlog of 40 unresolved bugs with no priority order. How do you approach it?",
    tip: "Triage by user impact and frequency first, then severity. Use data (error rates, support tickets) to prioritise objectively.",
  },
  {
    category: "situational",
    question:
      "You're asked to cut a feature to hit a deadline. How do you decide what to cut?",
    tip: "Use impact-to-effort ratio. Involve the PM in the trade-off decision - don't make it unilaterally.",
  },
  {
    category: "situational",
    question:
      "Two senior engineers on your team have a sustained disagreement on the right architecture. What do you do?",
    tip: "Facilitate a structured discussion: define the decision criteria, write up both proposals, time-box the debate, then decide.",
  },
  {
    category: "situational",
    question:
      "You discover a security vulnerability in a part of the codebase you don't own. What do you do?",
    tip: "Report it through the right channel immediately (security team or owner), document the risk, and follow up without delay.",
  },
  {
    category: "situational",
    question:
      "You need to migrate a business-critical service with zero downtime. How do you plan it?",
    tip: "Use the strangler fig pattern or blue/green deployment. Dark launch, canary release, and a tested rollback plan are essential.",
  },

  // ----- Role-specific (12) -----───
  {
    category: "role-specific",
    question: "What aspect of this role excites you most, and why?",
    tip: "Connect your answer directly to the job description - reference specific responsibilities or technologies mentioned.",
  },
  {
    category: "role-specific",
    question:
      "Where do you see the biggest opportunity for improvement in how engineering teams like this one typically work?",
    tip: "Show you've thought deeply about team dynamics, not just technology. Be constructive and solutions-oriented.",
  },
  {
    category: "role-specific",
    question:
      "What do you think are the most important qualities for someone to succeed in this specific position?",
    tip: "Mirror the job description's language and add your own perspective - show you've internalised what this role actually demands.",
  },
  {
    category: "role-specific",
    question:
      "How does your background and experience make you particularly well-suited for this role?",
    tip: "Be specific and direct. Map your top 3 relevant experiences to the top 3 requirements in the JD.",
  },
  {
    category: "role-specific",
    question:
      "What do you think is the most important technical or industry trend affecting this company right now?",
    tip: "Do your research beforehand. Show you understand the company's market, not just the tech stack.",
  },
  {
    category: "role-specific",
    question:
      "How do you stay current with developments in your field, and what have you learned recently?",
    tip: "Name specific sources, communities, or projects. Then describe something concrete you applied from what you learned.",
  },
  {
    category: "role-specific",
    question:
      "What does a healthy, high-performing engineering culture look like to you?",
    tip: "Talk about psychological safety, clear ownership, blameless post-mortems, and strong feedback loops - with examples from your experience.",
  },
  {
    category: "role-specific",
    question:
      "How do you see this role evolving over the next 2–3 years, and where do you want to be?",
    tip: "Align your ambition with the company's direction. Show you want to grow within the organisation, not just through it.",
  },
  {
    category: "role-specific",
    question:
      "What kind of problems do you find most energising to work on, and how does this role fit that?",
    tip: "Be honest - this helps both sides assess fit. Connect your answer back to something specific in the job description.",
  },
  {
    category: "role-specific",
    question:
      "What would make you leave a job, and how does this role address those concerns?",
    tip: "Frame your answer around positive drivers (growth, impact, culture) rather than negatives. Shows self-awareness.",
  },
  {
    category: "role-specific",
    question:
      "What kind of team environment and management style brings out your best work?",
    tip: "Be specific about what you need to thrive - autonomy, clear goals, frequent feedback - and tie it to this team's setup.",
  },
  {
    category: "role-specific",
    question:
      "What questions do you have for us about the role, the team, or the company?",
    tip: "Always prepare 3–5 thoughtful questions. Ask about team challenges, success metrics for this role, and engineering culture.",
  },
];

export async function generateInterviewQuestions(
  jd: string,
  company: string,
  role: string,
): Promise<InterviewQuestion[]> {
  if (!API_KEY) return FALLBACK_QUESTIONS;

  const prompt = `You are an expert technical interviewer. Generate targeted interview questions for the following role.

## Company: ${company || "Unknown"}
## Role: ${role || "Software Engineer"}
## Job Description:
${jd.slice(0, 3000)}

Return ONLY this JSON array (no markdown, no code fences):
[
  {
    "category": "<behavioral|technical|situational|role-specific>",
    "question": "<specific interview question tailored to this JD>",
    "tip": "<one sentence coaching tip for answering this question well>"
  }
]

Rules:
- Generate exactly 50 questions: 13 behavioral, 13 technical, 12 situational, 12 role-specific
- Technical questions must reference specific technologies or skills mentioned in the JD
- Role-specific questions must reference the actual company and role context
- Tips must be concrete and actionable, not generic
- Do not repeat similar questions - make each one distinctly useful`;

  const interviewBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  };

  try {
    let response: Response | null = null;
    for (const model of GEMINI_MODELS) {
      const r = await callGeminiModel(model, interviewBody);
      if (r.status === 404) continue;
      response = r;
      break;
    }
    if (!response) throw new Error("No Gemini model available");
    if (!response.ok) throw new Error(`Gemini ${response.status}`);

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(clean) as InterviewQuestion[];

    // Validate categories
    const valid: QuestionCategory[] = [
      "behavioral",
      "technical",
      "situational",
      "role-specific",
    ];
    return parsed.filter((q) => q.question && valid.includes(q.category));
  } catch (err) {
    console.warn(
      "Interview question generation failed, using fallback:",
      err instanceof Error ? err.message : err,
    );
    return FALLBACK_QUESTIONS;
  }
}
