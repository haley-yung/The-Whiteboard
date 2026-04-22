"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/user-context";
import type { Role, User } from "@/lib/types";

const roleOrder: Role[] = ["RT", "MO", "Big MO"];

export function UserSwitcher({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { users, currentUser, setCurrentUserId } = useUser();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const grouped: Record<Role, User[]> = { RT: [], MO: [], "Big MO": [] };
  for (const u of users) grouped[u.role].push(u);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Current user: ${currentUser.name}. Switch user`}
      >
        {children}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-[color:var(--color-ink)] bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
        >
          <div className="px-2 py-1.5 font-serif text-sm font-semibold">Switch user</div>
          {roleOrder.map((role) => (
            <div key={role} className="mb-1">
              <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-faint)]">
                {role}
              </div>
              {grouped[role].map((u) => {
                const active = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    role="menuitem"
                    onClick={() => {
                      setCurrentUserId(u.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-[color:var(--color-gray-bg)] ${
                      active ? "bg-[color:var(--color-gray-bg)]" : ""
                    }`}
                  >
                    <span className="truncate font-medium">{u.name}</span>
                    {active && (
                      <span className="text-[10px] text-[color:var(--color-muted)]">current</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
