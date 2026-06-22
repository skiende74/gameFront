import { useCallback } from "react";
import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { DungeonScene } from "./scenes/DungeonScene";
import { GAME_WIDTH, GAME_HEIGHT, HEX } from "./config";

type Props = {
  classId?: string | null;
  tutorial?: boolean;
  devMode?: boolean;
  devWaveSec?: number;
};

export function PhaserGame({ classId, tutorial = false, devMode = false, devWaveSec }: Props) {
  const mountGame = useCallback(
    (parent: HTMLDivElement | null) => {
      if (!parent) return;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: HEX.bg,
        scale: {
          // RESIZE: 캔버스를 항상 부모(=전체 화면) 크기에 맞춰 여백 없이 채운다.
          // 모니터 비율이 무엇이든 그 비율 그대로 렌더링된다.
          mode: Phaser.Scale.RESIZE,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        },
        pixelArt: true,
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [PreloadScene, DungeonScene],
      });
      game.registry.set("classId", classId ?? null);
      game.registry.set("tutorial", tutorial);
      game.registry.set("devMode", devMode);
      game.registry.set("devWaveSec", devWaveSec ?? null);

      return () => game.destroy(true);
    },
    [classId, tutorial, devMode, devWaveSec],
  );

  return (
    <div className="game-touch-surface game-canvas-surface fixed inset-0 flex items-center justify-center bg-dungeon-deepest">
      <div ref={mountGame} className="game-canvas-surface h-full w-full" />
    </div>
  );
}
