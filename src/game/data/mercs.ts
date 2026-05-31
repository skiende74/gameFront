import { CLASS_DEFS, MERC_HUD, classSheetPath } from "../config";

export type MercRole = "melee" | "ranged" | "aoe" | "heal";

/** 용병 1기의 전투 스펙. 기획서 8-1 수치 기반. */
export type MercCombat = {
  id: string;
  role: MercRole;
  atk: number;
  /** 타겟 탐지/공격 사거리(px). heal 은 사거리 무의미. */
  range: number;
  cooldownMs: number;
  /** aoe 역할의 폭발 반경(px) */
  aoeRadius?: number;
  /** heal 역할의 회복량 */
  heal?: number;
  projectile?: "arrow" | "magic";
  scale: number;
  feetRatio: number;
};

export const MERC_COMBAT: Record<string, MercCombat> = {
  sword: { id: "sword", role: "melee", atk: 16, range: 85, cooldownMs: 800, scale: 3, feetRatio: 0.58 },
  bow: {
    id: "bow",
    role: "ranged",
    atk: 12,
    range: 320,
    cooldownMs: 800,
    projectile: "arrow",
    scale: 3,
    feetRatio: 0.58,
  },
  mage: {
    id: "mage",
    role: "aoe",
    atk: 28,
    range: 300,
    cooldownMs: 1800,
    aoeRadius: 75,
    projectile: "magic",
    scale: 3,
    feetRatio: 0.58,
  },
  cleric: { id: "cleric", role: "heal", atk: 0, range: 0, cooldownMs: 3000, heal: 5, scale: 3, feetRatio: 0.58 },
};

export const mercWalkTex = (id: string): string => `tex-mercwalk-${id}`;
/** idle 텍스처는 HUD 아이콘과 동일 시트를 재사용한다. */
export const mercIdleTex = (id: string): string => MERC_HUD[id].tex;
export const mercAnimKey = (id: string, kind: "idle" | "walk"): string => `mercb-${id}-${kind}`;

/** PreloadScene 에서 추가로 로드할 용병 walk 스프라이트시트 정보. */
export const MERC_WALK_SOURCES = Object.keys(MERC_COMBAT).map((id) => ({
  id,
  tex: mercWalkTex(id),
  path: classSheetPath(CLASS_DEFS[id].folder, "Walk"),
}));
