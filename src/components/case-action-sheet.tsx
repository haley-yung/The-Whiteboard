"use client";

import { useState, useTransition } from "react";
import type { Case, Phase, User } from "@/lib/types";
import { PHASES, BOARD_PHASES } from "@/lib/types";
import { Button, Icon, Pill } from "./primitives";
import {
  approveCase,
  assignMoAndAdvance,
  editDeadlines,
  markPtvComplete,
  movePhase,
  rejectCase,
  resubmit,
} from "@/lib/actions";
import { REJECTION_REASONS } from "@/lib/types";
import { Sheet } from "./sheet";
import { formatDateShort } from "@/lib/urgency";

type Props = {
  c: Case;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onShowHistory: (caseId: string) => void;
};

export function CaseActionSheet({ c, users, currentUser, onClose, onShowHistory }: Props) {
  const [mode, setMode] = useState<"menu" | "assignMo" | "editDates" | "movePhase" | "reject">("menu");
  const [pending, startTransition] = useTransition();

  const mosForSite = users.filter(
    (u) => u.role === "MO" && u.sites.includes(c.treatment_site),
  );

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
        onClose();
      } catch (err) {
        alert((err as Error).message);
      }
    });

  return (
    <Sheet
      onClose={onClose}
      title={
        mode === "menu"
          ? "Case actions"
          : mode === "assignMo"
            ? "Assign MO"
            : mode === "editDates"
              ? "Edit deadlines"
              : mode === "movePhase"
                ? "Move to phase"
                : "Reject case"
      }
      subtitle={`${c.patient_initials} · ${c.patient_identifier} · ${c.treatment_site}`}
    >
      {mode === "menu" && (
        <MenuView
          c={c}
          currentUser={currentUser}
          pending={pending}
          onShowHistory={() => onShowHistory(c.id)}
          onPickAssign={() => setMode("assignMo")}
          onPickEdit={() => setMode("editDates")}
          onPickMove={() => setMode("movePhase")}
          onPickReject={() => setMode("reject")}
          onMark={() => run(() => markPtvComplete(c.id))}
          onResubmit={() => run(() => resubmit(c.id))}
          onApprove={() => run(() => approveCase(c.id, currentUser.id))}
        />
      )}

      {mode === "assignMo" && (
        <AssignMoView
          options={mosForSite.length > 0 ? mosForSite : users.filter((u) => u.role === "MO")}
          onBack={() => setMode("menu")}
          onPick={(moId) => run(() => assignMoAndAdvance(c.id, moId))}
          pending={pending}
          currentAssignee={c.assigned_mo_id}
        />
      )}

      {mode === "editDates" && (
        <EditDatesView
          c={c}
          pending={pending}
          onBack={() => setMode("menu")}
          onSubmit={(t, tx) => run(() => editDeadlines(c.id, t, tx))}
        />
      )}

      {mode === "movePhase" && (
        <MovePhaseView
          current={c.current_phase}
          pending={pending}
          onBack={() => setMode("menu")}
          onPick={(p) => run(() => movePhase(c.id, p))}
        />
      )}

      {mode === "reject" && (
        <RejectView
          c={c}
          currentUser={currentUser}
          pending={pending}
          onBack={() => setMode("menu")}
          onSubmit={(reasons, note) =>
            run(() => rejectCase(c.id, currentUser.id, reasons, note))
          }
        />
      )}
    </Sheet>
  );
}

function MenuView({
  c,
  currentUser,
  pending,
  onShowHistory,
  onPickAssign,
  onPickEdit,
  onPickMove,
  onPickReject,
  onMark,
  onResubmit,
  onApprove,
}: {
  c: Case;
  currentUser: User;
  pending: boolean;
  onShowHistory: () => void;
  onPickAssign: () => void;
  onPickEdit: () => void;
  onPickMove: () => void;
  onPickReject: () => void;
  onMark: () => void;
  onResubmit: () => void;
  onApprove: () => void;
}) {
  const role = currentUser.role;
  const actions: React.ReactNode[] = [];

  if (role === "RT") {
    if (c.current_phase === "Pending Assign") {
      actions.push(
        <Button key="assign" variant="primary" onClick={onPickAssign}>
          Assign MO & move to PTV
        </Button>,
      );
    }
    actions.push(
      <Button key="edit" variant="secondary" onClick={onPickEdit}>
        Edit deadlines
      </Button>,
    );
    actions.push(
      <Button key="move" variant="ghost" onClick={onPickMove}>
        Move to phase…
      </Button>,
    );
  }

  if (role === "MO" && c.assigned_mo_id === currentUser.id) {
    if (c.current_phase === "PTV") {
      actions.push(
        <Button key="mark" variant="primary" onClick={onMark} disabled={pending}>
          <Icon name="check" size={14} /> Mark PTV complete
        </Button>,
      );
    }
    if (c.current_phase === "Re-PTV") {
      actions.push(
        <Button key="resub" variant="primary" onClick={onResubmit} disabled={pending}>
          Resubmit for review
        </Button>,
      );
    }
  }

  if (role === "Big MO" && c.current_phase === "Pending Check") {
    actions.push(
      <Button key="approve" variant="success" onClick={onApprove} disabled={pending}>
        <Icon name="check" size={14} /> Approve
      </Button>,
    );
    actions.push(
      <Button key="reject" variant="danger" onClick={onPickReject}>
        <Icon name="x" size={14} /> Reject
      </Button>,
    );
  }

  if (c.latest_rejection) {
    actions.push(
      <Button key="hist" variant="ghost" onClick={onShowHistory}>
        View rejection history
      </Button>,
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      {actions.length === 0 && (
        <div className="px-2 pb-2 text-[12px] text-[color:var(--color-muted)]">
          No available actions for this case in your current role.
        </div>
      )}
      {actions}
    </div>
  );
}

function AssignMoView({
  options,
  onBack,
  onPick,
  pending,
  currentAssignee,
}: {
  options: User[];
  onBack: () => void;
  onPick: (id: string) => void;
  pending: boolean;
  currentAssignee: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="text-[11px] text-[color:var(--color-muted)]">
        MOs linked to this site:
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((m) => (
          <Pill
            key={m.id}
            active={m.id === currentAssignee}
            onClick={() => onPick(m.id)}
            disabled={pending}
          >
            {m.name}
          </Pill>
        ))}
      </div>
      <Button variant="ghost" onClick={onBack} className="mt-2 self-start">
        <Icon name="back" size={14} /> Back
      </Button>
    </div>
  );
}

function EditDatesView({
  c,
  pending,
  onBack,
  onSubmit,
}: {
  c: Case;
  pending: boolean;
  onBack: () => void;
  onSubmit: (target: string, treatment: string) => void;
}) {
  const [target, setTarget] = useState(c.target_date);
  const [treatment, setTreatment] = useState(c.treatment_date);
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <label className="block">
        <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Target date
        </div>
        <input
          type="date"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[13px]"
        />
      </label>
      <label className="block">
        <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Treatment date
        </div>
        <input
          type="date"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[13px]"
        />
      </label>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => onSubmit(target, treatment)}
          className="flex-1 justify-center"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function MovePhaseView({
  current,
  pending,
  onBack,
  onPick,
}: {
  current: Phase;
  pending: boolean;
  onBack: () => void;
  onPick: (p: Phase) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="text-[11px] text-[color:var(--color-muted)]">
        Admin override — move to any phase:
      </div>
      <div className="flex flex-wrap gap-2">
        {PHASES.map((p) => (
          <Pill
            key={p}
            active={p === current}
            onClick={() => onPick(p)}
            disabled={pending || p === current}
          >
            {p}
          </Pill>
        ))}
      </div>
      <Button variant="ghost" onClick={onBack} className="mt-2 self-start">
        <Icon name="back" size={14} /> Back
      </Button>
    </div>
  );
}

function RejectView({
  c,
  pending,
  onBack,
  onSubmit,
}: {
  c: Case;
  currentUser: User;
  pending: boolean;
  onBack: () => void;
  onSubmit: (reasons: string[], note: string | null) => void;
}) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggle = (r: string) =>
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div>
        <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Reasons <span className="text-[color:var(--color-red)]">*</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REJECTION_REASONS.map((r) => (
            <Pill key={r} active={reasons.includes(r)} onClick={() => toggle(r)}>
              {r}
            </Pill>
          ))}
        </div>
      </div>
      <label className="block">
        <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Note (optional)
        </div>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Clarify for the MO…"
          className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[13px] placeholder:italic placeholder:text-[color:var(--color-faint)]"
        />
      </label>
      <div className="mt-1 flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={pending || reasons.length === 0}
          onClick={() => onSubmit(reasons, note.trim() || null)}
          className="flex-[2] justify-center"
        >
          Send back to MO
        </Button>
      </div>
      <div className="text-[10px] text-[color:var(--color-faint)]">
        Target {formatDateShort(c.target_date)} · case moves to Re-PTV
      </div>
    </div>
  );
}

export const boardPhases = BOARD_PHASES;
