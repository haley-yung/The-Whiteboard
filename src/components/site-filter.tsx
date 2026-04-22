"use client";

import { SITE_SHORT, SITES } from "@/lib/types";
import type { Site } from "@/lib/types";
import { Pill } from "./primitives";

export function SiteFilter({
  selected,
  available,
  onToggle,
}: {
  selected: Site[] | "all";
  available?: Site[]; // limit to subset (e.g. MO's linked sites)
  onToggle: (next: Site[] | "all") => void;
}) {
  const options = available ?? [...SITES];
  const isAll = selected === "all";
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1">
      <Pill active={isAll} onClick={() => onToggle("all")}>
        All
      </Pill>
      {options.map((s) => {
        const isSelected = !isAll && (selected as Site[]).includes(s);
        return (
          <Pill
            key={s}
            active={isSelected}
            onClick={() => {
              if (isAll) {
                onToggle([s]);
              } else {
                const cur = selected as Site[];
                const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
                onToggle(next.length === 0 ? "all" : next);
              }
            }}
          >
            {SITE_SHORT[s]}
          </Pill>
        );
      })}
    </div>
  );
}
