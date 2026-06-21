import { useEffect, useState } from "react";
import { BossHud, TopHud } from "./TopHud.tsx";
import { MercBar } from "./MercBar.tsx";
import { SynergyPanel } from "./SynergyPanel.tsx";
import { MobileControls } from "./MobileControls.tsx";
import { MobileHud } from "./MobileHud.tsx";
import { GameStage } from "./GameStage.tsx";
import { PauseOverlay, ResultOverlay } from "./GameModals.tsx";
import { useMobileHud } from "./useMobileHud.ts";
import {
  GAME_HUD_EVENT,
  GAME_PAUSE_EVENT,
  GAME_RESULT_EVENT,
} from "./hudEvents.ts";
import type { GameHudSnapshot, HudResult } from "./hudTypes.ts";

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-bone-white/30 bg-black/45 px-1 font-pixel-en text-[9px] leading-none text-bone-white/90 shadow-[inset_0_-2px_0_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.6)]">
      {children}
    </kbd>
  );
}

function ControlsHint() {
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[11px] text-bone-white/70">
      <Key>W</Key>
      <Key>A</Key>
      <Key>S</Key>
      <Key>D</Key>
      <span className="text-ash-grey/70">/</span>
      <Key>↑</Key>
      <Key>↓</Key>
      <Key>←</Key>
      <Key>→</Key>
      <span className="ml-1 mr-2">이동</span>
      <Key>ESC</Key>
      <span className="ml-1">일시정지</span>
    </div>
  );
}

export function GameOverlay() {
  const [snapshot, setSnapshot] = useState<GameHudSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<HudResult | null>(null);
  const isMobileHud = useMobileHud();

  useEffect(() => {
    const onHud = (event: WindowEventMap[typeof GAME_HUD_EVENT]) => setSnapshot(event.detail);
    const onPause = (event: WindowEventMap[typeof GAME_PAUSE_EVENT]) => setPaused(event.detail);
    const onResult = (event: WindowEventMap[typeof GAME_RESULT_EVENT]) => setResult(event.detail);

    window.addEventListener(GAME_HUD_EVENT, onHud);
    window.addEventListener(GAME_PAUSE_EVENT, onPause);
    window.addEventListener(GAME_RESULT_EVENT, onResult);
    return () => {
      window.removeEventListener(GAME_HUD_EVENT, onHud);
      window.removeEventListener(GAME_PAUSE_EVENT, onPause);
      window.removeEventListener(GAME_RESULT_EVENT, onResult);
    };
  }, []);

  if (!snapshot) return null;

  return (
    <>
      <GameStage>
        {isMobileHud ? (
          <>
            <MobileHud snapshot={snapshot} />
            <MobileControls />
          </>
        ) : (
          <>
            <TopHud snapshot={snapshot} />
            <BossHud boss={snapshot.boss} />
            <SynergyPanel rows={snapshot.synergies} />
            <MercBar party={snapshot.party} />
          </>
        )}
        {!isMobileHud && <ControlsHint />}
      </GameStage>
      {(paused || result) && (
        <div className="pointer-events-none fixed inset-0 z-50 font-pixel-ko text-bone-white">
          {paused && !result && <PauseOverlay />}
          {result && <ResultOverlay result={result} />}
        </div>
      )}
    </>
  );
}
