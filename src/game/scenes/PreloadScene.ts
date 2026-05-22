import Phaser from "phaser";
import {
  FLOOR_PATCH_TILES,
  GAME_HEIGHT,
  GAME_WIDTH,
  HERO_FRAME,
  PACK_PATH,
  TEX,
  TILE,
  TILE_SIZE,
} from "../config";
import {
  ensureFloorPatch,
  ensureProceduralTiles,
  ensureVignetteTexture,
} from "../tiles/proceduralTiles";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    this.load.spritesheet(TEX.tileset, PACK_PATH.tileset, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet(TEX.torchStrip, PACK_PATH.torchStrip, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });

    const heroFrame = { frameWidth: HERO_FRAME.width, frameHeight: HERO_FRAME.height };
    this.load.spritesheet(TEX.heroIdleDown, PACK_PATH.heroIdleDown, heroFrame);
    this.load.spritesheet(TEX.heroIdleUp, PACK_PATH.heroIdleUp, heroFrame);
    this.load.spritesheet(TEX.heroIdleSide, PACK_PATH.heroIdleSide, heroFrame);
    this.load.image(TEX.heroShadow, PACK_PATH.heroShadow);

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[asset] missing, using fallback if any: ${file.key}`);
    });
  }

  create(): void {
    ensureProceduralTiles(this);
    ensureVignetteTexture(this, TEX.vignette, GAME_WIDTH, GAME_HEIGHT);
    ensureFloorPatch(this, TEX.floorPatch, TEX.tileset, TILE.floorVariants, FLOOR_PATCH_TILES);
    this.scene.start("DungeonScene");
  }
}
