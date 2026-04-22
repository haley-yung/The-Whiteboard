"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user-context";
import type { Role } from "@/lib/types";
import { UserSwitcher } from "./user-switcher";

const roleChipColors: Record<Role, { bg: string; fg: string; label: string }> = {
  RT: { bg: "var(--color-amber-bg)", fg: "var(--color-amber)", label: "RT" },
  MO: { bg: "var(--color-green-bg)", fg: "var(--color-green)", label: "MO" },
  "Big MO": { bg: "var(--color-red-bg)", fg: "var(--color-red)", label: "BM" },
};

export function TopBar() {
  const { currentUser } = useUser();
  const pathname = usePathname();
  const chip = roleChipColors[currentUser.role];
  const viewLabel =
    currentUser.role === "RT" ? "RT view" : currentUser.role === "MO" ? "MO view" : "Big MO";

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--color-paper)] border-b border-[color:var(--color-line)]">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--color-ink)]" />
          <span className="font-serif text-[17px] font-semibold tracking-tight">
            Whiteboard
          </span>
        </Link>
        <nav className="ml-2 flex gap-1 text-[11px] text-[color:var(--color-muted)]">
          <Link
            href="/"
            className={`rounded-full px-2 py-1 hover:bg-[color:var(--color-gray-bg)] ${pathname === "/" ? "bg-[color:var(--color-gray-bg)] text-[color:var(--color-ink)]" : ""}`}
          >
            Board
          </Link>
          <Link
            href="/archive"
            className={`rounded-full px-2 py-1 hover:bg-[color:var(--color-gray-bg)] ${pathname.startsWith("/archive") ? "bg-[color:var(--color-gray-bg)] text-[color:var(--color-ink)]" : ""}`}
          >
            Archive
          </Link>
        </nav>
        <div className="flex-1" />
        <span className="hidden text-[11px] text-[color:var(--color-muted)] sm:inline">
          {viewLabel}
        </span>
        <UserSwitcher>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              background: chip.bg,
              color: chip.fg,
              border: `1px solid ${chip.fg}60`,
            }}
            title={currentUser.name}
          >
            {chip.label}
          </span>
        </UserSwitcher>
      </div>
    </header>
  );
}
