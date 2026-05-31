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
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
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
    <div className="fixed inset-0 bg-dungeon-deepest flex items-center justify-center">
      <div ref={mountGame} className="w-full h-full" />
    </div>
  );
}
