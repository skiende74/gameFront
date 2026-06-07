import type { HudResult } from "./hudTypes.ts";

const BEST_SCORE_KEY = "dacon-game:best-score";
const HISTORY_KEY = "dacon-game:history";
const MAX_HISTORY = 30;

/** 한 판의 플레이 결과 기록. 타이틀 화면 점수판에서 사용한다. */
export type GameRecord = HudResult & { date: number };

export function getBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  const value = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(value) ? value : 0;
}

/**
 * 점수를 기록한다. 기존 최고점을 넘으면 저장 후 true(신기록)를 반환한다.
 */
export function recordScore(score: number): { best: number; isNewRecord: boolean } {
  const prev = getBestScore();
  if (score > prev) {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
    return { best: score, isNewRecord: true };
  }
  return { best: prev, isNewRecord: false };
}

/** 저장된 플레이 기록 목록을 최신순으로 반환한다. */
export function getGameRecords(): GameRecord[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : [];
  } catch {
    return [];
  }
}

/** 한 판의 결과를 기록 목록 맨 앞에 추가한다(최대 MAX_HISTORY개 유지). */
export function saveGameRecord(result: HudResult): void {
  const record: GameRecord = { ...result, date: Date.now() };
  const next = [record, ...getGameRecords()].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

/** 모든 플레이 기록을 삭제한다. */
export function clearGameRecords(): void {
  localStorage.removeItem(HISTORY_KEY);
}
