"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Case, User } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { Icon } from "./primitives";

function stripParens(name: string | undefined): string {
  if (!name) return "—";
  return name.replace(/\s*\(.*\)/, "");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function ArchiveList({ cases, users }: { cases: Case[]; users: User[] }) {
  const { currentUser } = useUser();
  const [search, setSearch] = useState("");
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const scoped = useMemo(() => {
    if (currentUser.role === "RT") return cases;
    if (currentUser.role === "MO") return cases.filter((c) => c.assigned_mo_id === currentUser.id);
    return cases.filter((c) => currentUser.sites.includes(c.treatment_site));
  }, [cases, currentUser]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (c) =>
        c.patient_identifier.toLowerCase().includes(q) ||
        c.patient_initials.toLowerCase().includes(q),
    );
  }, [scoped, search]);

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <div className="sticky top-[57px] z-10 flex items-center gap-3 border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-3">
        <Link href="/" aria-label="Back">
          <Icon name="back" size={18} />
        </Link>
        <div className="font-serif text-[18px] font-semibold tracking-tight">Archive</div>
        <div className="flex-1" />
        <div className="text-[11px] text-[color:var(--color-faint)]">
          {filtered.length} case{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-line)] bg-white px-3.5 py-2">
          <Icon name="search" size={14} className="text-[color:var(--color-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search identifier or initials…"
            className="w-full border-none bg-transparent text-[13px] outline-none placeholder:italic placeholder:text-[color:var(--color-faint)]"
          />
        </div>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="mt-12 text-center text-[13px] text-[color:var(--color-muted)]">
            No archived cases.
          </div>
        ) : (
          filtered.map((c) => {
            const mo = c.assigned_mo_id ? userMap.get(c.assigned_mo_id) : null;
            const approver = c.approved_by ? userMap.get(c.approved_by) : null;
            return (
              <div
                key={c.id}
                className="mb-2.5 rounded-[10px] border border-[color:var(--color-line)] bg-white px-3.5 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-serif text-[15px] font-semibold">
                      {c.patient_initials}
                    </div>
                    <div className="truncate text-[11px] text-[color:var(--color-muted)]">
                      {c.patient_identifier} · {c.treatment_site}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-[color:var(--color-green-bg)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-green)]">
                    <Icon name="check" size={10} /> Approved
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[color:var(--color-faint)]">
                  <span>
                    MO:{" "}
                    <span className="text-[color:var(--color-muted)]">
                      {stripParens(mo?.name)}
                    </span>
                  </span>
                  <span>
                    Approved by:{" "}
                    <span className="text-[color:var(--color-muted)]">
                      {stripParens(approver?.name)}
                    </span>
                  </span>
                  <span>{formatDate(c.approved_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
