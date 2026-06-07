import type { UnitRank } from "../../game/data/unitRanks.ts";
import type { PartyUnit } from "../../game/state/partyUnits.ts";

export type HudStateSource = {
  elapsedSec: number;
  waveElapsedSec: number;
  waveSec: number;
  wave: number;
  hp: number;
  maxHp: number;
  kills: number;
  score: number;
  coins: number;
  finalScore: number;
  party: PartyUnit[];
};

export type HudPartyUnit = {
  uid: string;
  id: string;
  label: string;
  color: string;
  spriteUrl: string;
  rank: UnitRank;
  badge: string;
  isPlayer: boolean;
  tooltip: string[];
};

export type HudSynergyRow = {
  key: string;
  name: string;
  active: boolean;
  progressLabel: string;
  missingLabels: string[];
  classes: Array<{ id: string; label: string; color: string; present: boolean }>;
  tooltip: string[];
};

export type HudBoss = {
  name: string;
  hp: number;
  maxHp: number;
  ratio: number;
};

/** 결과/기록 화면에 남길 용병 요약. */
export type HudResultMerc = {
  id: string;
  label: string;
  color: string;
  rank: number;
  badge: string;
  isPlayer: boolean;
};

/** 결과/기록 화면에 남길 시너지 요약. */
export type HudResultSynergy = {
  key: string;
  name: string;
  progressLabel: string;
  active: boolean;
};

export type HudResult = {
  victory: boolean;
  elapsedSec: number;
  kills: number;
  score: number;
  coins: number;
  finalScore: number;
  wave: number;
  mercs: HudResultMerc[];
  synergies: HudResultSynergy[];
};

export type GameHudSnapshot = {
  hp: { current: number; max: number; ratio: number };
  time: { elapsedSec: number; remainingSec: number; label: string };
  wave: { current: number; total: number; progress: number; label: string };
  stats: { kills: number; score: number; coins: number; finalScore: number };
  party: HudPartyUnit[];
  synergies: HudSynergyRow[];
  boss: HudBoss | null;
};
