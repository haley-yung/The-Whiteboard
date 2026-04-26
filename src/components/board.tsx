"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Case, Phase, Site, User } from "@/lib/types";
import { BOARD_PHASES } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { Button, Icon, SectionHeader } from "./primitives";
import { CaseCard, ReworkCard } from "./case-card";
import { SiteFilter } from "./site-filter";
import { CaseActionSheet } from "./case-action-sheet";
import { RejectionHistorySheet } from "./rejection-history";

const phaseLabel: Record<Phase, string> = {
  "Pending Assign": "Pending Assign",
  PTV: "In PTV",
  "Pending Check": "Pending Check",
  "Re-PTV": "Rework",
  Archive: "Archive",
};

export function Board({ cases }: { cases: Case[] }) {
  const { currentUser, users } = useUser();
  const [selectedSites, setSelectedSites] = useState<Site[] | "all">("all");
  const [activePhase, setActivePhase] = useState<Phase | "all">("all");
  const [openCase, setOpenCase] = useState<Case | null>(null);
  const [historyCaseId, setHistoryCaseId] = useState<string | null>(null);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  // Role scoping for cases
  const roleScoped = useMemo(() => {
    const active = cases.filter((c) => c.current_phase !== "Archive");
    if (currentUser.role === "RT") return active;
    if (currentUser.role === "MO") return active.filter((c) => c.assigned_mo_id === currentUser.id);
    return active.filter((c) => currentUser.sites.includes(c.treatment_site));
  }, [cases, currentUser]);

  // Available site filter options (only sites relevant to the user)
  const filterSites: Site[] | undefined = useMemo(() => {
    if (currentUser.role === "RT") return undefined;
    return currentUser.sites.length > 0 ? currentUser.sites : undefined;
  }, [currentUser]);

  // Apply site filter
  const siteFiltered = useMemo(() => {
    if (selectedSites === "all") return roleScoped;
    return roleScoped.filter((c) => (selectedSites as Site[]).includes(c.treatment_site));
  }, [roleScoped, selectedSites]);

  // Group by phase. RT sees Rework on top, then Pending Assign, then PTV, then Pending Check.
  const phases = useMemo(() => {
    const visiblePhases: Phase[] =
      currentUser.role === "MO"
        ? ["Re-PTV", "PTV", "Pending Check"]
        : currentUser.role === "RT"
          ? ["Re-PTV", "Pending Assign", "PTV", "Pending Check"]
          : BOARD_PHASES;
    const byPhase = new Map<Phase, Case[]>(visiblePhases.map((p) => [p, []]));
    for (const c of siteFiltered) {
      const list = byPhase.get(c.current_phase);
      if (list) list.push(c);
    }
    // Sort: Pending Check by treatment_date, others by target_date. Overdue floats first.
    for (const [phase, list] of byPhase.entries()) {
      const key: "target_date" | "treatment_date" =
        phase === "Pending Check" ? "treatment_date" : "target_date";
      list.sort((a, b) => a[key].localeCompare(b[key]));
    }
    return visiblePhases.map((p) => ({ phase: p, list: byPhase.get(p) ?? [] }));
  }, [siteFiltered, currentUser]);

  const visiblePhases = phases.map((p) => p.phase);
  const phasesToRender =
    activePhase === "all"
      ? phases
      : phases.filter((p) => p.phase === activePhase);

  const totalCount = siteFiltered.length;

  return (
    <div className="relative pb-24 lg:pb-10">
      {/* Header area */}
      <div className="bg-[color:var(--color-paper)] pb-2 pt-3">
        <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-serif text-[18px] font-semibold tracking-tight">
              {currentUser.role === "RT"
                ? "Board"
                : currentUser.role === "MO"
                  ? "My cases"
                  : "Review queue"}
            </div>
            <div className="text-[11px] text-[color:var(--color-muted)]">
              {currentUser.name} · {totalCount} case{totalCount === 1 ? "" : "s"}
            </div>
          </div>
          {currentUser.role === "RT" && (
            <Link href="/new-case">
              <Button variant="primary" size="md" className="hidden sm:inline-flex">
                <Icon name="plus" size={14} /> New case
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-2">
          <SiteFilter
            selected={selectedSites}
            available={filterSites}
            onToggle={setSelectedSites}
          />
        </div>

        {/* Phase tab bar — visible on all sizes; lets user jump between columns */}
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          <PhaseTab
            label="All"
            active={activePhase === "all"}
            onClick={() => setActivePhase("all")}
          />
          {visiblePhases.map((p) => (
            <PhaseTab
              key={p}
              label={phaseLabel[p]}
              count={phases.find((x) => x.phase === p)?.list.length ?? 0}
              active={activePhase === p}
              onClick={() => setActivePhase(p)}
              accent={p === "Re-PTV" ? "var(--color-red)" : undefined}
            />
          ))}
        </div>
        </div>
      </div>

      {/* Board body — desktop: horizontal columns (All); mobile: stacked groups */}
      <div className="mx-auto w-full max-w-[1400px] px-4">
        {phasesToRender.length === 0 ||
        phasesToRender.every((p) => p.list.length === 0) ? (
          <div className="mt-12 text-center text-[13px] text-[color:var(--color-muted)]">
            No cases.
          </div>
        ) : activePhase === "all" ? (
          <>
            {/* Desktop horizontal columns */}
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-5">
              {phasesToRender.map(({ phase, list }) => (
                <div key={phase}>
                  <SectionHeader
                    label={phaseLabel[phase]}
                    count={list.length}
                    accent={phase === "Re-PTV" ? "var(--color-red)" : undefined}
                  />
                  {list.length === 0 ? (
                    <div className="py-2 text-[11px] italic text-[color:var(--color-faint)]">
                      Empty
                    </div>
                  ) : (
                    list.map((c) =>
                      phase === "Re-PTV" ? (
                        <ReworkCard
                          key={c.id}
                          c={c}
                          users={userMap}
                          onClick={() => setOpenCase(c)}
                          onShowHistory={setHistoryCaseId}
                        />
                      ) : (
                        <CaseCard
                          key={c.id}
                          c={c}
                          users={userMap}
                          onClick={() => setOpenCase(c)}
                        />
                      ),
                    )
                  )}
                </div>
              ))}
            </div>
            {/* Mobile / tablet: stacked */}
            <div className="lg:hidden">
              {phasesToRender.map(({ phase, list }) =>
                list.length > 0 ? (
                  <div key={phase}>
                    <SectionHeader
                      label={phaseLabel[phase]}
                      count={list.length}
                      accent={phase === "Re-PTV" ? "var(--color-red)" : undefined}
                    />
                    {list.map((c) =>
                      phase === "Re-PTV" ? (
                        <ReworkCard
                          key={c.id}
                          c={c}
                          users={userMap}
                          onClick={() => setOpenCase(c)}
                          onShowHistory={setHistoryCaseId}
                        />
                      ) : (
                        <CaseCard
                          key={c.id}
                          c={c}
                          users={userMap}
                          onClick={() => setOpenCase(c)}
                        />
                      ),
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </>
        ) : (
          // Single phase view
          <div className="mt-2">
            {phasesToRender[0].list.map((c) =>
              phasesToRender[0].phase === "Re-PTV" ? (
                <ReworkCard
                  key={c.id}
                  c={c}
                  users={userMap}
                  onClick={() => setOpenCase(c)}
                  onShowHistory={setHistoryCaseId}
                />
              ) : (
                <CaseCard
                  key={c.id}
                  c={c}
                  users={userMap}
                  onClick={() => setOpenCase(c)}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Floating New Case FAB for RT on mobile */}
      {currentUser.role === "RT" && (
        <Link
          href="/new-case"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-5 py-3.5 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.2)] sm:hidden"
        >
          <Icon name="plus" size={16} /> New case
        </Link>
      )}

      {openCase && (
        <CaseActionSheet
          c={openCase}
          users={users}
          currentUser={currentUser}
          onClose={() => setOpenCase(null)}
          onShowHistory={(id) => {
            setOpenCase(null);
            setHistoryCaseId(id);
          }}
        />
      )}

      {historyCaseId && (
        <RejectionHistorySheet
          caseId={historyCaseId}
          users={userMap}
          onClose={() => setHistoryCaseId(null)}
        />
      )}
    </div>
  );
}

function PhaseTab({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
        active
          ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
          : "border-[color:var(--color-line)] bg-transparent text-[color:var(--color-muted)]"
      }`}
      style={accent && !active ? { color: accent, borderColor: accent } : undefined}
    >
      <span className="font-medium">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] opacity-80">{count}</span>
      )}
    </button>
  );
}
