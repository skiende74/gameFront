import { useEffect, useState } from "react";
import { DEV_MODE } from "../game/config";

type Props = {
  initialWaveSec: number;
};

function clampWaveSec(value: number): number {
  if (!Number.isFinite(value)) return DEV_MODE.defaultWaveSec;
  return Math.min(DEV_MODE.maxWaveSec, Math.max(DEV_MODE.minWaveSec, value));
}

export function DevModePanel({ initialWaveSec }: Props) {
  const [waveSec, setWaveSec] = useState(() => clampWaveSec(initialWaveSec));

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("game:dev-wave-sec-change", { detail: { waveSec } }),
    );
  }, [waveSec]);

  const updateWaveSec = (next: number) => {
    setWaveSec(clampWaveSec(next));
  };

  return (
    <div
      className="fixed bottom-4 right-4 w-56 border-2 border-torch-core/70 bg-dungeon-deepest/90 p-3 font-pixel-ko text-bone-white shadow-[0_0_24px_rgba(255,122,58,0.35)]"
      style={{ zIndex: 60 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel-en text-[10px] tracking-[0.2em] text-torch-core">DEV</span>
        <span className="font-pixel-en text-[10px] text-ash-grey">{waveSec}s</span>
      </div>
      <label className="mb-2 block text-[11px] text-ash-grey" htmlFor="dev-wave-sec">
        웨이브 길이
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-8 w-8 border border-bone-white/25 bg-dungeon-stone text-sm text-bone-white hover:border-torch-core"
          onClick={() => updateWaveSec(waveSec - 1)}
          aria-label="웨이브 길이 줄이기"
        >
          -
        </button>
        <input
          id="dev-wave-sec"
          type="number"
          min={DEV_MODE.minWaveSec}
          max={DEV_MODE.maxWaveSec}
          value={waveSec}
          onChange={(event) => updateWaveSec(Number(event.target.value))}
          className="h-8 min-w-0 flex-1 border border-bone-white/25 bg-black/40 px-2 text-center font-pixel-en text-xs text-bone-white outline-none focus:border-torch-core"
        />
        <button
          type="button"
          className="h-8 w-8 border border-bone-white/25 bg-dungeon-stone text-sm text-bone-white hover:border-torch-core"
          onClick={() => updateWaveSec(waveSec + 1)}
          aria-label="웨이브 길이 늘리기"
        >
          +
        </button>
      </div>
    </div>
  );
}
