import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { MERCS } from "./mercenaries";
import { playConfirm, playHover } from "../audio/sfx";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (classId: string) => void;
};

export function CharacterSelectModal({ open, onClose, onSelect }: Props) {
  const [index, setIndex] = useState(0);

  const confirm = useCallback(
    (i: number) => {
      playConfirm();
      onSelect(MERCS[i].id);
    },
    [onSelect],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") {
        e.preventDefault();
        onClose();
      } else if (k === "ArrowRight" || k === "d" || k === "D") {
        e.preventDefault();
        setIndex((i) => (i + 1) % MERCS.length);
        playHover();
      } else if (k === "ArrowLeft" || k === "a" || k === "A") {
        e.preventDefault();
        setIndex((i) => (i - 1 + MERCS.length) % MERCS.length);
        playHover();
      } else if (k === "Enter" || k === " ") {
        e.preventDefault();
        confirm(index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, onClose, confirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="용병 선택"
    >
      <div
        className="relative w-full max-w-3xl bg-dungeon-stone border-4 border-bone-white/30 shadow-[0_0_40px_rgba(255,122,58,0.35)] p-6 font-pixel-ko"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1 pb-3 border-b-2 border-bone-white/20">
          <h2 className="text-xl text-torch-core m-0">용병 선택</h2>
          <button
            type="button"
            className="text-bone-white/60 hover:text-torch-flame transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <p className="text-[11px] md:text-xs text-ash-grey mb-4">함께 시작할 용병을 선택하세요.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MERCS.map((m, i) => {
            const selected = i === index;
            return (
              <button
                key={m.id}
                type="button"
                onMouseEnter={() => {
                  if (i !== index) {
                    setIndex(i);
                    playHover();
                  }
                }}
                onClick={() => confirm(i)}
                aria-current={selected ? "true" : undefined}
                className="group relative flex flex-col items-center gap-2 p-3 transition-transform"
                style={{
                  border: `2px solid ${selected ? m.glow : "rgba(236,226,200,0.15)"}`,
                  background: selected
                    ? "linear-gradient(to bottom, rgba(40,28,48,0.9), rgba(20,12,28,0.9))"
                    : "rgba(10,6,16,0.5)",
                  boxShadow: selected ? `0 0 20px ${m.glow}55, inset 0 0 16px ${m.glow}22` : "none",
                  transform: selected ? "translateY(-3px)" : "none",
                }}
              >
                <div className="relative w-32 h-32 flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 50% 72%, ${m.glow}${selected ? "55" : "33"} 0%, transparent 60%)`,
                      filter: "blur(8px)",
                    }}
                  />
                  <div
                    className="merc-sprite relative w-full h-full"
                    style={
                      {
                        "--merc-sprite": `url("${m.spriteUrl}")`,
                        filter: `drop-shadow(0 0 6px ${m.glow}aa)`,
                        transform: `translateY(${m.feetAdjust}) scale(1.6)`,
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                </div>

                <div className="text-base font-bold" style={{ color: m.glow }}>
                  {m.label}
                </div>
                <div className="text-[10px] text-ash-grey text-center min-h-[14px]">{m.role}</div>

                <div className="w-full space-y-0.5 pt-2 mt-1 border-t border-bone-white/10">
                  {m.stats.map((s) => (
                    <div key={s.k} className="flex justify-between text-[10px] gap-2">
                      <span className="text-bone-white/55">{s.k}</span>
                      <span className="text-bone-white/90 font-pixel-en text-[9px]">{s.v}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-[9px] md:text-[10px] text-ash-grey/55 font-pixel-en tracking-[0.15em]">
            [◀▶ / AD] 선택 · [ENTER] 시작 · [ESC] 닫기
          </div>
          <button
            type="button"
            className="pixel-btn pixel-btn-primary py-2! px-6! text-base!"
            onClick={() => confirm(index)}
          >
            {MERCS[index].label}(으)로 시작
          </button>
        </div>
      </div>
    </div>
  );
}
