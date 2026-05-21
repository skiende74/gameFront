import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GAME_WIDTH, GAME_HEIGHT, HEX } from "./config";

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: HEX.bg,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: true,
      scene: [BootScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-dungeon-deepest flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
