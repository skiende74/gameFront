import type { EnemyId } from "./enemies";

/** 구간 후반부에 점점 섞여 나오는 보조 적 종류. */
export type WaveMixIn = {
  type: EnemyId;
  /** 섞이기 시작하는 웨이브 */
  fromWave: number;
  /** 주력(types) 1마리당 상대 출현 비중 */
  weight: number;
};

/** 한 구간(웨이브 범위)의 적 구성과 동시 출현 수 범위. 기획서 8-2 스폰 곡선 기반. */
export type WavePhase = {
  minWave: number;
  maxWave: number;
  types: EnemyId[];
  minAlive: number;
  maxAlive: number;
  /** 구간 후반에 "비슷한 다른 종류"를 일부 섞어 단조로움을 줄인다. */
  mixIns?: WaveMixIn[];
};

export const WAVE_PHASES: WavePhase[] = [
  {
    minWave: 1,
    maxWave: 4,
    types: ["slime"],
    minAlive: 6,
    maxAlive: 14,
    mixIns: [{ type: "rusher", fromWave: 3, weight: 0.4 }],
  },
  { minWave: 5, maxWave: 10, types: ["slime", "rusher"], minAlive: 14, maxAlive: 28 },
  { minWave: 11, maxWave: 16, types: ["slime", "rusher", "brute"], minAlive: 28, maxAlive: 45 },
  { minWave: 17, maxWave: 20, types: ["slime", "rusher", "brute"], minAlive: 45, maxAlive: 65 },
];

export function phaseForWave(wave: number): WavePhase {
  return (
    WAVE_PHASES.find((p) => wave >= p.minWave && wave <= p.maxWave) ??
    WAVE_PHASES[WAVE_PHASES.length - 1]
  );
}

export type SpawnWeight = { type: EnemyId; weight: number };

/** 현재 웨이브의 적 종류별 출현 가중치. 주력은 1, 조건을 만족한 mixIn은 지정 비중으로 추가된다. */
export function spawnTypeWeights(wave: number): SpawnWeight[] {
  const phase = phaseForWave(wave);
  const weights: SpawnWeight[] = phase.types.map((type) => ({ type, weight: 1 }));
  for (const mix of phase.mixIns ?? []) {
    if (wave >= mix.fromWave) weights.push({ type: mix.type, weight: mix.weight });
  }
  return weights;
}

/** 가중치 기반으로 스폰할 적 종류 1개를 고른다. */
export function rollSpawnType(wave: number): EnemyId {
  const weights = spawnTypeWeights(wave);
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return weights[weights.length - 1].type;
}

/**
 * 웨이브에 따른 잡몹 능력치 배율.
 * 기존엔 동시 생존 수만 늘고 적 1마리 스펙이 고정이라 후반이 쉬웠다.
 * HP는 가파르게, 공격력은 완만하게, 속도는 살짝만 키워 파워 곡선을 맞춘다.
 */
export type EnemyScaling = { hp: number; damage: number; speed: number };

export function enemyScaling(wave: number): EnemyScaling {
  const w = Math.max(1, wave) - 1;
  return {
    hp: 1 + 0.13 * w,
    damage: 1 + 0.06 * w,
    speed: 1 + 0.01 * w,
  };
}

/** 현재 웨이브에서 유지해야 할 동시 생존 적 수(구간 내 선형 증가). */
export function desiredAliveCount(wave: number): number {
  const phase = phaseForWave(wave);
  const span = Math.max(1, phase.maxWave - phase.minWave);
  const t = clamp01((wave - phase.minWave) / span);
  return Math.round(phase.minAlive + (phase.maxAlive - phase.minAlive) * t);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
