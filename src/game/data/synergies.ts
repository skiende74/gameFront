/**
 * 타 직업 "조합" 시너지. 서로 다른 직업이 함께 있어야만 발동한다.
 * (같은 직업끼리는 합체/승급으로 처리하고, 시너지는 직업 간 결합에서만 생긴다.)
 */
import type { MercCombat, MercRole } from "./mercs";
import type { PartyUnit } from "../state/partyUnits";

export type SynergyEffect = {
  /** 효과가 적용되는 역할. 비우면 전 직업 공통. */
  roles?: MercRole[];
  /** 공격력 배율 */
  atkMul?: number;
  /** 공격속도 배율(쿨타임은 그만큼 줄어듦) */
  atkSpeedMul?: number;
  /** 사거리 가산(px) */
  rangeBonus?: number;
  /** 광역 반경 가산(px) */
  aoeRadiusBonus?: number;
  /** 플레이어가 받는 피해 배율(1 미만이면 감소). 역할과 무관하게 전역 적용. */
  damageTakenMul?: number;
};

export type ComboSynergy = {
  key: string;
  name: string;
  /** 모두 파티에 있어야 발동하는 직업 id 목록 */
  classes: string[];
  /** 호버 툴팁에 보여줄 효과 설명 */
  desc: string;
  effect: SynergyEffect;
};

/** report.md 조합 추천 기반. 2직업 6종 / 3직업 3종 / 4직업 1종. */
export const COMBO_SYNERGIES: ComboSynergy[] = [
  {
    key: "cover-fire",
    name: "엄호 사격",
    classes: ["sword", "bow"],
    desc: "검사가 막고 궁수가 쏜다.\n궁수 공격력 +15%",
    effect: { roles: ["ranged"], atkMul: 1.15 },
  },
  {
    key: "rally-blast",
    name: "집결 폭발",
    classes: ["sword", "mage"],
    desc: "검사가 모은 적을 마법사가 터뜨린다.\n마법사 폭발 반경 +25",
    effect: { roles: ["aoe"], aoeRadiusBonus: 25 },
  },
  {
    key: "guard-oath",
    name: "수호 서약",
    classes: ["sword", "cleric"],
    desc: "전열과 치유의 결속.\n받는 피해 -15%",
    effect: { damageTakenMul: 0.85 },
  },
  {
    key: "barrage",
    name: "포격대",
    classes: ["bow", "mage"],
    desc: "둘 다 원거리 화력.\n원거리 사거리 +30, 공격력 +15%",
    effect: { roles: ["ranged", "aoe"], rangeBonus: 30, atkMul: 1.15 },
  },
  {
    key: "blessed-arrow",
    name: "축복의 화살",
    classes: ["bow", "cleric"],
    desc: "치유로 연사를 유지한다.\n궁수 공격속도 +20%",
    effect: { roles: ["ranged"], atkSpeedMul: 1.2 },
  },
  {
    key: "purge-flame",
    name: "정화의 불꽃",
    classes: ["mage", "cleric"],
    desc: "신성과 마법의 광역 화력.\n마법사 공격력 +20%",
    effect: { roles: ["aoe"], atkMul: 1.2 },
  },
  {
    key: "annihilation",
    name: "섬멸전",
    classes: ["sword", "bow", "mage"],
    desc: "근접·단일·광역 풀 화력.\n전체 공격력 +20%",
    effect: { atkMul: 1.2 },
  },
  {
    key: "expedition",
    name: "정규 원정대",
    classes: ["sword", "bow", "cleric"],
    desc: "탱·딜·힐 안정 편성.\n전체 공격력 +10%, 받는 피해 -10%",
    effect: { atkMul: 1.1, damageTakenMul: 0.9 },
  },
  {
    key: "rear-battery",
    name: "후방 포대",
    classes: ["bow", "mage", "cleric"],
    desc: "근접 없는 원거리 몰빵.\n원거리 공격력 +30%, 받는 피해 +20%",
    effect: { roles: ["ranged", "aoe"], atkMul: 1.3, damageTakenMul: 1.2 },
  },
  {
    key: "four-square",
    name: "사방진",
    classes: ["sword", "bow", "mage", "cleric"],
    desc: "전 역할 완비, 군단의 완성.\n전체 공격력 +10%, 공격속도 +10%, 받는 피해 -10%",
    effect: { atkMul: 1.1, atkSpeedMul: 1.1, damageTakenMul: 0.9 },
  },
];

/** 파티에 존재하는 직업 id 집합. */
export function presentClasses(party: PartyUnit[]): Set<string> {
  return new Set(party.map((unit) => unit.id));
}

/** 현재 모든 직업 조건을 만족해 발동 중인 조합 시너지 목록. */
export function activeSynergies(present: Set<string>): ComboSynergy[] {
  return COMBO_SYNERGIES.filter((synergy) =>
    synergy.classes.every((id) => present.has(id)),
  );
}

/** 발동 중인 시너지를 적용한 전투 스펙 사본을 반환한다(역할별 보정). */
export function applySynergyToCombat(combat: MercCombat, present: Set<string>): MercCombat {
  let atkMul = 1;
  let atkSpeedMul = 1;
  let rangeBonus = 0;
  let aoeBonus = 0;

  for (const { effect } of activeSynergies(present)) {
    if (effect.roles && !effect.roles.includes(combat.role)) continue;
    atkMul *= effect.atkMul ?? 1;
    atkSpeedMul *= effect.atkSpeedMul ?? 1;
    rangeBonus += effect.rangeBonus ?? 0;
    aoeBonus += effect.aoeRadiusBonus ?? 0;
  }

  return {
    ...combat,
    atk: Math.max(0, Math.round(combat.atk * atkMul)),
    cooldownMs: Math.max(1, Math.round(combat.cooldownMs / atkSpeedMul)),
    range: combat.range + rangeBonus,
    aoeRadius: combat.aoeRadius === undefined ? undefined : combat.aoeRadius + aoeBonus,
  };
}

/** 발동 중인 시너지의 "받는 피해" 배율 곱(역할 무관 전역 적용). */
export function synergyDamageTakenMul(present: Set<string>): number {
  let mul = 1;
  for (const { effect } of activeSynergies(present)) {
    mul *= effect.damageTakenMul ?? 1;
  }
  return mul;
}
