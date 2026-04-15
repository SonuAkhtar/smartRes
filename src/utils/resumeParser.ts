import * as pdfjsLib from "pdfjs-dist";
// Vite ?url import resolves to the hashed asset URL at build time - no CDN required
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ParsedExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ParsedFields {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  skills?: string[];
  degree?: string;
  school?: string;
  gradYear?: string;
  jobTitle?: string;
  company?: string;
  duration?: string;
  jobDesc?: string;
  yearsOfExperience?: string;
  /** Up to 5 parsed work experience entries */
  experiences?: ParsedExperience[];
}

// ----- Text Extraction ──────────────────────────────────────

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return extractFromPDF(file);
  if (ext === "docx" || ext === "doc") return extractFromDOCX(file);
  if (ext === "txt") return file.text();
  throw new Error(
    `Unsupported format: .${ext}. Please upload PDF, DOCX, or TXT.`,
  );
}

async function extractFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str?: string; hasEOL?: boolean }>)
      .map((item) => (item.str ?? "") + (item.hasEOL ? "\n" : " "))
      .join("");
    pageTexts.push(text);
  }
  return pageTexts.join("\n\n");
}

async function extractFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

// ----- Preprocessing ────────────────────────────────────────

const KNOWN_HEADERS = [
  "professional summary",
  "career summary",
  "executive summary",
  "career objective",
  "objective",
  "about me",
  "about",
  "overview",
  "profile",
  "professional profile",
  "technical skills",
  "core competencies",
  "key competencies",
  "key skills",
  "skills & expertise",
  "skills and expertise",
  "areas of expertise",
  "core skills",
  "competencies",
  "tools & technologies",
  "tools and technologies",
  "technologies",
  "proficiencies",
  "expertise",
  "skills",
  "programming languages",
  "technical proficiencies",
  "professional experience",
  "work experience",
  "employment history",
  "career history",
  "work history",
  "experience",
  "educational background",
  "academic background",
  "academic qualifications",
  "qualifications",
  "education",
  "certifications",
  "projects",
  "awards",
  "interests",
  "languages",
  "references",
  "links",
  "contact",
  "contact information",
];

function preprocessText(raw: string): string {
  let text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

  for (const h of KNOWN_HEADERS) {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`([^\\n])( {0,2})(${escaped})( {0,2})`, "gi");
    text = text.replace(
      re,
      (_m, before, _sp1, header, sp2) => `${before}\n${header}${sp2}`,
    );
  }
  return text;
}

// ----- Section Splitter ─────────────────────────────────────

function getSectionText(text: string, headers: string[]): string {
  const lower = text.toLowerCase();
  const escaped = headers.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  let pattern = new RegExp(
    `(?:^|\\n)[ \\t]*(?:${escaped.join("|")})[ \\t]*(?::|\\n|$)`,
    "i",
  );
  let match = pattern.exec(lower);

  if (!match) {
    pattern = new RegExp(
      `(?:^|[\\s])(?:${escaped.join("|")})[ \\t]*(?::|\\n|\\r| {2,})`,
      "i",
    );
    match = pattern.exec(lower);
  }

  if (!match) return "";
  const start = match.index + match[0].length;

  const nextSectionPattern =
    /\n[ \t]*([A-Z][A-Z &/\-]{2,}|[A-Z][a-z]+(?: [A-Z][a-z]+){0,3})[ \t]*(?::|$)/gm;
  nextSectionPattern.lastIndex = start;
  const nextMatch = nextSectionPattern.exec(text);
  const end = nextMatch ? nextMatch.index : Math.min(start + 1400, text.length);
  return text.slice(start, end).trim();
}

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ----- Multi-Experience Parser ──────────────────────────

function splitExperienceBlocks(
  expRaw: string,
  datePattern: RegExp,
  titlePattern: RegExp,
): string[] {
  // Pass 1: split on blank lines (2+ newlines)
  const byDouble = expRaw
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 15);

  if (byDouble.length >= 2) return byDouble;

  // Pass 2: PDF text often uses only single newlines between job entries.
  // Re-split line-by-line: a new entry begins when we see a line that looks
  // like a job-title/company line and we already have content accumulated.
  const lines = expRaw.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();

    const hasContent = current.some((l) => l.trim().length > 15);
    const isNewEntry =
      hasContent &&
      // "Company Name | Jan 2022 – Present" or "Company Name – Jan 2022"
      (/^[A-Za-z][A-Za-z\s,\.\&]+\s*[|–\-]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(
        t,
      ) ||
        // Bare year range at start of line: "2020 – 2022" / "2022 - Present"
        /^\d{4}\s*[-–]\s*(?:\d{4}|present|current|now)/i.test(t) ||
        // Month-year range at start of line: "Jan 2020 – Dec 2022"
        /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{2,4}\s*[-–]/i.test(
          t,
        ) ||
        // Title pattern at start with a preceding non-empty group
        (current.length >= 3 && titlePattern.test(t) && /^[A-Z]/.test(t)));

    if (isNewEntry) {
      blocks.push(current.join("\n").trim());
      current = [];
    }

    current.push(lines[i]);
  }
  if (current.length > 0) blocks.push(current.join("\n").trim());

  const filtered = blocks.filter((b) => b.length > 15);
  return filtered.length > byDouble.length ? filtered : byDouble;
}

function parseExperienceBlocks(
  expRaw: string,
  titlePattern: RegExp,
  datePattern: RegExp,
): ParsedExperience[] {
  const results: ParsedExperience[] = [];

  const blocks = splitExperienceBlocks(expRaw, datePattern, titlePattern);

  for (const block of blocks) {
    if (results.length >= 5) break;

    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const dateMatch = block.match(datePattern);
    const titleMatch = block.match(titlePattern);

    // Need at least a date range or a recognisable job title
    if (!dateMatch && !titleMatch) continue;

    const duration = dateMatch ? dateMatch[0].trim() : "";
    const title = titleMatch
      ? titleMatch[1].trim().replace(/\s+/g, " ").slice(0, 60)
      : "";

    // Company: a capitalised line that is neither the title nor a date
    let company = "";
    const titleSlug = title.toLowerCase().slice(0, 10);
    const durSlug = duration.slice(0, 6);

    for (const line of lines.slice(0, 6)) {
      const lc = line.toLowerCase();
      if (
        /^[A-Z]/.test(line) &&
        line.length > 2 &&
        line.length < 70 &&
        !(titleSlug && lc.includes(titleSlug)) &&
        !(durSlug && lc.includes(durSlug)) &&
        !/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i.test(
          line,
        ) &&
        !datePattern.test(line) &&
        line !== title
      ) {
        company = line.replace(/[|,]\s*.*$/, "").trim();
        break;
      }
    }

    if (!company && !title) continue;

    const descLines = lines
      .filter(
        (l) =>
          l !== title &&
          l !== company &&
          !(duration && l.includes(duration.slice(0, 6))) &&
          l.length > 20,
      )
      .slice(0, 4);

    const description = descLines
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 400)
      .trim();

    // Deduplicate: skip if we already have an entry with same company
    if (
      results.some(
        (r) =>
          r.company.toLowerCase().slice(0, 12) ===
          company.toLowerCase().slice(0, 12),
      )
    )
      continue;

    results.push({ title, company, duration, description });
  }

  return results;
}

// ----- Main Parser ──────────────────────────────────────────

export function parseResumeText(raw: string): ParsedFields {
  const result: ParsedFields = {};

  const text = preprocessText(raw);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // ----- Email -----──
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/,
  );
  if (emailMatch) result.email = emailMatch[0].trim();

  // ----- Phone -----──
  const phoneMatch = text.match(
    /(?:\+\d{1,3}[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}|\d{10})/,
  );
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\s+/g, " ").trim();

  // ----- LinkedIn ────────────────────────────────────────────
  const liMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[\w\-_%]+(?:\/[\w\-_%]+)*/i,
  );
  if (liMatch) {
    const url = liMatch[0].replace(/\/$/, "");
    result.linkedIn = url.startsWith("http") ? url : `https://${url}`;
  }

  // ----- GitHub -----─
  const ghMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-._]+/i,
  );
  if (ghMatch) {
    const url = ghMatch[0].replace(/\/$/, "");
    result.github = url.startsWith("http") ? url : `https://${url}`;
  }

  // ----- Portfolio / personal site ────────────────────────────
  const portPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:gitlab\.com|behance\.net|dribbble\.com)\/[\w\-._]+/i,
    /(?:https?:\/\/)?[\w\-]+\.(?:io|dev|me|site|app|xyz|online|tech)(?:\/[\w\-._/]+)?(?=[\s,|]|$)/i,
  ];
  for (const pp of portPatterns) {
    const pm = text.match(pp);
    if (pm && !/linkedin|github/i.test(pm[0])) {
      const url = pm[0].replace(/\/$/, "");
      result.portfolio = url.startsWith("http") ? url : `https://${url}`;
      break;
    }
  }

  // ----- Name -----───
  const roleKeywords =
    /engineer|developer|manager|designer|analyst|consultant|specialist|architect|intern|director|officer|scientist|executive|founder|leader|head\b/i;

  const isNameLike = (raw: string): string | null => {
    const clean = raw.replace(/[^a-zA-Z\s'.\-]/g, "").trim();
    if (clean.length < 3 || clean.length > 55) return null;
    const words = clean.split(/\s+/);
    if (words.length < 2 || words.length > 5) return null;
    if (/@|http|\.com|\.io|\.in/.test(raw)) return null;
    if (roleKeywords.test(clean)) return null;
    const isAllCaps = words.every((w) => /^[A-Z]{2,}$/.test(w));
    const isTitle = words.every((w) => /^[A-Z]/.test(w));
    if (isAllCaps || isTitle) {
      return isAllCaps ? toTitleCase(clean) : clean;
    }
    return null;
  };

  // Strategy 1: first 12 lines
  for (const line of lines.slice(0, 12)) {
    const name = isNameLike(line);
    if (name) {
      result.name = name;
      break;
    }
  }

  // Strategy 2: line immediately before the email line
  if (!result.name && result.email) {
    const emailLineIdx = lines.findIndex((l) =>
      l.toLowerCase().includes(result.email!.toLowerCase()),
    );
    if (emailLineIdx > 0) {
      const name = isNameLike(lines[emailLineIdx - 1]);
      if (name) result.name = name;
    }
  }

  // Strategy 3: split a header line that contains the email to find the name part
  if (!result.name) {
    for (const line of lines.slice(0, 8)) {
      if (
        !result.email ||
        !line.toLowerCase().includes(result.email.toLowerCase())
      )
        continue;
      for (const part of line.split(/[|•\/;,]/).map((p) => p.trim())) {
        if (
          part.includes("@") ||
          /^\+?\d/.test(part) ||
          /https?:|www\./i.test(part)
        )
          continue;
        const name = isNameLike(part);
        if (name) {
          result.name = name;
          break;
        }
      }
      if (result.name) break;
    }
  }

  // ----- Location ────────────────────────────────────────────
  // Explicit label first
  const locLabelMatch = text.match(
    /(?:location|address|based\s+in|city)[:\s]+([A-Z][a-zA-Z\s,.\-]{3,60}?)(?=\s*(?:\||•|\n|$))/i,
  );
  if (locLabelMatch) {
    const loc = locLabelMatch[1].trim().replace(/\s+/g, " ");
    if (!/university|college|institute|school/i.test(loc))
      result.location = loc;
  }

  if (!result.location) {
    const locPatterns = [
      /\b([A-Z][a-zA-Z ]{1,20}),\s*([A-Z]{2})\b(?!\s*[\d\-])/,
      /\b([A-Z][a-z]+(?: [A-Z][a-z]+)?),\s*(Maharashtra|Karnataka|Tamil Nadu|Delhi|Telangana|Andhra Pradesh|Gujarat|Rajasthan|Uttar Pradesh|West Bengal|Kerala|Punjab|Haryana|Madhya Pradesh|Bihar|Odisha|Assam|Jharkhand|Uttarakhand|Himachal Pradesh|Chhattisgarh|Goa)\b/i,
      /\b([A-Z][a-z]+(?: [A-Z][a-z]+)?),\s*(India|USA|UK|Canada|Australia|Germany|France|Singapore|UAE|Netherlands|Ireland|New Zealand|South Africa|Pakistan|Bangladesh|Sri Lanka|Malaysia)\b/i,
    ];
    for (const p of locPatterns) {
      const m = text.match(p);
      if (m && !/university|college|institute|school/i.test(m[0])) {
        result.location = m[0].trim();
        break;
      }
    }
  }

  // ----- Summary / Objective ─────────────────────────────────
  const summaryRaw = getSectionText(text, [
    "professional summary",
    "career summary",
    "executive summary",
    "professional profile",
    "career objective",
    "summary",
    "objective",
    "profile",
    "about me",
    "about",
    "overview",
  ]);
  if (summaryRaw) {
    result.summary = summaryRaw.replace(/\s+/g, " ").slice(0, 700).trim();
  }

  // Fallback: first multi-sentence paragraph that isn't a list or date block
  if (!result.summary) {
    for (const para of text.split(/\n{2,}/).map((p) => p.trim())) {
      if (
        para.length > 80 &&
        (para.match(/[.!?]/g) || []).length >= 2 &&
        !/^(?:\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(
          para,
        ) &&
        !/^(?:bachelor|master|b\.tech|b\.e\.|education|skills|experience)/i.test(
          para,
        )
      ) {
        result.summary = para.replace(/\s+/g, " ").slice(0, 700).trim();
        break;
      }
    }
  }

  // ----- Skills -----─
  // Step 1: parse explicit skills section
  const skillsRaw = getSectionText(text, [
    "technical skills",
    "core competencies",
    "key skills",
    "key competencies",
    "skills & expertise",
    "skills and expertise",
    "areas of expertise",
    "core skills",
    "competencies",
    "skills",
    "technologies",
    "expertise",
    "proficiencies",
    "tools & technologies",
    "tools and technologies",
    "programming languages",
    "technical proficiencies",
  ]);

  let sectionSkills: string[] = [];
  if (skillsRaw) {
    const cleaned = skillsRaw
      .replace(/[•·▪▸▹→●○◦|]\s*/g, ",")
      .replace(/\n+/g, ",")
      .replace(/–\s*/g, ",")
      .replace(/\s{3,}/g, ",");

    const expandedParts: string[] = [];
    for (const segment of cleaned.split(",")) {
      const colonIdx = segment.indexOf(":");
      if (colonIdx > -1 && colonIdx < 40) {
        for (const s of segment.slice(colonIdx + 1).split(/[,/]/)) {
          expandedParts.push(s.trim());
        }
      } else {
        for (const s of segment.split("/")) {
          expandedParts.push(s.trim());
        }
      }
    }

    sectionSkills = expandedParts
      .map((s) => s.trim())
      .filter((s) => !s.includes(":"))
      .filter((s) => s.length > 1 && s.length < 50 && !/^\d+$/.test(s))
      .filter(
        (s, i, arr) =>
          arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
      );
  }

  // Step 2: inline "Skills: a, b, c" pattern as fallback for section parsing
  if (sectionSkills.length === 0) {
    const inlineMatch = text.match(
      /(?:skills?|competencies|expertise|proficiencies|technologies)[\s:–-]+([^\n]{10,300})/i,
    );
    if (inlineMatch) {
      const inlineParts = inlineMatch[1]
        .replace(/[•·▪|]\s*/g, ",")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 50 && !s.includes(":"));
      if (inlineParts.length >= 2) sectionSkills = inlineParts;
    }
  }

  // Step 3: comprehensive keyword scan across the ENTIRE resume text.
  // Runs always - catches skills mentioned in experience bullets, projects, etc.
  // that may not appear in a dedicated skills section.
  const TECH_SKILLS: Array<{ name: string; re: RegExp }> = [
    // ── Languages ──────────────────────────────────────────────
    { name: "Python", re: /\bpython\b/i },
    { name: "JavaScript", re: /\bjavascript\b/i },
    { name: "TypeScript", re: /\btypescript\b/i },
    { name: "Java", re: /\bjava\b(?!script)/i },
    { name: "C++", re: /\bc\+\+/i },
    { name: "C#", re: /\bc#\b/i },
    { name: "Go", re: /\bgolang\b|\bgo\b(?=[\s,/;)\]])/i },
    { name: "Rust", re: /\brust\b/i },
    { name: "Swift", re: /\bswift\b(?!ui)/i },
    { name: "Kotlin", re: /\bkotlin\b/i },
    { name: "Ruby", re: /\bruby\b/i },
    { name: "PHP", re: /\bphp\b/i },
    { name: "Scala", re: /\bscala\b/i },
    { name: "R", re: /\bR\b(?=[\s,/;)\]])/i },
    { name: "MATLAB", re: /\bmatlab\b/i },
    { name: "Dart", re: /\bdart\b/i },
    { name: "Perl", re: /\bperl\b/i },
    { name: "Haskell", re: /\bhaskell\b/i },
    { name: "Bash", re: /\bbash\b/i },
    { name: "Shell", re: /\bshell\s+script/i },
    { name: "SQL", re: /\bsql\b/i },
    { name: "HTML", re: /\bhtml\b/i },
    { name: "CSS", re: /\bcss\b/i },
    { name: "Solidity", re: /\bsolidity\b/i },
    { name: "Lua", re: /\blua\b/i },
    { name: "Elixir", re: /\belixir\b/i },
    { name: "Clojure", re: /\bclojure\b/i },
    // ── Web Frameworks ─────────────────────────────────────────
    { name: "React", re: /\breact(?:\.js)?\b(?!\s+native)/i },
    { name: "Next.js", re: /\bnext(?:\.js)?\b/i },
    { name: "Vue.js", re: /\bvue(?:\.js)?\b/i },
    { name: "Angular", re: /\bangular\b/i },
    { name: "Svelte", re: /\bsvelte(?:kit)?\b/i },
    { name: "Nuxt.js", re: /\bnuxt(?:\.js)?\b/i },
    { name: "Remix", re: /\bremix\b/i },
    { name: "Vite", re: /\bvite\b/i },
    { name: "Node.js", re: /\bnode(?:\.js)?\b/i },
    { name: "Express.js", re: /\bexpress(?:\.js)?\b/i },
    { name: "NestJS", re: /\bnest(?:js|\.js)\b/i },
    { name: "FastAPI", re: /\bfastapi\b/i },
    { name: "Django", re: /\bdjango\b/i },
    { name: "Flask", re: /\bflask\b/i },
    { name: "Spring Boot", re: /\bspring\s+boot\b/i },
    { name: "Spring", re: /\bspring\b(?!\s+boot)/i },
    { name: "Laravel", re: /\blaravel\b/i },
    { name: "Rails", re: /\brails\b|\bruby\s+on\s+rails\b/i },
    { name: "ASP.NET", re: /\basp\.net\b/i },
    { name: "Gin", re: /\bgin\b(?=[\s,])/i },
    { name: "Fiber", re: /\bfiber\b(?=[\s,])/i },
    { name: "Actix", re: /\bactix\b/i },
    { name: "Hono", re: /\bhono\b(?=[\s,])/i },
    { name: "tRPC", re: /\btrpc\b/i },
    // ── Mobile ─────────────────────────────────────────────────
    { name: "React Native", re: /\breact\s+native\b/i },
    { name: "Flutter", re: /\bflutter\b/i },
    { name: "SwiftUI", re: /\bswiftui\b/i },
    { name: "Jetpack Compose", re: /\bjetpack\s+compose\b/i },
    { name: "Expo", re: /\bexpo\b(?=[\s,])/i },
    { name: "Ionic", re: /\bionic\b/i },
    { name: "Capacitor", re: /\bcapacitor\b/i },
    // ── AI / ML / LLM ──────────────────────────────────────────
    { name: "TensorFlow", re: /\btensorflow\b/i },
    { name: "PyTorch", re: /\bpytorch\b/i },
    { name: "Keras", re: /\bkeras\b/i },
    { name: "Scikit-learn", re: /\bscikit[\s-]?learn\b|\bsklearn\b/i },
    { name: "Hugging Face", re: /\bhugging\s*face\b/i },
    { name: "LangChain", re: /\blangchain\b/i },
    { name: "LlamaIndex", re: /\bllama\s*index\b/i },
    { name: "OpenAI API", re: /\bopenai\b/i },
    { name: "Anthropic", re: /\banthropic\b/i },
    { name: "GPT-4", re: /\bgpt-?4\b/i },
    { name: "GPT", re: /\bgpt\b(?!-4)/i },
    { name: "LLM", re: /\bllm\b|\blarge\s+language\s+model/i },
    { name: "RAG", re: /\brag\b|\bretrieval[\s-]augmented/i },
    { name: "MLflow", re: /\bmlflow\b/i },
    { name: "Weights & Biases", re: /\bweights\s*&\s*biases\b|\bwandb\b/i },
    { name: "ONNX", re: /\bonnx\b/i },
    { name: "BERT", re: /\bbert\b/i },
    { name: "Transformers", re: /\btransformers\b/i },
    { name: "Computer Vision", re: /\bcomputer\s+vision\b/i },
    { name: "NLP", re: /\bnlp\b|\bnatural\s+language\s+processing\b/i },
    { name: "Machine Learning", re: /\bmachine\s+learning\b/i },
    { name: "Deep Learning", re: /\bdeep\s+learning\b/i },
    { name: "Generative AI", re: /\bgenerative\s+ai\b|\bgen\s*ai\b/i },
    { name: "Stable Diffusion", re: /\bstable\s+diffusion\b/i },
    { name: "Midjourney", re: /\bmidjourney\b/i },
    { name: "ChatGPT", re: /\bchatgpt\b/i },
    { name: "Copilot", re: /\bcopilot\b/i },
    { name: "Vertex AI", re: /\bvertex\s+ai\b/i },
    { name: "SageMaker", re: /\bsagemaker\b/i },
    // ── Data Engineering ───────────────────────────────────────
    { name: "Pandas", re: /\bpandas\b/i },
    { name: "NumPy", re: /\bnumpy\b/i },
    { name: "Matplotlib", re: /\bmatplotlib\b/i },
    { name: "Seaborn", re: /\bseaborn\b/i },
    { name: "Tableau", re: /\btableau\b/i },
    { name: "Power BI", re: /\bpower\s*bi\b/i },
    { name: "Looker", re: /\blooker\b/i },
    { name: "Apache Spark", re: /\bapache\s+spark\b|\bpyspark\b/i },
    { name: "Hadoop", re: /\bhadoop\b/i },
    { name: "dbt", re: /\bdbt\b/i },
    { name: "Airflow", re: /\bairflow\b/i },
    { name: "Kafka", re: /\bkafka\b/i },
    { name: "Flink", re: /\bflink\b/i },
    { name: "Jupyter", re: /\bjupyter\b/i },
    { name: "Excel", re: /\bexcel\b/i },
    { name: "Google Analytics", re: /\bgoogle\s+analytics\b/i },
    { name: "Snowflake", re: /\bsnowflake\b/i },
    { name: "BigQuery", re: /\bbigquery\b/i },
    { name: "Databricks", re: /\bdatabricks\b/i },
    // ── Databases ──────────────────────────────────────────────
    { name: "PostgreSQL", re: /\bpostgresql\b|\bpostgres\b/i },
    { name: "MySQL", re: /\bmysql\b/i },
    { name: "MongoDB", re: /\bmongodb\b/i },
    { name: "SQLite", re: /\bsqlite\b/i },
    { name: "Redis", re: /\bredis\b/i },
    { name: "Elasticsearch", re: /\belasticsearch\b/i },
    { name: "Cassandra", re: /\bcassandra\b/i },
    { name: "DynamoDB", re: /\bdynamodb\b/i },
    { name: "Supabase", re: /\bsupabase\b/i },
    { name: "Firebase", re: /\bfirebase\b/i },
    { name: "Firestore", re: /\bfirestore\b/i },
    { name: "PineconeDB", re: /\bpinecone\b/i },
    { name: "Weaviate", re: /\bweaviate\b/i },
    { name: "Chroma", re: /\bchroma(?:db)?\b/i },
    { name: "Neo4j", re: /\bneo4j\b/i },
    { name: "CockroachDB", re: /\bcockroachdb\b/i },
    { name: "PlanetScale", re: /\bplanetscale\b/i },
    // ── API / Protocols ────────────────────────────────────────
    { name: "GraphQL", re: /\bgraphql\b/i },
    { name: "REST API", re: /\brest(?:ful)?\s*api\b/i },
    { name: "gRPC", re: /\bgrpc\b/i },
    { name: "WebSockets", re: /\bwebsockets?\b/i },
    { name: "WebRTC", re: /\bwebrtc\b/i },
    { name: "OAuth", re: /\boauth\b/i },
    { name: "JWT", re: /\bjwt\b/i },
    // ── Cloud & DevOps ─────────────────────────────────────────
    { name: "AWS", re: /\baws\b|\bamazon\s+web\s+services\b/i },
    { name: "Google Cloud", re: /\bgcp\b|\bgoogle\s+cloud\b/i },
    { name: "Azure", re: /\bazure\b/i },
    { name: "Docker", re: /\bdocker\b/i },
    { name: "Kubernetes", re: /\bkubernetes\b|\bk8s\b/i },
    { name: "Terraform", re: /\bterraform\b/i },
    { name: "Ansible", re: /\bansible\b/i },
    { name: "Jenkins", re: /\bjenkins\b/i },
    { name: "GitHub Actions", re: /\bgithub\s+actions\b/i },
    { name: "GitLab CI", re: /\bgitlab\s*ci(?:\/cd)?\b/i },
    { name: "CircleCI", re: /\bcircleci\b/i },
    { name: "Vercel", re: /\bvercel\b/i },
    { name: "Netlify", re: /\bnetlify\b/i },
    { name: "Heroku", re: /\bheroku\b/i },
    { name: "Linux", re: /\blinux\b/i },
    { name: "Nginx", re: /\bnginx\b/i },
    { name: "Pulumi", re: /\bpulumi\b/i },
    { name: "CI/CD", re: /\bci\/cd\b|\bcontinuous\s+integration\b/i },
    // ── Testing ────────────────────────────────────────────────
    { name: "Jest", re: /\bjest\b/i },
    { name: "Pytest", re: /\bpytest\b/i },
    { name: "Cypress", re: /\bcypress\b/i },
    { name: "Selenium", re: /\bselenium\b/i },
    { name: "Playwright", re: /\bplaywright\b/i },
    { name: "Testing Library", re: /\btesting\s+library\b/i },
    { name: "Vitest", re: /\bvitest\b/i },
    { name: "Mocha", re: /\bmocha\b/i },
    { name: "Chai", re: /\bchai\b/i },
    // ── UI / Styling ───────────────────────────────────────────
    { name: "Tailwind CSS", re: /\btailwind(?:\s*css)?\b/i },
    { name: "Sass", re: /\bsass\b|\bscss\b/i },
    { name: "Material UI", re: /\bmaterial[\s-]ui\b|\bmui\b/i },
    { name: "Bootstrap", re: /\bbootstrap\b/i },
    { name: "Chakra UI", re: /\bchakra\s*ui\b/i },
    { name: "Shadcn UI", re: /\bshadcn\b/i },
    { name: "Radix UI", re: /\bradix\b/i },
    { name: "Ant Design", re: /\bant\s+design\b|\bantd\b/i },
    { name: "Framer Motion", re: /\bframer\s+motion\b/i },
    { name: "Three.js", re: /\bthree(?:\.js)?\b/i },
    { name: "D3.js", re: /\bd3(?:\.js)?\b/i },
    // ── State Management ───────────────────────────────────────
    { name: "Redux", re: /\bredux\b/i },
    { name: "Zustand", re: /\bzustand\b/i },
    { name: "MobX", re: /\bmobx\b/i },
    { name: "Jotai", re: /\bjotai\b/i },
    { name: "Recoil", re: /\brecoil\b/i },
    // ── Tools & Platforms ──────────────────────────────────────
    { name: "Git", re: /\bgit\b(?!hub|lab)/i },
    { name: "GitHub", re: /\bgithub\b/i },
    { name: "GitLab", re: /\bgitlab\b(?!\s*ci)/i },
    { name: "Jira", re: /\bjira\b/i },
    { name: "Figma", re: /\bfigma\b/i },
    { name: "Notion", re: /\bnotion\b/i },
    { name: "Postman", re: /\bpostman\b/i },
    { name: "VS Code", re: /\bvs\s*code\b/i },
    { name: "Xcode", re: /\bxcode\b/i },
    { name: "Android Studio", re: /\bandroid\s+studio\b/i },
    { name: "Webpack", re: /\bwebpack\b/i },
    { name: "Babel", re: /\bbabel\b/i },
    { name: "ESLint", re: /\beslint\b/i },
    { name: "Prettier", re: /\bprettier\b/i },
    { name: "Storybook", re: /\bstorybook\b/i },
    { name: "Nx", re: /\bnx\b(?=[\s,])/i },
    { name: "Turborepo", re: /\bturborepo\b/i },
    { name: "pnpm", re: /\bpnpm\b/i },
    { name: "Yarn", re: /\byarn\b/i },
    { name: "PowerPoint", re: /\bpowerpoint\b/i },
    { name: "Slack", re: /\bslack\b/i },
    { name: "Confluence", re: /\bconfluence\b/i },
    { name: "Linear", re: /\blinear\b(?=[\s,])/i },
    { name: "Stripe", re: /\bstripe\b/i },
    { name: "Twilio", re: /\btwilio\b/i },
    { name: "SendGrid", re: /\bsendgrid\b/i },
    // ── Process ────────────────────────────────────────────────
    { name: "Agile", re: /\bagile\b/i },
    { name: "Scrum", re: /\bscrum\b/i },
    { name: "Microservices", re: /\bmicroservices?\b/i },
    { name: "System Design", re: /\bsystem\s+design\b/i },
    { name: "OOP", re: /\boop\b|\bobject[\s-]oriented\b/i },
    { name: "Functional Programming", re: /\bfunctional\s+programming\b/i },
    { name: "TDD", re: /\btdd\b|\btest[\s-]driven\b/i },
  ];

  const keywordSkills: string[] = [];
  for (const { name, re } of TECH_SKILLS) {
    if (re.test(text)) {
      keywordSkills.push(name);
    }
  }

  // Merge: section-based skills first (higher signal), then keyword skills not already covered
  const sectionLower = new Set(sectionSkills.map((s) => s.toLowerCase()));
  const merged = [
    ...sectionSkills,
    ...keywordSkills.filter((k) => !sectionLower.has(k.toLowerCase())),
  ];

  if (merged.length > 0) {
    result.skills = merged.slice(0, 40);
  }

  // ----- Education ────────────────────────────────────────────
  const eduRaw = getSectionText(text, [
    "education",
    "educational background",
    "academic background",
    "academic qualifications",
    "qualifications",
  ]);
  if (eduRaw) {
    const degreePatterns = [
      /(?:doctor(?:ate)?|ph\.?\s*d\.?)(?:\s+(?:in|of)\s+[\w\s()&,/]{2,60})?/i,
      /(?:master(?:'?s)?(?:\s+of\s+[\w\s()&,/]{2,50})?|m\.?\s*tech\.?|m\.?\s*eng\.?|m\.?\s*sc\.?|m\.?\s*[bat]\.?|mba)(?:\s+(?:in|of)\s+[\w\s()&,/]{2,60})?/i,
      // Includes 'e' for B.E., 'com' for B.Com, also parens like "B.Tech (CSE)"
      /(?:bachelor(?:'?s)?(?:\s+of\s+[\w\s()&,/]{2,50})?|b\.?\s*tech\.?|b\.?\s*eng\.?|b\.?\s*[sbate]\.?|b\.?\s*com\.?|be\b|bs\b|ba\b)(?:\s*[-–(]?\s*(?:in\s+|of\s+)?[\w\s()&,/]{2,60})?/i,
      /(?:associate(?:'?s)?\s+(?:of|in)\s+[\w\s]{2,50}|a\.?\s*[sa]\.?)(?:\s+(?:in|of)\s+[\w\s()&,/]{2,50})?/i,
      /(?:high\s+school\s+diploma|diploma|certificate)(?:\s+(?:in|of)\s+[\w\s()&,/]{2,50})?/i,
    ];
    for (const p of degreePatterns) {
      const m = eduRaw.match(p);
      if (m) {
        result.degree = m[0].trim().replace(/\s+/g, " ");
        break;
      }
    }

    // If degree found but missing major/field, try to detect it in the edu section
    if (
      result.degree &&
      !/computer|engineering|science|technology|business|arts|commerce|management|information|mathematics|electronics|mechanical|civil|electrical|data|finance|economics|physics|chemistry|biology/i.test(
        result.degree,
      )
    ) {
      const majorPattern =
        /\b(?:computer\s+science(?:\s+and\s+engineering)?|information\s+technology|software\s+engineering|data\s+science|electrical\s+(?:and\s+)?electronics|mechanical\s+engineering|civil\s+engineering|computer\s+engineering|electronics(?:\s+(?:and\s+)?communication)?|business\s+administration|management|commerce|finance|accounting|economics|mathematics|physics|chemistry|biology|artificial\s+intelligence|machine\s+learning)\b/i;
      const majorMatch = eduRaw.match(majorPattern);
      if (majorMatch) result.degree += " in " + majorMatch[0];
    }

    const schoolMatch = eduRaw.match(
      /([A-Z][a-zA-Z\s]{3,60}(?:university|college|institute|school|iit|nit|bits|iiit|iim|academy|polytechnic)[a-zA-Z\s,]*)/i,
    );
    if (schoolMatch)
      result.school = schoolMatch[1].trim().replace(/\s+/g, " ").slice(0, 80);

    const years = eduRaw.match(/\b(19|20)\d{2}\b/g);
    if (years) result.gradYear = years[years.length - 1];
  }

  // ----- Work Experience ──────────────────────────────────────
  const expRaw = getSectionText(text, [
    "professional experience",
    "work experience",
    "employment history",
    "career history",
    "work history",
    "experience",
  ]);
  if (expRaw) {
    const datePattern =
      /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*'?\d{2,4}|\d{4}|\d{2}\/\d{4})\s*(?:[-–-]|to)+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*'?\d{2,4}|\d{4}|\d{2}\/\d{4}|present|current|now|till date)/i;
    const dateMatch = expRaw.match(datePattern);
    if (dateMatch) result.duration = dateMatch[0].trim();

    const titlePattern =
      /\b([\w\s]{3,50}(?:engineer|developer|designer|manager|analyst|consultant|director|lead|specialist|coordinator|architect|scientist|executive|officer|associate|intern|head|vp|vice\s+president|cto|ceo|cfo|coo|president|founder|co-founder|product|program|project|data|software|senior|junior|staff|principal|full[- ]?stack)[\w\s]{0,30})\b/i;
    const titleMatch = expRaw.match(titlePattern);
    if (titleMatch)
      result.jobTitle = titleMatch[1].trim().replace(/\s+/g, " ").slice(0, 60);

    const expLines = expRaw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 1);
    const excludeList = [
      result.jobTitle?.toLowerCase() ?? "",
      result.duration?.toLowerCase() ?? "",
    ];
    for (const line of expLines.slice(0, 6)) {
      const lc = line.toLowerCase();
      if (
        /^[A-Z]/.test(line) &&
        line.length > 2 &&
        line.length < 70 &&
        !excludeList.some((e) => e && lc.includes(e.slice(0, 10))) &&
        !/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i.test(
          line,
        ) &&
        !datePattern.test(line) &&
        line !== result.jobTitle
      ) {
        result.company = line.replace(/[|,]\s*.*$/, "").trim();
        break;
      }
    }

    const descLines = expLines
      .filter(
        (l) =>
          l !== result.jobTitle &&
          l !== result.company &&
          (!result.duration || !l.includes(result.duration.slice(0, 6))) &&
          l.length > 20,
      )
      .slice(0, 4);
    if (descLines.length) {
      result.jobDesc = descLines
        .join(" ")
        .replace(/\s+/g, " ")
        .slice(0, 400)
        .trim();
    }

    const allYears = expRaw.match(/\b(19|20)\d{2}\b/g);
    if (allYears && allYears.length >= 2) {
      const nums = allYears.map(Number);
      const span = Math.max(...nums) - Math.min(...nums);
      if (span < 1) result.yearsOfExperience = "Less than 1 year";
      else if (span <= 3) result.yearsOfExperience = "1–3 years";
      else if (span <= 5) result.yearsOfExperience = "3–5 years";
      else if (span <= 10) result.yearsOfExperience = "5–10 years";
      else result.yearsOfExperience = "10+ years";
    }

    // ----- Parse up to 5 experience entries ─────────────────
    result.experiences = parseExperienceBlocks(
      expRaw,
      titlePattern,
      datePattern,
    );
  }

  // ----- Title -----───
  if (result.jobTitle) {
    result.title = result.jobTitle;
  } else {
    const titleKeywords =
      /engineer|developer|designer|manager|analyst|consultant|director|specialist|architect|scientist|executive|officer|associate|intern|head|cto|ceo|cfo|founder|data scientist|product/i;
    for (const line of lines.slice(0, 8)) {
      if (titleKeywords.test(line) && line.length < 80) {
        result.title = line.trim();
        break;
      }
    }
  }

  return result;
}
