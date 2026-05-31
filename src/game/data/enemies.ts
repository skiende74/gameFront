import { CLASS_ASSET_BASE } from "../config";

export type EnemyId = "slime" | "rusher" | "brute";
export type EnemyAnimKind = "idle" | "walk" | "death";

export const ENEMY_FRAME = { width: 100, height: 100 } as const;

export type EnemyDef = {
  id: EnemyId;
  label: string;
  /** Tiny RPG 팩 내 캐릭터 폴더명 (기획서 3종을 보유 에셋에 매핑) */
  folder: string;
  hp: number;
  speed: number;
  damage: number;
  score: number;
  scale: number;
  /** 100px 프레임에서 발이 닿는 세로 비율(원점) */
  feetRatio: number;
  /** 충돌 바디 크기(px, 스케일 적용 전) */
  body: { w: number; h: number };
};

/** 기획서 8-1 수치 기반. slime=Orc / rusher=Werewolf / brute=Werebear 로 매핑. */
export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  slime: {
    id: "slime",
    label: "슬라임",
    folder: "Orc",
    hp: 18,
    speed: 70,
    damage: 8,
    score: 10,
    scale: 3.3,
    feetRatio: 0.62,
    body: { w: 30, h: 26 },
  },
  rusher: {
    id: "rusher",
    label: "돌진병",
    folder: "Werewolf",
    hp: 12,
    speed: 120,
    damage: 6,
    score: 15,
    scale: 3.4,
    feetRatio: 0.62,
    body: { w: 30, h: 28 },
  },
  brute: {
    id: "brute",
    label: "덩치",
    folder: "Werebear",
    hp: 55,
    speed: 45,
    damage: 15,
    score: 30,
    scale: 4.2,
    feetRatio: 0.62,
    body: { w: 40, h: 34 },
  },
};

export const ENEMY_IDS = Object.keys(ENEMY_DEFS) as EnemyId[];

export const enemyTex = (id: EnemyId, kind: EnemyAnimKind): string => `tex-enemy-${id}-${kind}`;
export const enemyAnimKey = (id: EnemyId, kind: EnemyAnimKind): string => `enemy-${id}-${kind}`;

const ANIM_FILE: Record<EnemyAnimKind, string> = {
  idle: "Idle",
  walk: "Walk",
  death: "Death",
};

export function enemySheetPath(folder: string, kind: EnemyAnimKind): string {
  return encodeURI(`${CLASS_ASSET_BASE}/${folder}/${folder}/${folder}-${ANIM_FILE[kind]}.png`);
}
