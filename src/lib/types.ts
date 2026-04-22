export type Role = "RT" | "MO" | "Big MO";

export const SITES = [
  "Brain",
  "Head & Neck",
  "Lung",
  "Abdomen",
  "Prostate",
  "Gynae",
  "Breast",
] as const;

export type Site = (typeof SITES)[number];

export const PHASES = ["OAR", "PTV", "Pending Check", "Re-PTV", "Archive"] as const;
export type Phase = (typeof PHASES)[number];

export const BOARD_PHASES: Phase[] = ["OAR", "PTV", "Pending Check", "Re-PTV"];

export const REJECTION_REASONS = [
  "Margin too tight",
  "Margin too generous",
  "Includes OAR",
  "Coverage insufficient",
  "Incorrect target volume",
  "Missing structure",
] as const;

export type User = {
  id: string;
  name: string;
  role: Role;
  sites: Site[];
};

export type Case = {
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
  latest_rejection?: Rejection | null;
};

export type Rejection = {
  id: string;
  case_id: string;
  rejected_by: string;
  reasons: string[];
  note: string | null;
  created_at: string;
};

export const SITE_SHORT: Record<Site, string> = {
  Brain: "Brain",
  "Head & Neck": "H&N",
  Lung: "Lung",
  Abdomen: "Abd",
  Prostate: "Prostate",
  Gynae: "Gynae",
  Breast: "Breast",
};
