import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ResumeProvider, useResume } from "./context/ResumeContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { loadProfile, loadJobHistory, loadApplications } from "./lib/db";
import type { UserProfile } from "./types";
import Header from "./components/Header/Header";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import Home from "./pages/Home/Home";
import Auth from "./pages/Auth/Auth";
import ProfileBuilder from "./pages/ProfileBuilder/ProfileBuilder";
import Profile from "./pages/Profile/Profile";
import JobMatcher from "./pages/JobMatcher/JobMatcher";
import JobHistory from "./pages/JobHistory/JobHistory";
import Applications from "./pages/Applications/Applications";
import InterviewPrep from "./pages/InterviewPrep/InterviewPrep";
import Dashboard from "./pages/Dashboard/Dashboard";
import Settings from "./pages/Settings/Settings";
import CoverLetter from "./pages/CoverLetter/CoverLetter";
import Templates from "./pages/Templates/Templates";
import Upgrade from "./pages/Upgrade/Upgrade";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy";
import TermsOfService from "./pages/Legal/TermsOfService";
import CookiePolicy from "./pages/Legal/CookiePolicy";
import NotFound from "./pages/NotFound/NotFound";
import AuthConfirm from "./pages/AuthConfirm/AuthConfirm";

function AppLoadingScreen() {
  return (
    <div className="app-loading" role="status" aria-label="Loading SmartRes">
      <div className="app-loading__logo" aria-hidden="true">
        SR
      </div>
      <div className="app-loading__dots" aria-hidden="true">
        <span className="app-loading__dot" />
        <span className="app-loading__dot" />
        <span className="app-loading__dot" />
      </div>
    </div>
  );
}

function migrateProfile(raw: Record<string, unknown>): UserProfile {
  if (!raw.educations) {
    const edu = raw.education as
      | { degree?: string; school?: string; year?: string }
      | undefined;
    raw.educations = edu?.degree
      ? [
          {
            id: "1",
            degree: edu.degree,
            school: edu.school ?? "",
            year: edu.year ?? "",
          },
        ]
      : [];
    delete raw.education;
  }
  if (!raw.experiences) {
    const exp = raw.experience as
      | {
          title?: string;
          company?: string;
          duration?: string;
          description?: string;
        }
      | undefined;
    raw.experiences = exp?.company
      ? [
          {
            id: "1",
            title: exp.title ?? "",
            company: exp.company,
            duration: exp.duration ?? "",
            description: exp.description ?? "",
          },
        ]
      : [];
    delete raw.experience;
  }
  return raw as unknown as UserProfile;
}

function ProfileSync() {
  const { user } = useAuth();
  const { profile, setProfile, setJobHistory, setApplications, clearData } =
    useResume();

  useEffect(() => {
    if (!user) {
      clearData();
      return;
    }

    const load = async () => {
      const [p, h, a] = await Promise.all([
        loadProfile(user.id),
        loadJobHistory(user.id),
        loadApplications(user.id),
      ]);
      if (p)
        setProfile(migrateProfile(p as unknown as Record<string, unknown>));
      else if (!profile) setProfile(null);
      if (h.length) setJobHistory(h);
      if (a.length) setApplications(a);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        navigate("/dashboard");
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        navigate("/job-matcher");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);

  if (loading) return <AppLoadingScreen />;

  return (
    <>
      <ScrollToTop />
      <ProfileSync />
      <Header />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route
          path="/profile-builder"
          element={
            <ProtectedRoute>
              <ProfileBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-matcher"
          element={
            <ProtectedRoute>
              <JobMatcher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-history"
          element={
            <ProtectedRoute>
              <JobHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute>
              <InterviewPrep />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <CoverLetter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ResumeProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </ResumeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
