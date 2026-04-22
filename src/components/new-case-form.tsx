"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SITES } from "@/lib/types";
import type { Site } from "@/lib/types";
import { createCase } from "@/lib/actions";
import { Button, Icon, Pill } from "./primitives";
import { toISODate } from "@/lib/urgency";

export function NewCaseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [initials, setInitials] = useState("");
  const [site, setSite] = useState<Site | null>(null);

  const defaultTarget = toISODate(addDays(new Date(), 5));
  const defaultTreatment = toISODate(addDays(new Date(), 12));
  const [targetDate, setTargetDate] = useState(defaultTarget);
  const [treatmentDate, setTreatmentDate] = useState(defaultTreatment);
  const [error, setError] = useState<string | null>(null);

  const idValid = /^\d{8}$/.test(identifier);
  const canSubmit = idValid && initials.trim().length > 0 && site && targetDate && treatmentDate;

  const onSubmit = () => {
    if (!canSubmit || !site) return;
    setError(null);
    startTransition(async () => {
      try {
        await createCase({
          patient_identifier: `RU ${identifier}`,
          patient_initials: initials.trim(),
          treatment_site: site,
          target_date: targetDate,
          treatment_date: treatmentDate,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/NEXT_REDIRECT/i.test(msg)) return; // redirect thrown by action
        setError(msg);
      }
    });
  };

  return (
    <div className="pb-24">
      <div className="sticky top-[57px] z-10 flex items-center gap-3 border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-3">
        <Link href="/" aria-label="Back">
          <Icon name="back" size={18} />
        </Link>
        <div className="font-serif text-[18px] font-semibold tracking-tight">New case</div>
      </div>
      <div className="px-4 py-4">
        <Field label="Patient identifier" hint="8 digits · numeric keypad">
          <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5">
            <span className="text-[13px] font-semibold text-[color:var(--color-faint)]">RU</span>
            <input
              value={identifier}
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="00000000"
              className="w-full border-none bg-transparent text-[14px] font-semibold outline-none"
              autoFocus
            />
            {idValid && <Icon name="check" size={14} className="text-[color:var(--color-green)]" />}
          </div>
        </Field>

        <Field label="Patient initials">
          <input
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
            placeholder="e.g. Chan SH"
            className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[14px] outline-none placeholder:italic placeholder:text-[color:var(--color-faint)]"
          />
        </Field>

        <Field label="Treatment site">
          <div className="flex flex-wrap gap-1.5">
            {SITES.map((s) => (
              <Pill key={s} active={site === s} onClick={() => setSite(s)}>
                {s}
              </Pill>
            ))}
          </div>
        </Field>

        <div className="mt-4 flex gap-3">
          <Field label="Target date" className="flex-1">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[14px]"
            />
          </Field>
          <Field label="Treatment date" className="flex-1">
            <input
              type="date"
              value={treatmentDate}
              onChange={(e) => setTreatmentDate(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-[14px]"
            />
          </Field>
        </div>

        <div className="mt-5 text-[11px] italic text-[color:var(--color-faint)]">
          → Creates in OAR phase (unassigned). Assign an MO later from the board.
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-[color:var(--color-red)] bg-[color:var(--color-red-bg)] px-3 py-2 text-[12px] text-[color:var(--color-red)]">
            {error}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl gap-2">
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-[2] justify-center"
            onClick={onSubmit}
            disabled={!canSubmit || pending}
          >
            {pending ? "Creating…" : "Create case"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 ${className ?? ""}`}>
      <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      {children}
      {hint && (
        <div className="mt-1 text-[11px] text-[color:var(--color-faint)]">{hint}</div>
      )}
    </div>
  );
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
