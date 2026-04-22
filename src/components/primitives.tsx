"use client";

import { clsx } from "clsx";
import {
  formatDateShort,
  urgencyColors,
  urgencyLabel,
  urgencyTier,
} from "@/lib/urgency";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

// ── Pill / chip ─────────────────────────────────────────────────────────────
export function Pill({
  active = false,
  children,
  onClick,
  as = "button",
  className,
  variant = "default",
  disabled,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "span";
  className?: string;
  variant?: "default" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "inline-flex min-h-[30px] items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium leading-none whitespace-nowrap transition-colors disabled:opacity-50";
  const styles =
    variant === "ghost"
      ? "border-[color:var(--color-line)] bg-transparent text-[color:var(--color-muted)]"
      : active
        ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
        : "border-[color:var(--color-ink)] bg-white text-[color:var(--color-ink)] hover:bg-[color:var(--color-gray-bg)]";
  if (as === "span") {
    return <span className={clsx(base, styles, className)}>{children}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, styles, className)}
    >
      {children}
    </button>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-5 py-3 text-[14px]",
  }[size];
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-[color:var(--color-ink)] text-white border-[color:var(--color-ink)] hover:opacity-90",
    secondary:
      "bg-white text-[color:var(--color-ink)] border-[color:var(--color-ink)] hover:bg-[color:var(--color-gray-bg)]",
    ghost:
      "bg-transparent text-[color:var(--color-ink)] border-[color:var(--color-line)] hover:bg-[color:var(--color-gray-bg)]",
    danger:
      "bg-[color:var(--color-red)] text-white border-[color:var(--color-red)] hover:opacity-90",
    success:
      "bg-[color:var(--color-green)] text-white border-[color:var(--color-green)] hover:opacity-90",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold leading-tight transition-opacity disabled:opacity-50",
        sizes,
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  highlight,
  onClick,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { highlight?: "red" | "amber" | null }) {
  const borderColor =
    highlight === "red"
      ? "border-[color:var(--color-red)]"
      : highlight === "amber"
        ? "border-[color:var(--color-amber)]"
        : "border-[color:var(--color-line)]";
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-[10px] border bg-white p-3",
        borderColor,
        onClick && "cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── UrgencyBadge ────────────────────────────────────────────────────────────
export function UrgencyBadge({
  targetDate,
  size = "md",
}: {
  targetDate: string;
  size?: "sm" | "md";
}) {
  const days = daysUntilSafe(targetDate);
  const tier = urgencyTier(days);
  const { fg, bg } = urgencyColors(tier);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold leading-none",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
      style={{ background: bg, color: fg, border: `1px solid ${fg}40` }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: fg }}
      />
      {urgencyLabel(days)}
    </span>
  );
}

// client-safe (runs in browser) — no import cycle with server code
function daysUntilSafe(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - t0.getTime()) / 86400000);
}

// ── Section header (phase/group label) ──────────────────────────────────────
export function SectionHeader({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between border-b border-[color:var(--color-line)] px-0.5 pb-2 pt-3.5">
      <div
        className="font-serif text-[16px] font-semibold tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {label}
      </div>
      <div className="text-[11px] text-[color:var(--color-faint)]">
        {count} case{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────
export function Icon({
  name,
  size = 16,
  className,
}: {
  name: "plus" | "check" | "x" | "search" | "chevron" | "chevronDown" | "back" | "filter" | "calendar" | "alert" | "archive";
  size?: number;
  className?: string;
}) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = size;
  const paths: Record<string, React.ReactNode> = {
    plus: (
      <g {...p}>
        <line x1={s * 0.5} y1={s * 0.2} x2={s * 0.5} y2={s * 0.8} />
        <line x1={s * 0.2} y1={s * 0.5} x2={s * 0.8} y2={s * 0.5} />
      </g>
    ),
    check: (
      <polyline {...p} points={`${s * 0.2},${s * 0.55} ${s * 0.42},${s * 0.73} ${s * 0.8},${s * 0.3}`} />
    ),
    x: (
      <g {...p}>
        <line x1={s * 0.25} y1={s * 0.25} x2={s * 0.75} y2={s * 0.75} />
        <line x1={s * 0.75} y1={s * 0.25} x2={s * 0.25} y2={s * 0.75} />
      </g>
    ),
    search: (
      <g {...p}>
        <circle cx={s * 0.45} cy={s * 0.45} r={s * 0.25} />
        <line x1={s * 0.63} y1={s * 0.63} x2={s * 0.82} y2={s * 0.82} />
      </g>
    ),
    chevron: <polyline {...p} points={`${s * 0.38},${s * 0.25} ${s * 0.65},${s * 0.5} ${s * 0.38},${s * 0.75}`} />,
    chevronDown: <polyline {...p} points={`${s * 0.25},${s * 0.4} ${s * 0.5},${s * 0.65} ${s * 0.75},${s * 0.4}`} />,
    back: <polyline {...p} points={`${s * 0.6},${s * 0.2} ${s * 0.3},${s * 0.5} ${s * 0.6},${s * 0.8}`} />,
    filter: (
      <g {...p}>
        <line x1={s * 0.2} y1={s * 0.3} x2={s * 0.8} y2={s * 0.3} />
        <line x1={s * 0.3} y1={s * 0.55} x2={s * 0.7} y2={s * 0.55} />
        <line x1={s * 0.42} y1={s * 0.8} x2={s * 0.58} y2={s * 0.8} />
      </g>
    ),
    calendar: (
      <g {...p}>
        <rect x={s * 0.2} y={s * 0.28} width={s * 0.6} height={s * 0.52} rx={s * 0.05} />
        <line x1={s * 0.2} y1={s * 0.42} x2={s * 0.8} y2={s * 0.42} />
        <line x1={s * 0.35} y1={s * 0.2} x2={s * 0.35} y2={s * 0.35} />
        <line x1={s * 0.65} y1={s * 0.2} x2={s * 0.65} y2={s * 0.35} />
      </g>
    ),
    alert: (
      <g {...p}>
        <path d={`M${s * 0.5},${s * 0.18} L${s * 0.85},${s * 0.78} L${s * 0.15},${s * 0.78} Z`} />
        <line x1={s * 0.5} y1={s * 0.42} x2={s * 0.5} y2={s * 0.58} />
      </g>
    ),
    archive: (
      <g {...p}>
        <rect x={s * 0.2} y={s * 0.25} width={s * 0.6} height={s * 0.18} />
        <rect x={s * 0.24} y={s * 0.43} width={s * 0.52} height={s * 0.34} />
        <line x1={s * 0.42} y1={s * 0.58} x2={s * 0.58} y2={s * 0.58} />
      </g>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={clsx("inline-block align-middle", className)}
    >
      {paths[name]}
    </svg>
  );
}

// Helper to format target date for display under a label
export { formatDateShort };
