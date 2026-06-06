import { useEffect, useState, type ReactNode } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "../../game/config.ts";

/**
 * React HUD를 Phaser 캔버스와 동일한 좌표계로 맞추는 스테이지.
 * Phaser Scale.FIT + CENTER_BOTH와 같은 방식(min 비율 축소 후 중앙정렬)으로
 * 1280x720 고정 박스를 스케일해, HUD와 튜토리얼 강조선 위치가 항상 일치한다.
 */
export function GameStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      <div
        className="relative font-pixel-ko text-bone-white"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
