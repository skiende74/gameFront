import type Phaser from "phaser";
import { MAGIC_PROJECTILE_CROP, TEX } from "../config";

export function ensureWizardIceProjectileTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.wizardIceProjectile)) return;
  if (!scene.textures.exists(TEX.wizardExplosionEffect)) return;

  const tex = scene.textures.get(TEX.wizardExplosionEffect);
  const source = tex.source[0];
  const sourceImage = source?.image as CanvasImageSource | undefined;
  if (!sourceImage) return;

  const { x, y, width, height } = MAGIC_PROJECTILE_CROP;
  const canvas = scene.textures.createCanvas(TEX.wizardIceProjectile, width, height);
  if (!canvas) return;

  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceImage, x, y, width, height, 0, 0, width, height);
  canvas.refresh();
}
