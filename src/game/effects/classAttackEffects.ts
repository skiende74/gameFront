import type Phaser from "phaser";
import { CLASS_ASSET_BASE, CLASS_DEFS, CLASS_FRAME } from "../config.ts";

const EFFECT_FILES = {
  sword: "Attack01",
  bow: "Attack01",
  mage: "Attack01",
} as const;

type AttackEffectId = keyof typeof EFFECT_FILES;

export const attackEffectTex = (id: string): string => `tex-attack-effect-${id}`;
export const attackEffectAnimKey = (id: string): string => `attack-effect-${id}`;

export const CLASS_ATTACK_EFFECT_SOURCES = Object.entries(EFFECT_FILES).map(([id, file]) => {
  const classId = id as AttackEffectId;
  const { folder, attackFrameRate } = CLASS_DEFS[classId];
  return {
    id: classId,
    tex: attackEffectTex(classId),
    animKey: attackEffectAnimKey(classId),
    path: encodeURI(
      `${CLASS_ASSET_BASE}/${folder}/${folder}(Split Effects)/${folder}-${file}_Effect.png`,
    ),
    frameRate: attackFrameRate ?? 18,
  };
});

const SOURCE_BY_ID = Object.fromEntries(
  CLASS_ATTACK_EFFECT_SOURCES.map((source) => [source.id, source]),
);

export function ensureClassAttackEffectAnimations(scene: Phaser.Scene): void {
  for (const source of CLASS_ATTACK_EFFECT_SOURCES) {
    if (!scene.textures.exists(source.tex) || scene.anims.exists(source.animKey)) continue;
    const img = scene.textures.get(source.tex).getSourceImage() as HTMLImageElement;
    const frameTotal = Math.max(1, Math.floor(img.width / CLASS_FRAME.width));
    scene.anims.create({
      key: source.animKey,
      frames: scene.anims.generateFrameNumbers(source.tex, {
        start: 0,
        end: frameTotal - 1,
      }),
      frameRate: source.frameRate,
      repeat: 0,
    });
  }
}

export function playClassAttackEffect(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite,
  classId: string,
): void {
  const source = SOURCE_BY_ID[classId];
  if (!source || !scene.textures.exists(source.tex) || !scene.anims.exists(source.animKey)) return;

  const effect = scene.add
    .sprite(target.x, target.y, source.tex, 0)
    .setOrigin(target.originX, target.originY)
    .setScale(Math.abs(target.scaleX), Math.abs(target.scaleY))
    .setFlipX(target.flipX)
    .setAlpha(0.92)
    .setDepth(target.depth + 2)
    .setBlendMode("ADD");

  const sync = () => {
    effect.setPosition(target.x, target.y);
    effect.setFlipX(target.flipX);
    effect.setScale(Math.abs(target.scaleX), Math.abs(target.scaleY));
  };
  const cleanup = () => {
    scene.events.off("update", sync);
    effect.destroy();
  };

  scene.events.on("update", sync);
  effect.once(`animationcomplete-${source.animKey}`, cleanup);
  effect.once("destroy", () => scene.events.off("update", sync));
  effect.play(source.animKey, true);
}
