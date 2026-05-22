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
