import { useEffect, useState } from "react";
import { BossHud, TopHud } from "./TopHud.tsx";
import { MercBar } from "./MercBar.tsx";
import { SynergyPanel } from "./SynergyPanel.tsx";
import { GameStage } from "./GameStage.tsx";
import { PauseOverlay, ResultOverlay } from "./GameModals.tsx";
import {
  GAME_HUD_EVENT,
  GAME_PAUSE_EVENT,
  GAME_RESULT_EVENT,
} from "./hudEvents.ts";
import type { GameHudSnapshot, HudResult } from "./hudTypes.ts";

export function GameOverlay() {
  const [snapshot, setSnapshot] = useState<GameHudSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<HudResult | null>(null);

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
        <TopHud snapshot={snapshot} />
        <BossHud boss={snapshot.boss} />
        <SynergyPanel rows={snapshot.synergies} />
        <MercBar party={snapshot.party} />
        <div className="absolute bottom-4 left-4 text-[12px] leading-relaxed text-bone-white/70">
          WASD / 방향키 이동 · ESC 일시정지
        </div>
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
