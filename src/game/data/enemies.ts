import { CLASS_ASSET_BASE } from "../config";

export type EnemyId =
  // 1~5 오크 테마
  | "orc"
  | "orc-elite"
  | "orc-armored"
  // 6~10 늑대 테마 / 11~15 곰 테마(werebear 주력)
  | "werewolf"
  | "werebear"
  // 16~20 병사 테마
  | "soldier"
  | "knight"
  | "lancer"
  | "axeman"
  // 보스
  | "boss-orcrider"
  | "boss-werewolf"
  | "boss-werebear"
  | "boss-armoredskeleton";
export type EnemyAnimKind = "idle" | "walk" | "hurt" | "death";

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
  /** 보스 여부(체력바·라운드 규칙 처리에 사용) */
  boss?: boolean;
  /** 시트 파일명이 표준(Idle/Walk/Hurt/Death)과 다른 경우의 종류별 오버라이드. */
  sheetFiles?: Partial<Record<EnemyAnimKind, string>>;
};

/** 테마별 잡몹 + 보스. 폴더는 Tiny RPG 팩 캐릭터명과 일치. feetRatio는 공통 0.62. */
export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  // 1~5 오크 테마: 오크 → 엘리트 오크 → 아머 오크 순으로 단단해진다.
  orc: { id: "orc", label: "오크", folder: "Orc", hp: 18, speed: 70, damage: 8, score: 10, scale: 3.3, feetRatio: 0.62, body: { w: 24, h: 20 } },
  "orc-elite": { id: "orc-elite", label: "엘리트 오크", folder: "Elite Orc", hp: 26, speed: 88, damage: 10, score: 16, scale: 3.5, feetRatio: 0.62, body: { w: 28, h: 24 } },
  "orc-armored": { id: "orc-armored", label: "아머 오크", folder: "Armored Orc", hp: 46, speed: 56, damage: 12, score: 22, scale: 3.7, feetRatio: 0.62, body: { w: 34, h: 28 } },

  // 6~10 늑대 테마(werewolf 주력) / 11~15 곰 테마(werebear 주력)
  werewolf: { id: "werewolf", label: "웨어울프", folder: "Werewolf", hp: 24, speed: 122, damage: 9, score: 18, scale: 3.6, feetRatio: 0.62, body: { w: 30, h: 28 } },
  werebear: { id: "werebear", label: "웨어베어", folder: "Werebear", hp: 62, speed: 50, damage: 16, score: 32, scale: 4.4, feetRatio: 0.62, body: { w: 42, h: 36 } },

  // 16~20 병사 테마: 용병으로 쓰지 않는 인간형 적.
  soldier: { id: "soldier", label: "병사", folder: "Soldier", hp: 52, speed: 82, damage: 14, score: 30, scale: 3.6, feetRatio: 0.62, body: { w: 26, h: 30 } },
  knight: { id: "knight", label: "기사", folder: "Knight", hp: 84, speed: 66, damage: 18, score: 46, scale: 3.8, feetRatio: 0.62, body: { w: 28, h: 32 } },
  lancer: { id: "lancer", label: "창병", folder: "Lancer", hp: 64, speed: 96, damage: 16, score: 40, scale: 3.8, feetRatio: 0.62, body: { w: 28, h: 30 }, sheetFiles: { walk: "Walk01" } },
  axeman: { id: "axeman", label: "도끼병", folder: "Armored Axeman", hp: 115, speed: 50, damage: 22, score: 60, scale: 4.0, feetRatio: 0.62, body: { w: 32, h: 34 } },

  // 웨이브 1~4의 오크 계열을 잇는 오크 두목.
  "boss-orcrider": {
    id: "boss-orcrider",
    label: "오크 라이더 두목",
    folder: "Orc rider",
    hp: 500,
    speed: 60,
    damage: 16,
    score: 300,
    scale: 5.6,
    feetRatio: 0.62,
    body: { w: 46, h: 42 },
    boss: true,
  },
  // 늑대(돌진병) 계열을 잇는 늑대왕.
  "boss-werewolf": {
    id: "boss-werewolf",
    label: "광폭 늑대왕",
    folder: "Werewolf",
    hp: 1000,
    speed: 92,
    damage: 20,
    score: 500,
    scale: 6.0,
    feetRatio: 0.62,
    body: { w: 46, h: 42 },
    boss: true,
  },
  // 곰(덩치) 계열을 잇는 거대 곰 군주.
  "boss-werebear": {
    id: "boss-werebear",
    label: "거대 곰 군주",
    folder: "Werebear",
    hp: 1700,
    speed: 52,
    damage: 24,
    score: 700,
    scale: 6.6,
    feetRatio: 0.62,
    body: { w: 54, h: 48 },
    boss: true,
  },
  // 최종 보스: 그동안 등장하지 않은 강철 해골 군주.
  "boss-armoredskeleton": {
    id: "boss-armoredskeleton",
    label: "강철 해골 대군주",
    folder: "Armored Skeleton",
    hp: 2600,
    speed: 62,
    damage: 26,
    score: 1200,
    scale: 6.8,
    feetRatio: 0.62,
    body: { w: 50, h: 48 },
    boss: true,
  },
};

export const ENEMY_IDS = Object.keys(ENEMY_DEFS) as EnemyId[];

/** 보스가 등장하는 웨이브 → 보스 종류 매핑(잡몹 테마에 맞춤). */
export const BOSS_WAVE_MAP: Record<number, EnemyId> = {
  5: "boss-orcrider",
  10: "boss-werewolf",
  15: "boss-werebear",
  20: "boss-armoredskeleton",
};

export const BOSS_WAVES = Object.keys(BOSS_WAVE_MAP).map(Number);

export function isBossWave(wave: number): boolean {
  return wave in BOSS_WAVE_MAP;
}

export function bossIdForWave(wave: number): EnemyId | undefined {
  return BOSS_WAVE_MAP[wave];
}

export const enemyTex = (id: EnemyId, kind: EnemyAnimKind): string => `tex-enemy-${id}-${kind}`;
export const enemyAnimKey = (id: EnemyId, kind: EnemyAnimKind): string => `enemy-${id}-${kind}`;

const ANIM_FILE: Record<EnemyAnimKind, string> = {
  idle: "Idle",
  walk: "Walk",
  hurt: "Hurt",
  death: "Death",
};

export function enemySheetPath(folder: string, kind: EnemyAnimKind, fileOverride?: string): string {
  const file = fileOverride ?? ANIM_FILE[kind];
  return encodeURI(`${CLASS_ASSET_BASE}/${folder}/${folder}/${folder}-${file}.png`);
}
