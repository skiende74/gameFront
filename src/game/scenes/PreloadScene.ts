import Phaser from "phaser";
import {
  CLASS_DEFS,
  CLASS_FRAME,
  FLOOR_PATCH_TILES,
  GAME_HEIGHT,
  GAME_WIDTH,
  HERO_FRAME,
  MERC_ICON_SOURCES,
  PACK_PATH,
  TEX,
  TILE,
  TILE_SIZE,
  classSheetPath,
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

    const classFrame = { frameWidth: CLASS_FRAME.width, frameHeight: CLASS_FRAME.height };

    const classId = this.registry.get("classId") as string | null;
    const classDef = classId ? CLASS_DEFS[classId] : undefined;
    if (classDef) {
      this.load.spritesheet(TEX.classIdle, classSheetPath(classDef.folder, "Idle"), classFrame);
      this.load.spritesheet(TEX.classWalk, classSheetPath(classDef.folder, "Walk"), classFrame);
    }

    // 하단 용병 바에서 사용할 4종 아이콘 스프라이트시트 (idle 1프레임을 아이콘으로 사용)
    for (const merc of MERC_ICON_SOURCES) {
      this.load.spritesheet(merc.tex, classSheetPath(merc.folder, "Idle"), classFrame);
    }

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
