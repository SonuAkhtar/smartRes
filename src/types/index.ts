export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  yearsOfExperience: string;
  skills: string[];
  educations: Education[];
  experiences: Experience[];
  summary: string;
  linkedIn: string;
  portfolio: string;
  resumeFileName?: string;
}

export interface ResumeSuggestion {
  section: "summary" | "skills" | "experience" | "general";
  priority: "high" | "medium" | "low";
  suggestion: string;
  keywords: string[];
}

export interface TailoredResume extends UserProfile {
  suggestedSkills: string[];
  matchedSkills: string[];
  tailoredSummary: string;
  matchScore: number;
  suggestions: ResumeSuggestion[];
  company: string;
  analyzedAt: string;
  usedAI?: boolean;
}

export interface JobEntry {
  id: string;
  company: string;
  jdSnippet: string;
  fullJD: string;
  matchScore: number;
  matchedSkills: string[];
  suggestedSkills: string[];
  suggestions: ResumeSuggestion[];
  tailoredSummary: string;
  createdAt: string;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface JobApplication {
  id: string;
  jobEntryId?: string;
  company: string;
  role: string;
  jdSnippet: string;
  matchScore?: number;
  status: ApplicationStatus;
  appliedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionCategory =
  | "behavioral"
  | "technical"
  | "situational"
  | "role-specific";

export interface InterviewQuestion {
  category: QuestionCategory;
  question: string;
  tip: string;
}
