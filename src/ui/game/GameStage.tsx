import { type ReactNode } from "react";

/**
 * React HUD 스테이지.
 * Phaser 캔버스가 Scale.RESIZE로 전체 화면을 1:1(px) 비율로 채우므로,
 * HUD도 동일하게 화면 전체를 덮고 각 요소를 화면 모서리에 직접 앵커링한다.
 * (별도 스케일/레터박스 없이 Phaser 좌표와 CSS px가 1:1로 일치한다.)
 */
export function GameStage({ children }: { children: ReactNode }) {
  return (
    <div className="game-touch-surface pointer-events-none fixed inset-0 z-40 overflow-hidden font-pixel-ko text-bone-white">
      {children}
    </div>
  );
}
