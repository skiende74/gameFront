export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_SIZE = 32;
export const TILE_DRAW = 64;
export const TILE_SCALE = TILE_DRAW / TILE_SIZE;
export const TILE_COLS = Math.ceil(GAME_WIDTH / TILE_DRAW);
export const TILE_ROWS = Math.ceil(GAME_HEIGHT / TILE_DRAW);
export const FLOOR_PATCH_TILES = 16;
export const WORLD_BOUNDARY = 200_000;
export const PLAYER_SPEED = 200;
export const HERO_FRAME = { width: 32, height: 48, frameCount: 4 } as const;

export const COLORS = {
  bg: 0x050309,
  bone: 0xece2c8,
  torch: 0xff7a3a,
  torchCore: 0xffb066,
  ash: 0x9a8da3,
  floorBase: 0x4a3a3a,
  floorHi: 0x6e5a58,
  floorLo: 0x2a1c20,
  wallBase: 0x2c1e26,
  wallHi: 0x4a3242,
  wallLo: 0x140a14,
  wallEdge: 0x5a3a52,
  mossA: 0x4f7a3a,
  mossB: 0x6e9a4a,
} as const;

export const HEX = {
  bg: "#050309",
  bone: "#ece2c8",
  torch: "#ff7a3a",
  torchCore: "#ffb066",
  ash: "#9a8da3",
} as const;

export const TEX = {
  tileset: "tex-dungeon-tileset",
  torchStrip: "tex-torch-strip",
  vignette: "tex-vignette",
  floorPatch: "tex-floor-patch",
  heroIdleDown: "tex-hero-idle-down",
  heroIdleUp: "tex-hero-idle-up",
  heroIdleSide: "tex-hero-idle-side",
  heroShadow: "tex-hero-shadow",
  classIdle: "tex-class-idle",
  classWalk: "tex-class-walk",
  mercSword: "tex-merc-sword",
  mercBow: "tex-merc-bow",
  mercMage: "tex-merc-mage",
  mercCleric: "tex-merc-cleric",
  procFloor: "tex-proc-floor",
  procFloorAlt: "tex-proc-floor-alt",
  procWallTop: "tex-proc-wall-top",
  procWallBottom: "tex-proc-wall-bottom",
  procWallSide: "tex-proc-wall-side",
  procWallTL: "tex-proc-wall-tl",
  procWallTR: "tex-proc-wall-tr",
  procWallBL: "tex-proc-wall-bl",
  procWallBR: "tex-proc-wall-br",
  procTorch: "tex-proc-torch",
  flameParticle: "tex-flame-particle",
} as const;

export const PACK_PATH = {
  tileset: "assets/dungeon/tileset.png",
  torchStrip: "assets/dungeon/torch_strip.png",
  heroIdleDown: "assets/characters/hero/idle_down.png",
  heroIdleUp: "assets/characters/hero/idle_up.png",
  heroIdleSide: "assets/characters/hero/idle_side.png",
  heroShadow: "assets/characters/hero/shadow.png",
} as const;

export const HERO_ANIM = {
  idleDown: "hero-idle-down",
  idleUp: "hero-idle-up",
  idleSide: "hero-idle-side",
} as const;

export const CLASS_ANIM = {
  idle: "class-idle",
  walk: "class-walk",
} as const;

export const CLASS_FRAME = { width: 100, height: 100 } as const;
/**
 * 100x100 프레임 안에서 실제 캐릭터는 ~20px 높이로 가운데 작게 들어있다.
 * 기존 영웅과 비슷한 화면 크기(약 60px)가 되도록 크게 확대한다.
 */
export const CLASS_SCALE = 3;

export const CLASS_ASSET_BASE =
  "assets/Tiny RPG Character Asset Pack v1.03 -Full 20 Characters/Characters(100x100)";

export type ClassDef = { folder: string; idleFrames: number; walkFrames: number };

export const CLASS_DEFS: Record<string, ClassDef> = {
  sword: { folder: "Swordsman", idleFrames: 6, walkFrames: 8 },
  bow: { folder: "Archer", idleFrames: 6, walkFrames: 8 },
  mage: { folder: "Wizard", idleFrames: 6, walkFrames: 8 },
  cleric: { folder: "Priest", idleFrames: 6, walkFrames: 8 },
};

export function classSheetPath(folder: string, anim: "Idle" | "Walk"): string {
  return encodeURI(`${CLASS_ASSET_BASE}/${folder}/${folder}/${folder}-${anim}.png`);
}

export const TILE = {
  cornerTL: 0,
  cornerTR: 5,
  cornerBL: 48,
  cornerBR: 53,
  wallTopVariants: [1, 2, 3, 4],
  wallBottomVariants: [49, 50, 51, 52],
  wallLeftVariants: [12, 24, 36],
  wallRightVariants: [17, 29, 41],
  floorVariants: [13, 14, 15, 16, 25, 26, 27, 28, 37, 38, 39, 40],
} as const;

export const TORCH_FRAMES = [0, 1, 2] as const;

/** 인게임 HUD(상단 정보 바 / 하단 용병 바) 설정 값 */
export const HUD = {
  depth: 40,
  margin: 16,
  panelHeight: 56,
  totalTimeSec: 600,
  waveSec: 30,
  totalWaves: 20,
  playerMaxHp: 100,
  slotBox: 60,
  slotGap: 10,
} as const;

export type MercHudInfo = { label: string; color: number; tex: string };

/** 하단 용병 슬롯/아이콘에서 사용하는 직업별 메타데이터 */
export const MERC_HUD: Record<string, MercHudInfo> = {
  sword: { label: "검사", color: 0xff6b6b, tex: TEX.mercSword },
  bow: { label: "궁수", color: 0x6bd96b, tex: TEX.mercBow },
  mage: { label: "마법사", color: 0xc47aff, tex: TEX.mercMage },
  cleric: { label: "성직자", color: 0xffe066, tex: TEX.mercCleric },
};

/** 직업 id → 용병 아이콘 텍스처 로딩 정보 (PreloadScene 에서 사용) */
export const MERC_ICON_SOURCES: Array<{ id: string; tex: string; folder: string }> =
  Object.keys(MERC_HUD).map((id) => ({
    id,
    tex: MERC_HUD[id].tex,
    folder: CLASS_DEFS[id].folder,
  }));
