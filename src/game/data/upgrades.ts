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

export type UpgradeTier = "common" | "rare" | "epic";

export type UpgradeDef = {
  id: UpgradeId;
  title: string;
  desc: string;
  effect: string;
  tier: UpgradeTier;
};

export const UPGRADE_TIERS: Record<
  UpgradeTier,
  { label: string; color: string; glow: string }
> = {
  common: { label: "일반", color: "#9a8da3", glow: "rgba(154,141,163,0.4)" },
  rare: { label: "희귀", color: "#6effe0", glow: "rgba(110,255,224,0.5)" },
  epic: { label: "영웅", color: "#c47aff", glow: "rgba(196,122,255,0.55)" },
};

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  "hire-sword": {
    id: "hire-sword",
    title: "검사 고용",
    desc: "근접 범위 공격 용병을 추가합니다.",
    effect: "검사 +1",
    tier: "epic",
  },
  "hire-bow": {
    id: "hire-bow",
    title: "궁수 고용",
    desc: "원거리 투사체 용병을 추가합니다.",
    effect: "궁수 +1",
    tier: "epic",
  },
  "hire-mage": {
    id: "hire-mage",
    title: "마법사 고용",
    desc: "광역 폭발 용병을 추가합니다.",
    effect: "마법사 +1",
    tier: "epic",
  },
  "hire-cleric": {
    id: "hire-cleric",
    title: "성직자 고용",
    desc: "주기적으로 체력을 회복하는 용병을 추가합니다.",
    effect: "성직자 +1",
    tier: "epic",
  },
  tactics: {
    id: "tactics",
    title: "전술 훈련",
    desc: "모든 공격형 용병의 피해량을 높입니다.",
    effect: "용병 공격력 +10%",
    tier: "rare",
  },
  haste: {
    id: "haste",
    title: "속공 지휘",
    desc: "용병의 행동 주기를 단축합니다.",
    effect: "용병 공격속도 +10%",
    tier: "rare",
  },
  agility: {
    id: "agility",
    title: "민첩한 대장",
    desc: "플레이어가 더 빠르게 이동합니다.",
    effect: "이동속도 +10%",
    tier: "common",
  },
  "first-aid": {
    id: "first-aid",
    title: "응급 치료",
    desc: "현재 체력을 즉시 회복합니다.",
    effect: "현재 체력 +30",
    tier: "common",
  },
  defense: {
    id: "defense",
    title: "방어 진형",
    desc: "최대 체력과 현재 체력을 함께 늘립니다.",
    effect: "최대 체력 +20 / 현재 체력 +20",
    tier: "common",
  },
};

export const UPGRADE_LIST = Object.values(UPGRADE_DEFS);

export function getUpgrade(id: string | undefined): UpgradeDef | undefined {
  if (!id) return undefined;
  return UPGRADE_DEFS[id as UpgradeId];
}

export function rollUpgradeChoices(
  count = 3,
  opts?: { excludeHire?: boolean; excludeHireIds?: string[] },
): UpgradeDef[] {
  const excludedHireIds = new Set(opts?.excludeHireIds?.map((id) => `hire-${id}`));
  const pool = opts?.excludeHire
    ? UPGRADE_LIST.filter((u) => !u.id.startsWith("hire-"))
    : UPGRADE_LIST.filter((u) => !excludedHireIds.has(u.id));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}
