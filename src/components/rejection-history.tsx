"use client";

import { useEffect, useState } from "react";
import type { Rejection, User } from "@/lib/types";
import { Sheet } from "./sheet";
import { createBrowserSupabase } from "@/lib/supabase";

export function RejectionHistorySheet({
  caseId,
  users,
  onClose,
}: {
  caseId: string;
  users: Map<string, User>;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<Rejection[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = createBrowserSupabase();
    sb.from("rejections")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setHistory([]);
        else setHistory((data ?? []) as Rejection[]);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return (
    <Sheet onClose={onClose} title="Rejection history">
      <div className="flex flex-col gap-3 px-4 pb-4">
        {history === null && (
          <div className="text-[12px] italic text-[color:var(--color-muted)]">Loading…</div>
        )}
        {history && history.length === 0 && (
          <div className="text-[12px] italic text-[color:var(--color-muted)]">
            No rejections recorded.
          </div>
        )}
        {history?.map((r) => {
          const by = users.get(r.rejected_by)?.name ?? "—";
          const when = new Date(r.created_at).toLocaleString();
          return (
            <div
              key={r.id}
              className="rounded-lg border border-[color:var(--color-line)] bg-white p-3"
            >
              <div className="text-[11px] text-[color:var(--color-muted)]">
                {by} · {when}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.reasons.map((reason, i) => (
                  <span
                    key={i}
                    className="rounded bg-[color:var(--color-red-bg)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-red)]"
                  >
                    {reason}
                  </span>
                ))}
              </div>
              {r.note && (
                <div className="mt-2 text-[12px] italic text-[color:var(--color-ink)]">
                  &ldquo;{r.note}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
