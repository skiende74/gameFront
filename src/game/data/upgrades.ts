export type UpgradeId =
  | "hire-sword"
  | "hire-bow"
  | "hire-mage"
  | "hire-cleric"
  | "tactics"
  | "haste"
  | "agility"
  | "first-aid"
  | "defense";

export type UpgradeDef = {
  id: UpgradeId;
  title: string;
  desc: string;
  effect: string;
};

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  "hire-sword": {
    id: "hire-sword",
    title: "검사 고용",
    desc: "근접 범위 공격 용병을 추가합니다.",
    effect: "검사 +1",
  },
  "hire-bow": {
    id: "hire-bow",
    title: "궁수 고용",
    desc: "원거리 투사체 용병을 추가합니다.",
    effect: "궁수 +1",
  },
  "hire-mage": {
    id: "hire-mage",
    title: "마법사 고용",
    desc: "광역 폭발 용병을 추가합니다.",
    effect: "마법사 +1",
  },
  "hire-cleric": {
    id: "hire-cleric",
    title: "성직자 고용",
    desc: "주기적으로 체력을 회복하는 용병을 추가합니다.",
    effect: "성직자 +1",
  },
  tactics: {
    id: "tactics",
    title: "전술 훈련",
    desc: "모든 공격형 용병의 피해량을 높입니다.",
    effect: "용병 공격력 +10%",
  },
  haste: {
    id: "haste",
    title: "속공 지휘",
    desc: "용병의 행동 주기를 단축합니다.",
    effect: "용병 공격속도 +10%",
  },
  agility: {
    id: "agility",
    title: "민첩한 대장",
    desc: "플레이어가 더 빠르게 이동합니다.",
    effect: "이동속도 +10%",
  },
  "first-aid": {
    id: "first-aid",
    title: "응급 치료",
    desc: "현재 체력을 즉시 회복합니다.",
    effect: "현재 체력 +30",
  },
  defense: {
    id: "defense",
    title: "방어 진형",
    desc: "최대 체력과 현재 체력을 함께 늘립니다.",
    effect: "최대 체력 +20 / 현재 체력 +20",
  },
};

export const UPGRADE_LIST = Object.values(UPGRADE_DEFS);

export function getUpgrade(id: string | undefined): UpgradeDef | undefined {
  if (!id) return undefined;
  return UPGRADE_DEFS[id as UpgradeId];
}

export function rollUpgradeChoices(count = 3): UpgradeDef[] {
  return [...UPGRADE_LIST].sort(() => Math.random() - 0.5).slice(0, count);
}
