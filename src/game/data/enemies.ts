import { CLASS_ASSET_BASE } from "../config";

export type EnemyId =
  | "slime"
  | "rusher"
  | "brute"
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
    body: { w: 24, h: 20 },
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
  // 웨이브 1~4의 오크(슬라임) 계열을 잇는 오크 두목.
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

export function enemySheetPath(folder: string, kind: EnemyAnimKind): string {
  return encodeURI(`${CLASS_ASSET_BASE}/${folder}/${folder}/${folder}-${ANIM_FILE[kind]}.png`);
}
