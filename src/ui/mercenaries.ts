export type Mercenary = {
  id: string;
  label: string;
  role: string;
  stats: Array<{ k: string; v: string }>;
  glow: string;
  bobDelay: string;
  spriteUrl: string;
  feetAdjust: string;
};

const ASSET_BASE = "/assets/Tiny RPG Character Asset Pack v1.03 -Full 20 Characters/Characters(100x100)";

const idleSprite = (folder: string, file: string) => encodeURI(`${ASSET_BASE}/${folder}/${folder}/${file}-Idle.png`);

export const MERCS: Mercenary[] = [
  {
    id: "sword",
    label: "검사",
    role: "근접 범위 공격",
    stats: [
      { k: "ATK", v: "15" },
      { k: "사거리", v: "60px" },
      { k: "쿨타임", v: "0.8s" },
    ],
    glow: "var(--color-class-sword)",
    bobDelay: "0s",
    spriteUrl: idleSprite("Swordsman", "Swordsman"),
    feetAdjust: "0%",
  },
  {
    id: "bow",
    label: "궁수",
    role: "원거리 투사체",
    stats: [
      { k: "ATK", v: "10" },
      { k: "사거리", v: "280px" },
      { k: "쿨타임", v: "1.0s" },
    ],
    glow: "var(--color-class-bow)",
    bobDelay: "0.25s",
    spriteUrl: idleSprite("Archer", "Archer"),
    feetAdjust: "3%",
  },
  {
    id: "mage",
    label: "마법사",
    role: "광역 폭발",
    stats: [
      { k: "ATK", v: "25" },
      { k: "폭발반경", v: "80px" },
      { k: "쿨타임", v: "2.0s" },
    ],
    glow: "var(--color-class-mage)",
    bobDelay: "0.5s",
    spriteUrl: idleSprite("Wizard", "Wizard"),
    feetAdjust: "2%",
  },
  {
    id: "cleric",
    label: "성직자",
    role: "아군 전체 회복",
    stats: [
      { k: "회복", v: "+5 HP" },
      { k: "대상", v: "팀 전체" },
      { k: "주기", v: "5.0s" },
    ],
    glow: "var(--color-class-cleric)",
    bobDelay: "0.75s",
    spriteUrl: idleSprite("Priest", "Priest"),
    feetAdjust: "2%",
  },
];
