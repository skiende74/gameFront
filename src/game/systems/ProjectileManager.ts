import Phaser from "phaser";
import { EFFECT_ANIM, MAGIC_PROJECTILE_FRAME, TEX } from "../config";
import { Projectile } from "../entities/Projectile";
import { Enemy } from "../entities/Enemy";
import type { GameState } from "../state/GameState";
import type { SfxManager } from "./SfxManager";

const ARROW_SPEED = 560;
const MAGIC_SPEED = 380;
const MAX_PROJECTILES = 100;

const MAGIC_TINT = 0xc47aff;

/** 화살/마법구를 풀링 발사하고, 적과의 충돌·광역 피해를 처리한다. */
export class ProjectileManager {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly getEnemies: () => Phaser.Physics.Arcade.Group;
  private readonly sfx: SfxManager;
  private readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    getEnemies: () => Phaser.Physics.Arcade.Group,
    sfx: SfxManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.getEnemies = getEnemies;
    this.sfx = sfx;
    this.ensureEffectAnimations();
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: MAX_PROJECTILES,
      runChildUpdate: true,
    });

    scene.physics.add.overlap(
      this.group,
      getEnemies(),
      this.onHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  fireArrow(x: number, y: number, targetX: number, targetY: number, damage: number): void {
    const angle = Math.atan2(targetY - y, targetX - x);
    const p = this.group.get(x, y, TEX.arrow) as Projectile | null;
    if (!p) return;
    this.sfx.play("bowAttack");
    p.fire({
      x,
      y,
      angle,
      speed: ARROW_SPEED,
      damage,
      aoe: 0,
      texture: TEX.arrow,
      scale: 2.4,
      tint: 0xffffff,
      maxRange: 420,
      rotateToDir: true,
      bodyRadius: 8,
    });
  }

  fireMagic(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    damage: number,
    aoeRadius: number,
  ): void {
    const angle = Math.atan2(targetY - y, targetX - x);
    const p = this.group.get(x, y, TEX.wizardExplosionEffect) as Projectile | null;
    if (!p) return;
    this.sfx.play("magicCast");
    p.fire({
      x,
      y,
      angle,
      speed: MAGIC_SPEED,
      damage,
      aoe: aoeRadius,
      texture: TEX.wizardExplosionEffect,
      frame: MAGIC_PROJECTILE_FRAME,
      scale: 1.6,
      tint: 0xffffff,
      maxRange: 400,
      rotateToDir: true,
      bodyRadius: 8,
    });
  }

  private ensureEffectAnimations(): void {
    if (
      this.scene.textures.exists(TEX.wizardExplosionEffect) &&
      !this.scene.anims.exists(EFFECT_ANIM.wizardExplosion)
    ) {
      const img = this.scene.textures.get(TEX.wizardExplosionEffect).getSourceImage() as HTMLImageElement;
      const frameTotal = Math.max(1, Math.floor(img.width / 100));
      this.scene.anims.create({
        key: EFFECT_ANIM.wizardExplosion,
        frames: this.scene.anims.generateFrameNumbers(TEX.wizardExplosionEffect, {
          start: 0,
          end: frameTotal - 1,
        }),
        frameRate: 18,
        repeat: 0,
      });
    }
  }

  private onHit(p: Projectile, e: Enemy): void {
    if (!p.active || !e.targetable) return;

    if (p.aoe > 0) {
      this.explode(p.x, p.y, p.aoe, p.damage);
    } else {
      const killed = e.takeDamage(p.damage);
      this.sfx.play(killed ? "enemyDeath" : "hitFlesh");
      if (killed) this.state.addKill(e.def.score);
    }
    p.deactivate();
  }

  /** 착탄 지점 반경 내 모든 적에게 피해를 주고 폭발 이펙트를 띄운다. */
  private explode(cx: number, cy: number, radius: number, damage: number): void {
    this.sfx.play("magicExplosion");
    for (const obj of this.getEnemies().getChildren()) {
      const e = obj as Enemy;
      if (!e.targetable) continue;
      if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= radius) {
        const killed = e.takeDamage(damage);
        this.sfx.play(killed ? "enemyDeath" : "hitFlesh");
        if (killed) this.state.addKill(e.def.score);
      }
    }
    this.spawnExplosion(cx, cy, radius);
  }

  private spawnExplosion(cx: number, cy: number, radius: number): void {
    if (
      this.scene.textures.exists(TEX.wizardExplosionEffect) &&
      this.scene.anims.exists(EFFECT_ANIM.wizardExplosion)
    ) {
      const effect = this.scene.add
        .sprite(cx, cy, TEX.wizardExplosionEffect, 0)
        .setOrigin(0.5)
        .setScale(Math.max(1.6, radius / 38))
        .setDepth(23)
        .setBlendMode(Phaser.BlendModes.ADD);
      effect.play(EFFECT_ANIM.wizardExplosion, true);
      effect.once(`animationcomplete-${EFFECT_ANIM.wizardExplosion}`, () => effect.destroy());
      return;
    }

    const ring = this.scene.add
      .circle(cx, cy, radius, MAGIC_TINT, 0.55)
      .setDepth(23)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: ring,
      scale: { from: 0.5, to: 1.6 },
      alpha: { from: 0.7, to: 0 },
      duration: 340,
      ease: "Quad.out",
      onComplete: () => ring.destroy(),
    });

    const core = this.scene.add
      .circle(cx, cy, radius * 0.55, 0xffffff, 0.6)
      .setDepth(23)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: core,
      scale: { from: 0.6, to: 1.2 },
      alpha: { from: 0.7, to: 0 },
      duration: 220,
      ease: "Quad.out",
      onComplete: () => core.destroy(),
    });
  }
}
