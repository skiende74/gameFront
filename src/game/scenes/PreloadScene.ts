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
import {
  ENEMY_FRAME,
  ENEMY_IDS,
  ENEMY_DEFS,
  enemySheetPath,
  enemyTex,
} from "../data/enemies";
import { MERC_ATTACK_SOURCES, MERC_WALK_SOURCES } from "../data/mercs";
import { SFX_ASSETS, sfxKey, type SfxId } from "../data/sfx";

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

    // 플레이어 본체 = 선택한 직업 캐릭터 (idle / walk)
    const classId = this.registry.get("classId") as string | null;
    const classDef = classId ? CLASS_DEFS[classId] : undefined;
    if (classDef) {
      this.load.spritesheet(TEX.classIdle, classSheetPath(classDef.folder, "Idle"), classFrame);
      this.load.spritesheet(TEX.classWalk, classSheetPath(classDef.folder, "Walk"), classFrame);
      this.load.spritesheet(
        TEX.classAttack,
        classSheetPath(classDef.folder, classDef.attackFile),
        classFrame,
      );
      this.load.spritesheet(TEX.classHurt, classSheetPath(classDef.folder, "Hurt"), classFrame);
      this.load.spritesheet(TEX.classDeath, classSheetPath(classDef.folder, "Death"), classFrame);
    }

    // 하단 용병 바에서 사용할 4종 아이콘 스프라이트시트 (idle 1프레임을 아이콘으로 사용)
    for (const merc of MERC_ICON_SOURCES) {
      this.load.spritesheet(merc.tex, classSheetPath(merc.folder, "Idle"), classFrame);
    }

    // 적 3종 스프라이트시트 (idle / walk / hurt / death)
    const enemyFrame = { frameWidth: ENEMY_FRAME.width, frameHeight: ENEMY_FRAME.height };
    for (const id of ENEMY_IDS) {
      const folder = ENEMY_DEFS[id].folder;
      this.load.spritesheet(enemyTex(id, "idle"), enemySheetPath(folder, "idle"), enemyFrame);
      this.load.spritesheet(enemyTex(id, "walk"), enemySheetPath(folder, "walk"), enemyFrame);
      this.load.spritesheet(enemyTex(id, "hurt"), enemySheetPath(folder, "hurt"), enemyFrame);
      this.load.spritesheet(enemyTex(id, "death"), enemySheetPath(folder, "death"), enemyFrame);
    }

    // 용병 전투용 walk 시트 (idle 은 HUD 아이콘 시트를 재사용)
    for (const merc of MERC_WALK_SOURCES) {
      this.load.spritesheet(merc.tex, merc.path, classFrame);
    }

    for (const merc of MERC_ATTACK_SOURCES) {
      this.load.spritesheet(merc.tex, merc.path, classFrame);
    }

    // 화살 투사체 (단일 이미지)
    this.load.image(TEX.arrow, PACK_PATH.arrow);
    this.load.spritesheet(TEX.wizardAttackEffect, PACK_PATH.wizardAttackEffect, classFrame);
    this.load.spritesheet(TEX.priestHealEffect, PACK_PATH.priestHealEffect, classFrame);
    for (const id of Object.keys(SFX_ASSETS) as SfxId[]) {
      this.load.audio(sfxKey(id), SFX_ASSETS[id]);
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
