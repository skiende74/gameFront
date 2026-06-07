import type { ReactNode } from "react";
import type { GameHudSnapshot } from "./hudTypes.ts";
import { PixelIcon } from "./HudIcons.tsx";

type Props = {
  snapshot: GameHudSnapshot;
};

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[6px] border-2 border-bone-white/45 bg-dungeon-deepest/90 shadow-[inset_1px_1px_0_rgba(236,226,200,0.1),0_0_0_2px_rgba(0,0,0,0.58),0_10px_28px_rgba(0,0,0,0.48)] ${className}`}
    >
      {children}
    </section>
  );
}

export function TopHud({ snapshot }: Props) {
  const danger = snapshot.hp.ratio < 0.3;
  const hpColor = danger ? "bg-blood-red" : snapshot.hp.ratio < 0.6 ? "bg-torch-core" : "bg-class-bow";

  return (
    <>
      <Panel
        className={`absolute left-4 top-4 h-14 w-[264px] border-blood-red/55 px-3 py-2 ${danger ? "hp-danger" : ""}`}
      >
        <div className="flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-1.5">
            <PixelIcon name="heart" className={`h-3 w-3 text-blood-red ${danger ? "heart-beat" : ""}`} />
            체력
          </span>
          <span className="font-pixel-en text-[10px] text-ash-grey">
            {Math.ceil(snapshot.hp.current)} / {snapshot.hp.max}
          </span>
        </div>
        <div className="mt-2 h-3.5 rounded-[4px] border border-black/60 bg-dungeon-mid shadow-[inset_0_2px_5px_rgba(0,0,0,0.55)]">
          <div
            className={`h-full rounded-[3px] ${hpColor} shadow-[0_0_10px_rgba(255,213,138,0.22)] transition-[width] duration-300 ease-out`}
            style={{ width: `${snapshot.hp.ratio * 100}%` }}
          />
        </div>
      </Panel>

      <Panel className="absolute left-4 top-[88px] flex h-10 w-[264px] items-center justify-between border-torch-core/45 px-3 text-[12px]">
        <span className="flex items-center gap-1">
          <PixelIcon name="sword" className="h-3 w-3 text-bone-white/80" />
          처치 {snapshot.stats.kills}
        </span>
        <span className="flex items-center gap-1 text-torch-core">
          <PixelIcon name="star" className="h-3 w-3" />
          {snapshot.stats.score}
        </span>
        <span className="flex items-center gap-1 text-coin-gold">
          <PixelIcon name="coin" className="h-3 w-3 drop-shadow-[0_0_5px_rgba(255,210,74,0.55)]" />
          {snapshot.stats.coins}
        </span>
      </Panel>

      <Panel className="absolute left-1/2 top-4 flex h-14 w-[156px] -translate-x-1/2 items-center justify-center border-torch-core/60 shadow-[inset_1px_1px_0_rgba(236,226,200,0.1),0_0_0_2px_rgba(0,0,0,0.58),0_0_24px_rgba(255,122,58,0.2)]">
        <span className="flex items-center gap-1.5 font-pixel-en text-sm text-torch-core drop-shadow-[0_0_8px_rgba(255,122,58,0.75)]">
          <PixelIcon name="clock" className="h-3.5 w-3.5" />
          {snapshot.time.label}
        </span>
      </Panel>

      <Panel className="absolute right-4 top-4 h-14 w-[156px] border-rune-cyan/55 px-3 py-2">
        <div className="flex items-start justify-between">
          <span className="flex items-center gap-1.5 text-[13px]">
            <PixelIcon name="wave" className="h-3 w-3 text-rune-cyan" />
            웨이브
          </span>
          <span className="font-pixel-en text-[10px] text-rune-cyan">{snapshot.wave.label}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-[3px] bg-dungeon-mid shadow-[inset_0_1px_4px_rgba(0,0,0,0.65)]">
          <div
            className="h-full rounded-[3px] bg-rune-cyan shadow-[0_0_10px_rgba(110,255,224,0.55)] transition-[width] duration-300 ease-out"
            style={{ width: `${snapshot.wave.progress * 100}%` }}
          />
        </div>
      </Panel>
    </>
  );
}

export function BossHud({ boss }: { boss: GameHudSnapshot["boss"] }) {
  if (!boss) return null;

  return (
    <section className="absolute left-1/2 top-[100px] w-[560px] -translate-x-1/2 rounded-[6px] border-2 border-blood-red/80 bg-dungeon-deepest/90 px-3 py-2 text-center shadow-[inset_1px_1px_0_rgba(236,226,200,0.08),0_0_0_2px_rgba(0,0,0,0.58),0_0_24px_rgba(196,30,30,0.35)]">
      <div className="mb-1 text-sm text-[#ff7a6b]">{boss.name}</div>
      <div className="h-4 rounded-[4px] bg-dungeon-mid shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]">
        <div className="h-full rounded-[3px] bg-blood-red shadow-[0_0_14px_rgba(196,30,30,0.65)] transition-[width] duration-300 ease-out" style={{ width: `${boss.ratio * 100}%` }} />
      </div>
    </section>
  );
}
