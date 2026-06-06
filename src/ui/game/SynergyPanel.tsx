import type { GameHudSnapshot, HudSynergyRow } from "./hudTypes.ts";

type Props = {
  rows: GameHudSnapshot["synergies"];
};

function SynergyTooltip({ row }: { row: HudSynergyRow }) {
  return (
    <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1 z-20 w-64 translate-x-1 rounded-[6px] border-2 border-rune-violet/80 bg-dungeon-deepest/95 px-3 py-2 text-left opacity-0 shadow-[inset_1px_1px_0_rgba(236,226,200,0.12),0_0_0_2px_rgba(0,0,0,0.65),0_10px_28px_rgba(0,0,0,0.75)] transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
      <span className="absolute -left-2 top-4 h-3 w-3 rotate-45 border-b-2 border-l-2 border-rune-violet/80 bg-dungeon-deepest" />
      {row.tooltip.map((line, index) => (
        <div
          key={`${row.key}-${line}`}
          className={index === 0 ? "mb-1 text-sm text-torch-core" : "text-[12px] leading-relaxed text-bone-white/80"}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function SynergyRow({ row }: { row: HudSynergyRow }) {
  const stateClass = row.active
    ? "border-torch-core/45 bg-torch-core/10 shadow-[inset_0_0_0_1px_rgba(255,213,138,0.16)]"
    : "border-bone-white/10 bg-black/20";

  return (
    <button
      type="button"
      className={`group relative grid h-[46px] w-full grid-cols-[34px_1fr_42px] items-center gap-2 rounded-[4px] border px-2 text-left outline-none transition hover:border-rune-violet/60 hover:bg-rune-violet/12 focus-visible:border-torch-core ${stateClass}`}
      aria-label={`${row.name} ${row.progressLabel}`}
    >
      <div className="flex flex-wrap gap-1">
        {row.classes.map((entry) => (
          <span
            key={`${row.key}-${entry.id}`}
            className="h-2.5 w-2.5 rotate-45 border border-black/60 shadow-[0_0_6px_rgba(255,255,255,0.16)]"
            style={{ backgroundColor: entry.color, opacity: entry.present ? 1 : 0.22 }}
          />
        ))}
      </div>
      <div className="min-w-0">
        <div className={row.active ? "truncate text-sm text-torch-core" : "truncate text-sm text-bone-white/70"}>
          {row.name}
        </div>
        <div className={row.active ? "text-[10px] text-bone-white/65" : "truncate text-[10px] text-ash-grey/75"}>
          {row.active ? "발동" : row.missingLabels.join(", ")}
        </div>
      </div>
      <span className={row.active ? "rounded-[4px] border border-torch-core/60 px-1.5 py-1 text-center font-pixel-en text-[9px] text-torch-core" : "rounded-[4px] border border-bone-white/15 px-1.5 py-1 text-center font-pixel-en text-[9px] text-ash-grey"}>
        {row.progressLabel}
      </span>
      <SynergyTooltip row={row} />
    </button>
  );
}

export function SynergyPanel({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <aside className="pointer-events-auto absolute left-4 top-[154px] w-[252px] rounded-[6px] border-2 border-rune-violet/55 bg-dungeon-deepest/90 p-1.5 shadow-[inset_1px_1px_0_rgba(236,226,200,0.1),0_0_0_2px_rgba(0,0,0,0.55),0_12px_34px_rgba(0,0,0,0.5),0_0_24px_rgba(196,122,255,0.16)]">
      <div className="mb-1 flex items-center justify-between rounded-[4px] border border-bone-white/10 bg-black/25 px-3 py-2">
        <span className="text-[13px] text-bone-white">시너지</span>
        <span className="font-pixel-en text-[9px] text-rune-violet">{rows.length}</span>
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <SynergyRow key={row.key} row={row} />
        ))}
      </div>
    </aside>
  );
}
