import type { GameHudSnapshot, HudResult } from "./hudTypes.ts";

export const GAME_HUD_EVENT = "game:hud-update";
export const GAME_PAUSE_EVENT = "game:pause-change";
export const GAME_PAUSE_REQUEST_EVENT = "game:pause-request";
export const GAME_RESULT_EVENT = "game:result-change";
export const GAME_RESUME_REQUEST_EVENT = "game:resume-request";
export const GAME_RESTART_REQUEST_EVENT = "game:restart-request";

type DispatchTarget = Pick<EventTarget, "dispatchEvent">;

export function emitHudSnapshot(target: DispatchTarget, snapshot: GameHudSnapshot): void {
  target.dispatchEvent(new CustomEvent(GAME_HUD_EVENT, { detail: snapshot }));
}

export function emitPauseState(target: DispatchTarget, paused: boolean): void {
  target.dispatchEvent(new CustomEvent(GAME_PAUSE_EVENT, { detail: paused }));
}

export function emitResultState(target: DispatchTarget, result: HudResult | null): void {
  target.dispatchEvent(new CustomEvent(GAME_RESULT_EVENT, { detail: result }));
}
