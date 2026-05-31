/** 게임 ↔ React 셸 사이에서 쓰는 커스텀 window 이벤트 타입 보강. */
declare global {
  interface WindowEventMap {
    "game:exit": CustomEvent;
    "game:upgrade-request": CustomEvent<{ completedWave: number; nextWave: number }>;
    "game:upgrade-selected": CustomEvent<{ upgradeId?: string }>;
    "game:dev-wave-sec-change": CustomEvent<{ waveSec: number }>;
  }
}

export { };
