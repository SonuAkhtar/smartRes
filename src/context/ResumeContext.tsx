import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  UserProfile,
  TailoredResume,
  JobEntry,
  JobApplication,
} from "../types";

const STORAGE_KEY = "resume_ctx_v3";

interface PersistedState {
  profile: UserProfile | null;
  resumeText: string;
  jobDescription: string;
  tailoredResume: TailoredResume | null;
  jobHistory: JobEntry[];
  originalResumeFileName: string | null;
  applications: JobApplication[];
}

function loadFromStorage(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed;
  } catch {
    return defaultState();
  }
}

function defaultState(): PersistedState {
  return {
    profile: null,
    resumeText: "",
    jobDescription: "",
    tailoredResume: null,
    jobHistory: [],
    originalResumeFileName: null,
    applications: [],
  };
}

interface ResumeContextType {
  profile: UserProfile | null;
  resumeText: string;
  jobDescription: string;
  tailoredResume: TailoredResume | null;
  jobHistory: JobEntry[];
  applications: JobApplication[];
  originalResumeDataUrl: string | null;
  originalResumeFileName: string | null;
  setProfile: (p: UserProfile | null) => void;
  setResumeText: (t: string) => void;
  setJobDescription: (jd: string) => void;
  setTailoredResume: (tr: TailoredResume | null) => void;
  setJobHistory: (entries: JobEntry[]) => void;
  addJobEntry: (entry: JobEntry) => void;
  deleteJobEntry: (id: string) => void;
  setOriginalResume: (dataUrl: string, fileName: string) => void;
  setApplications: (apps: JobApplication[]) => void;
  addApplication: (app: JobApplication) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;
  clearData: () => void;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();

  const [profile, setProfileState] = useState<UserProfile | null>(
    initial.profile,
  );
  const [resumeText, setResumeTextState] = useState(initial.resumeText);
  const [jobDescription, setJobDescriptionState] = useState(
    initial.jobDescription,
  );
  const [tailoredResume, setTailoredResumeState] =
    useState<TailoredResume | null>(initial.tailoredResume);
  const [jobHistory, setJobHistoryState] = useState<JobEntry[]>(
    initial.jobHistory,
  );
  const [applications, setApplicationsState] = useState<JobApplication[]>(
    initial.applications ?? [],
  );
  const [originalResumeDataUrl, setOriginalResumeDataUrl] = useState<
    string | null
  >(null);
  const [originalResumeFileName, setOriginalResumeFileNameState] = useState<
    string | null
  >(initial.originalResumeFileName);

  useEffect(() => {
    const toSave: PersistedState = {
      profile,
      resumeText,
      jobDescription,
      tailoredResume,
      jobHistory,
      originalResumeFileName,
      applications,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
    }
  }, [
    profile,
    resumeText,
    jobDescription,
    tailoredResume,
    jobHistory,
    originalResumeFileName,
    applications,
  ]);

  const setProfile = (p: UserProfile | null) => setProfileState(p);
  const setResumeText = (t: string) => setResumeTextState(t);
  const setJobDescription = (jd: string) => setJobDescriptionState(jd);
  const setTailoredResume = (tr: TailoredResume | null) =>
    setTailoredResumeState(tr);
  const setJobHistory = (entries: JobEntry[]) => setJobHistoryState(entries);

  const addJobEntry = (entry: JobEntry) =>
    setJobHistoryState((prev) => [entry, ...prev]);

  const deleteJobEntry = (id: string) =>
    setJobHistoryState((prev) => prev.filter((e) => e.id !== id));

  const setOriginalResume = (dataUrl: string, fileName: string) => {
    setOriginalResumeDataUrl(dataUrl);
    setOriginalResumeFileNameState(fileName);
  };

  const setApplications = (apps: JobApplication[]) =>
    setApplicationsState(apps);

  const addApplication = (app: JobApplication) =>
    setApplicationsState((prev) => [app, ...prev]);

  const updateApplication = (id: string, patch: Partial<JobApplication>) =>
    setApplicationsState((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a,
      ),
    );

  const deleteApplication = (id: string) =>
    setApplicationsState((prev) => prev.filter((a) => a.id !== id));

  const clearData = () => {
    setProfileState(null);
    setResumeTextState("");
    setJobDescriptionState("");
    setTailoredResumeState(null);
    setJobHistoryState([]);
    setApplicationsState([]);
    setOriginalResumeDataUrl(null);
    setOriginalResumeFileNameState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        profile,
        resumeText,
        jobDescription,
        tailoredResume,
        jobHistory,
        applications,
        originalResumeDataUrl,
        originalResumeFileName,
        setProfile,
        setResumeText,
        setJobDescription,
        setTailoredResume,
        setJobHistory,
        addJobEntry,
        deleteJobEntry,
        setOriginalResume,
        setApplications,
        addApplication,
        updateApplication,
        deleteApplication,
        clearData,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
}
