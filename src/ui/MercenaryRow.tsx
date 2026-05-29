import type { CSSProperties } from "react";

type Mercenary = {
  id: string;
  label: string;
  role: string;
  stats: Array<{ k: string; v: string }>;
  glow: string;
  bobDelay: string;
  spriteUrl: string;
  feetAdjust: string;
};

const ASSET_BASE = "/assets/Tiny RPG Character Asset Pack v1.03 -Full 20 Characters/Characters(100x100)";

const idleSprite = (folder: string, file: string) => encodeURI(`${ASSET_BASE}/${folder}/${folder}/${file}-Idle.png`);

const MERCS: Mercenary[] = [
  {
    id: "sword",
    label: "검사",
    role: "근접 범위 공격",
    stats: [
      { k: "ATK", v: "15" },
      { k: "사거리", v: "60px" },
      { k: "쿨타임", v: "0.8s" },
    ],
    glow: "var(--color-class-sword)",
    bobDelay: "0s",
    spriteUrl: idleSprite("Swordsman", "Swordsman"),
    feetAdjust: "0%",
  },
  {
    id: "bow",
    label: "궁수",
    role: "원거리 투사체",
    stats: [
      { k: "ATK", v: "10" },
      { k: "사거리", v: "280px" },
      { k: "쿨타임", v: "1.0s" },
    ],
    glow: "var(--color-class-bow)",
    bobDelay: "0.25s",
    spriteUrl: idleSprite("Archer", "Archer"),
    feetAdjust: "3%",
  },
  {
    id: "mage",
    label: "마법사",
    role: "광역 폭발",
    stats: [
      { k: "ATK", v: "25" },
      { k: "폭발반경", v: "80px" },
      { k: "쿨타임", v: "2.0s" },
    ],
    glow: "var(--color-class-mage)",
    bobDelay: "0.5s",
    spriteUrl: idleSprite("Wizard", "Wizard"),
    feetAdjust: "2%",
  },
  {
    id: "cleric",
    label: "성직자",
    role: "아군 전체 회복",
    stats: [
      { k: "회복", v: "+5 HP" },
      { k: "대상", v: "팀 전체" },
      { k: "주기", v: "5.0s" },
    ],
    glow: "var(--color-class-cleric)",
    bobDelay: "0.75s",
    spriteUrl: idleSprite("Priest", "Priest"),
    feetAdjust: "2%",
  },
];

export function MercenaryRow() {
  return (
    <div className="flex items-end justify-center gap-6 md:gap-10" aria-label="용병 4종 미리보기">
      {MERCS.map((m) => (
        <div
          key={m.id}
          className="merc-tooltip-host relative flex flex-col items-center gap-0 merc-bob cursor-help"
          style={{ animationDelay: m.bobDelay }}
          tabIndex={0}
          aria-label={`${m.label} — ${m.role}`}
        >
          <div className="merc-tooltip" role="tooltip">
            <div className="text-sm font-bold mb-1" style={{ color: m.glow }}>
              {m.label}
            </div>
            <div className="text-[10px] text-ash-grey mb-2">{m.role}</div>
            <div className="space-y-0.5">
              {m.stats.map((s) => (
                <div key={s.k} className="flex justify-between text-[11px] gap-3">
                  <span className="text-bone-white/65">{s.k}</span>
                  <span className="text-bone-white font-pixel-en text-[10px]">{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-[clamp(8rem,26vh,18rem)] h-[clamp(8rem,26vh,18rem)] flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 50% 72%, ${m.glow}66 0%, transparent 60%)`,
                filter: "blur(10px)",
              }}
            />
            <div
              className="merc-sprite relative w-full h-full"
              style={
                {
                  "--merc-sprite": `url("${m.spriteUrl}")`,
                  filter: `drop-shadow(0 0 6px ${m.glow}aa)`,
                  transform: `translateY(${m.feetAdjust})`,
                } as CSSProperties
              }
              aria-hidden="true"
            />
          </div>
          <span
            className="-mt-12 md:-mt-16 text-base md:text-xl font-pixel-ko text-bone-white/80 tracking-wide"
            style={{ textShadow: `0 0 6px ${m.glow}88` }}
          >
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
