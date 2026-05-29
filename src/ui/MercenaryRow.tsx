import type { CSSProperties } from "react";
import { MERCS } from "./mercenaries";

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
