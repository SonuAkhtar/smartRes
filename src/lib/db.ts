import { supabase } from "./supabase";
import type { UserProfile, JobEntry, JobApplication } from "../types";

// ----- Profile -----─

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  // .maybeSingle() returns null data (no error) when 0 rows exist,
  // avoiding the 406 that .single() throws for a missing profile row.
  const { data, error } = await supabase
    .from("profiles")
    .select("data")
    .eq("id", userId)
    .maybeSingle();
  if (error) console.error("loadProfile:", error.message);
  return (data?.data as UserProfile) ?? null;
}

export async function saveProfile(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    data: profile,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("saveProfile:", error.message);
}

// ----- Job History ──────────────────────────────────────────

export async function loadJobHistory(userId: string): Promise<JobEntry[]> {
  const { data, error } = await supabase
    .from("job_history")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("loadJobHistory:", error.message);
  return data?.map((row) => row.data as JobEntry) ?? [];
}

export async function saveJobEntry(
  userId: string,
  entry: JobEntry,
): Promise<void> {
  const { error } = await supabase.from("job_history").upsert({
    id: entry.id,
    user_id: userId,
    data: entry,
    created_at: entry.createdAt,
  });
  if (error) console.error("saveJobEntry:", error.message);
}

export async function removeJobEntry(jobId: string): Promise<void> {
  const { error } = await supabase.from("job_history").delete().eq("id", jobId);
  if (error) console.error("removeJobEntry:", error.message);
}

// ----- Job Applications ─────────────────────────────────────
// Requires table: job_applications (id text PK, user_id uuid, data jsonb, created_at timestamptz)

export async function loadApplications(
  userId: string,
): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("loadApplications:", error.message);
  return data?.map((row) => row.data as JobApplication) ?? [];
}

export async function saveApplication(
  userId: string,
  app: JobApplication,
): Promise<void> {
  const { error } = await supabase.from("job_applications").upsert({
    id: app.id,
    user_id: userId,
    data: app,
    created_at: app.createdAt,
  });
  if (error) console.error("saveApplication:", error.message);
}

export async function removeApplication(appId: string): Promise<void> {
  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", appId);
  if (error) console.error("removeApplication:", error.message);
}
