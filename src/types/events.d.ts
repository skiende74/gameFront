import type { GameHudSnapshot, HudResult } from "../ui/game/hudTypes.ts";

declare global {
  interface WindowEventMap {
    "game:exit": CustomEvent;
    "game:hud-update": CustomEvent<GameHudSnapshot>;
    "game:pause-change": CustomEvent<boolean>;
    "game:result-change": CustomEvent<HudResult | null>;
    "game:resume-request": CustomEvent;
    "game:restart-request": CustomEvent;
    "game:upgrade-request": CustomEvent<{
      completedWave: number;
      nextWave: number;
      blockedHireIds?: string[];
      mercFull?: boolean;
      score: number;
      coins: number;
    }>;
    "game:upgrade-selected": CustomEvent<{ upgradeId?: string }>;
    "game:upgrade-reroll": CustomEvent<{ cost: number }>;
    "game:dev-wave-sec-change": CustomEvent<{ waveSec: number }>;
  }
}

export {};
