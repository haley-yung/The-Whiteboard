"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { Phase, Site } from "./types";

function assertSite(s: unknown): Site {
  const allowed: Site[] = ["Brain", "H&N", "Lung", "Abdomen", "Prostate", "Gynae", "Breast"];
  if (typeof s !== "string" || !allowed.includes(s as Site)) {
    throw new Error(`Invalid site: ${s}`);
  }
  return s as Site;
}

function assertPhase(p: unknown): Phase {
  const allowed: Phase[] = ["Pending Assign", "PTV", "Pending Check", "Re-PTV", "Archive"];
  if (typeof p !== "string" || !allowed.includes(p as Phase)) {
    throw new Error(`Invalid phase: ${p}`);
  }
  return p as Phase;
}

// Create case (from New Case form). If an MO is picked at creation, the case
// goes straight into PTV; otherwise it sits in Pending Assign until the RT
// assigns one from the board.
export async function createCase(form: {
  patient_identifier: string;
  patient_initials: string;
  treatment_site: string;
  target_date: string;
  treatment_date: string;
  assigned_mo_id: string | null;
}) {
  const sb = await createServerSupabase();
  const id = form.patient_identifier.trim();
  if (!/^RU \d{8}$/.test(id)) throw new Error("Patient ID must be 'RU ' + 8 digits");
  const initials = form.patient_initials.trim();
  if (!initials) throw new Error("Initials required");

  const { error } = await sb.from("cases").insert({
    patient_identifier: id,
    patient_initials: initials,
    treatment_site: assertSite(form.treatment_site),
    target_date: form.target_date,
    treatment_date: form.treatment_date,
    current_phase: form.assigned_mo_id ? "PTV" : "Pending Assign",
    assigned_mo_id: form.assigned_mo_id,
  });
  if (error) throw error;
  revalidatePath("/");
  redirect("/");
}

// RT: assign MO and move Pending Assign → PTV
export async function assignMoAndAdvance(caseId: string, moId: string) {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("cases")
    .update({ assigned_mo_id: moId, current_phase: "PTV" })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
}

// RT: edit deadlines
export async function editDeadlines(caseId: string, target: string, treatment: string) {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("cases")
    .update({ target_date: target, treatment_date: treatment })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
}

// RT: manual phase override
export async function movePhase(caseId: string, phase: string) {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("cases")
    .update({ current_phase: assertPhase(phase) })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
}

// MO: mark PTV complete → Pending Check
export async function markPtvComplete(caseId: string) {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("cases")
    .update({ current_phase: "Pending Check" })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
}

// MO: resubmit Re-PTV → Pending Check
export async function resubmit(caseId: string) {
  return markPtvComplete(caseId);
}

// Big MO: approve → Archive
export async function approveCase(caseId: string, approverId: string) {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("cases")
    .update({
      current_phase: "Archive",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/archive");
}

// Big MO: reject → Re-PTV + rejection row
export async function rejectCase(
  caseId: string,
  rejectedBy: string,
  reasons: string[],
  note: string | null,
) {
  if (!reasons.length) throw new Error("At least one reason is required");
  const sb = await createServerSupabase();
  const { error: rejErr } = await sb
    .from("rejections")
    .insert({ case_id: caseId, rejected_by: rejectedBy, reasons, note });
  if (rejErr) throw rejErr;
  const { error } = await sb
    .from("cases")
    .update({ current_phase: "Re-PTV" })
    .eq("id", caseId);
  if (error) throw error;
  revalidatePath("/");
}
