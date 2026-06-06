import type { MercCombat } from "./mercs";

export type UnitRank = 1 | 2 | 3;

type RankBonus = {
  powerMultiplier: number;
  cooldownMultiplier: number;
  rangeBonus: number;
  aoeRadiusBonus: number;
};

export const RANK_BADGE: Record<UnitRank, string> = {
  1: "I",
  2: "II",
  3: "III",
};

const BASE_BONUS: Record<UnitRank, RankBonus> = {
  1: { powerMultiplier: 1, cooldownMultiplier: 1, rangeBonus: 0, aoeRadiusBonus: 0 },
  2: { powerMultiplier: 1.6, cooldownMultiplier: 0.85, rangeBonus: 10, aoeRadiusBonus: 15 },
  3: { powerMultiplier: 3.2, cooldownMultiplier: 0.6, rangeBonus: 40, aoeRadiusBonus: 55 },
};

const ROLE_BONUS: Partial<Record<string, Partial<Record<UnitRank, Partial<RankBonus>>>>> = {
  bow: {
    2: { rangeBonus: 20 },
    3: { rangeBonus: 70 },
  },
  mage: {
    2: { aoeRadiusBonus: 20 },
    3: { aoeRadiusBonus: 75 },
  },
};

export function applyRankToCombat(base: MercCombat, rank: UnitRank): MercCombat {
  const bonus = { ...BASE_BONUS[rank], ...ROLE_BONUS[base.id]?.[rank] };
  const atk = base.atk <= 0 ? base.atk : Math.max(1, Math.round(base.atk * bonus.powerMultiplier));
  return {
    ...base,
    atk,
    heal: base.heal === undefined ? base.heal : Math.max(1, Math.round(base.heal * bonus.powerMultiplier)),
    cooldownMs: Math.max(1, Math.round(base.cooldownMs * bonus.cooldownMultiplier)),
    range: base.role === "heal" ? base.range : base.range + bonus.rangeBonus,
    aoeRadius: base.aoeRadius === undefined ? base.aoeRadius : base.aoeRadius + bonus.aoeRadiusBonus,
  };
}
