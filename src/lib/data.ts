import "server-only";
import { createRscSupabase } from "./supabase";
import type { Case, Phase, Rejection, Role, Site, User } from "./types";

type UserRow = { id: string; name: string; role: Role };
type SiteRow = { user_id: string; site: Site };

export async function getUsers(): Promise<User[]> {
  const sb = createRscSupabase();
  const [usersRes, sitesRes] = await Promise.all([
    sb.from("users").select("id, name, role").order("role").order("name"),
    sb.from("user_sites").select("user_id, site"),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (sitesRes.error) throw sitesRes.error;

  const siteMap = new Map<string, Site[]>();
  for (const row of (sitesRes.data ?? []) as SiteRow[]) {
    const list = siteMap.get(row.user_id) ?? [];
    list.push(row.site);
    siteMap.set(row.user_id, list);
  }
  return (usersRes.data ?? []).map((u: UserRow) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    sites: siteMap.get(u.id) ?? [],
  }));
}

type CaseRow = {
  id: string;
  patient_identifier: string;
  patient_initials: string;
  treatment_site: Site;
  target_date: string;
  treatment_date: string;
  assigned_mo_id: string | null;
  current_phase: Phase;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCases(): Promise<Case[]> {
  const sb = createRscSupabase();
  const [casesRes, rejRes] = await Promise.all([
    sb
      .from("cases")
      .select("*")
      .order("target_date", { ascending: true }),
    sb
      .from("rejections")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  if (casesRes.error) throw casesRes.error;
  if (rejRes.error) throw rejRes.error;

  const latestByCase = new Map<string, Rejection>();
  for (const r of (rejRes.data ?? []) as Rejection[]) {
    if (!latestByCase.has(r.case_id)) latestByCase.set(r.case_id, r);
  }
  return (casesRes.data ?? []).map((c: CaseRow) => ({
    ...c,
    latest_rejection: latestByCase.get(c.id) ?? null,
  }));
}

export async function getRejectionsForCase(caseId: string): Promise<Rejection[]> {
  const sb = createRscSupabase();
  const { data, error } = await sb
    .from("rejections")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rejection[];
}
