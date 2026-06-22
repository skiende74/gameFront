import { useState } from "react";
import type { GameHudSnapshot, HudPartyUnit } from "./hudTypes.ts";
import { PixelIcon } from "./HudIcons.tsx";

type Props = {
  snapshot: GameHudSnapshot;
};

function Stat({ icon, value, className = "" }: { icon: "sword" | "star" | "coin"; value: number; className?: string }) {
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <PixelIcon name={icon} className="h-3 w-3" />
      {value}
    </span>
  );
}

export function MobileTopHud({ snapshot }: Props) {
  const danger = snapshot.hp.ratio < 0.3;
  const hpColor = danger ? "bg-blood-red" : snapshot.hp.ratio < 0.6 ? "bg-torch-core" : "bg-class-bow";

  return (
    <section className={`absolute left-2 right-2 top-[calc(env(safe-area-inset-top)+8px)] rounded-[6px] border-2 border-bone-white/35 bg-dungeon-deepest/88 px-2 py-1.5 shadow-[0_0_0_2px_rgba(0,0,0,0.58),0_8px_24px_rgba(0,0,0,0.45)] ${danger ? "hp-danger" : ""}`}>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <PixelIcon name="heart" className={`h-3 w-3 text-blood-red ${danger ? "heart-beat" : ""}`} />
          <span className="h-3 flex-1 rounded-[3px] border border-black/60 bg-dungeon-mid">
            <span className={`block h-full rounded-[2px] ${hpColor}`} style={{ width: `${snapshot.hp.ratio * 100}%` }} />
          </span>
          <span className="font-pixel-en text-[8px] text-ash-grey">{Math.ceil(snapshot.hp.current)}</span>
        </span>
        <span className="font-pixel-en text-[10px] text-torch-core">{snapshot.time.label}</span>
        <span className="font-pixel-en text-[9px] text-rune-cyan">{snapshot.wave.label}</span>
      </div>
      <div className="mt-1 flex items-center justify-end gap-3 font-pixel-en text-[8px] text-bone-white/82">
        <Stat icon="sword" value={snapshot.stats.kills} />
        <Stat icon="star" value={snapshot.stats.score} className="text-torch-core" />
        <Stat icon="coin" value={snapshot.stats.coins} className="text-coin-gold" />
      </div>
    </section>
  );
}

export function MobileBossHud({ boss }: { boss: GameHudSnapshot["boss"] }) {
  if (!boss) return null;

  return (
    <section className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+68px)] rounded-[6px] border-2 border-blood-red/75 bg-dungeon-deepest/88 px-2 py-1.5 text-center shadow-[0_0_0_2px_rgba(0,0,0,0.58),0_0_22px_rgba(196,30,30,0.28)]">
      <div className="mb-1 truncate text-[11px] text-[#ff7a6b]">{boss.name}</div>
      <div className="h-2.5 rounded-[3px] bg-dungeon-mid">
        <div className="h-full rounded-[2px] bg-blood-red" style={{ width: `${boss.ratio * 100}%` }} />
      </div>
    </section>
  );
}

function MobileMercSlot({ unit }: { unit: HudPartyUnit }) {
  return (
    <div className="relative flex h-12 w-10 shrink-0 items-end justify-center" aria-label={`${unit.label} ${unit.badge}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[5px] border-2 bg-dungeon-deepest/88" style={{ borderColor: unit.color }}>
        <div
          className="merc-sprite pointer-events-none h-[64px] w-[64px]"
          style={{ "--merc-sprite": `url("${unit.spriteUrl}")`, filter: `drop-shadow(0 0 5px ${unit.color})`, transform: "scale(2.15)" } as React.CSSProperties}
        />
        {unit.rank > 1 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 border px-1 text-center font-pixel-en text-[8px] leading-4 text-dungeon-deepest" style={{ borderColor: unit.color, backgroundColor: unit.color }}>
            {unit.badge}
          </span>
        )}
      </div>
    </div>
  );
}

export function MobileMercBar({ party }: { party: GameHudSnapshot["party"] }) {
  if (party.length === 0) return null;

  return (
    <nav className="touch-scroll pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 flex max-w-[calc(100vw-164px)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-[6px] border border-bone-white/10 bg-black/24 px-1.5 py-1 shadow-[0_0_20px_rgba(0,0,0,0.38)]" aria-label="모바일 용병 HUD">
      {party.map((unit) => (
        <MobileMercSlot key={unit.uid} unit={unit} />
      ))}
    </nav>
  );
}

export function MobileSynergyPanel({ rows }: { rows: GameHudSnapshot["synergies"] }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="pointer-events-auto absolute right-2 top-[calc(env(safe-area-inset-top)+76px)] rounded-[5px] border border-rune-violet/55 bg-dungeon-deepest/82 px-2 py-1.5 text-[11px] text-rune-violet shadow-[0_0_0_2px_rgba(0,0,0,0.48)]">
        시너지 {rows.filter((row) => row.active).length}/{rows.length}
      </button>
      {open && (
        <aside className="touch-scroll pointer-events-auto absolute bottom-0 left-0 right-0 max-h-[48vh] overflow-y-auto rounded-t-[6px] border-t-2 border-rune-violet/65 bg-dungeon-deepest/96 p-2 shadow-[0_-12px_32px_rgba(0,0,0,0.65)]">
          {rows.map((row) => (
            <div key={row.key} className={`mb-1 rounded-[4px] border px-2 py-1.5 ${row.active ? "border-torch-core/50 text-torch-core" : "border-bone-white/12 text-bone-white/72"}`}>
              <div className="flex items-center justify-between text-[12px]">
                <span>{row.name}</span>
                <span className="font-pixel-en text-[9px]">{row.progressLabel}</span>
              </div>
              <div className="mt-0.5 truncate text-[10px] text-ash-grey">{row.active ? "발동" : row.missingLabels.join(", ")}</div>
            </div>
          ))}
        </aside>
      )}
    </>
  );
}

export function MobileHud({ snapshot }: Props) {
  return (
    <>
      <MobileTopHud snapshot={snapshot} />
      <MobileBossHud boss={snapshot.boss} />
      <MobileSynergyPanel rows={snapshot.synergies} />
      <MobileMercBar party={snapshot.party} />
    </>
  );
}
