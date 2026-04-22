"use client";

import { useEffect } from "react";

export function Sheet({
  onClose,
  title,
  subtitle,
  children,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-t-[20px] bg-[color:var(--color-paper)] shadow-[0_-4px_20px_rgba(0,0,0,0.18)] sm:rounded-[20px]"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[color:var(--color-faint)] sm:hidden" />
        <div className="px-4 pb-3 pt-4">
          <div className="font-serif text-[18px] font-semibold tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 text-[12px] text-[color:var(--color-muted)]">
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
