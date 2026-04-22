"use client";

import type { Case, User } from "@/lib/types";
import { Card, UrgencyBadge, formatDateShort } from "./primitives";

function stripParens(name: string | undefined): string {
  if (!name) return "—";
  return name.replace(/\s*\(.*\)/, "");
}

export function CaseCard({
  c,
  users,
  onClick,
}: {
  c: Case;
  users: Map<string, User>;
  onClick?: () => void;
}) {
  const mo = c.assigned_mo_id ? users.get(c.assigned_mo_id) : null;
  const moName = mo ? stripParens(mo.name) : "— unassigned —";
  const days = daysClient(c.target_date);
  const highlight = days < 0 ? "red" : null;

  return (
    <Card
      onClick={onClick}
      highlight={highlight}
      className="mb-2.5 px-3.5 py-3"
      style={
        days < 0
          ? { background: "color-mix(in srgb, var(--color-red-bg) 40%, white)" }
          : undefined
      }
    >
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5">
          <UrgencyBadge targetDate={c.target_date} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[16px] font-semibold tracking-tight">
            {c.patient_initials}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[color:var(--color-muted)]">
            {c.patient_identifier} · {c.treatment_site} · MO: {moName}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[color:var(--color-faint)]">Target</div>
          <div className="text-[13px] font-semibold">{formatDateShort(c.target_date)}</div>
        </div>
      </div>
    </Card>
  );
}

export function ReworkCard({
  c,
  users,
  onClick,
  onShowHistory,
}: {
  c: Case;
  users: Map<string, User>;
  onClick?: () => void;
  onShowHistory?: (caseId: string) => void;
}) {
  const rej = c.latest_rejection;
  const reviewer = rej ? stripParens(users.get(rej.rejected_by)?.name) : null;
  return (
    <Card
      onClick={onClick}
      className="mb-2.5 border-[color:var(--color-red)] px-3.5 py-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex items-center rounded bg-[color:var(--color-red)] px-2 py-1 text-[10px] font-bold tracking-wider text-white">
          REWORK
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[16px] font-semibold tracking-tight">
            {c.patient_initials}
          </div>
          <div className="truncate text-[11px] text-[color:var(--color-muted)]">
            {c.patient_identifier} · {c.treatment_site}
            {rej?.note && (
              <>
                {" · "}
                <i>&ldquo;{rej.note}&rdquo;</i>
              </>
            )}
          </div>
          {rej?.reasons && rej.reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {rej.reasons.map((r, i) => (
                <span
                  key={i}
                  className="rounded bg-[color:var(--color-red-bg)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-red)]"
                >
                  {r}
                </span>
              ))}
              {reviewer && (
                <span className="text-[10px] text-[color:var(--color-faint)]">
                  by {reviewer}
                </span>
              )}
              {onShowHistory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowHistory(c.id);
                  }}
                  className="text-[10px] font-medium text-[color:var(--color-muted)] underline underline-offset-2"
                >
                  history
                </button>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[color:var(--color-faint)]">Target</div>
          <div className="text-[13px] font-semibold">{formatDateShort(c.target_date)}</div>
        </div>
      </div>
    </Card>
  );
}

function daysClient(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - t0.getTime()) / 86400000);
}
