import Phaser from "phaser";
import { CLASS_DEFS } from "../config";
import {
  MERC_COMBAT,
  mercAnimKey,
  mercIdleTex,
  mercWalkTex,
  type MercCombat,
} from "../data/mercs";

const MERC_DEPTH = 18;
const FOLLOW_LERP = 0.24;
const MOVE_EPSILON = 3;

/** 플레이어를 따라다니며 자동 전투하는 용병 1기(시각/이동 담당). 전투 판정은 MercManager 가 조율. */
export class Mercenary extends Phaser.GameObjects.Sprite {
  readonly mercId: string;
  readonly combat: MercCombat;
  private cooldownLeft = 0;
  private moving = false;

  constructor(scene: Phaser.Scene, id: string) {
    super(scene, 0, 0, mercIdleTex(id), 0);
    this.mercId = id;
    this.combat = MERC_COMBAT[id];

    scene.add.existing(this);
    this.setScale(this.combat.scale);
    this.setOrigin(0.5, this.combat.feetRatio);
    this.setDepth(MERC_DEPTH);
    this.play(mercAnimKey(id, "idle"), true);
  }

  /** 목표 위치로 부드럽게 이동하고 idle/walk 애니메이션을 전환한다. */
  steer(targetX: number, targetY: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > MOVE_EPSILON) {
      this.x += dx * FOLLOW_LERP;
      this.y += dy * FOLLOW_LERP;
      if (Math.abs(dx) > 0.5) this.setFlipX(dx < 0);
      if (!this.moving) {
        this.moving = true;
        this.play(mercAnimKey(this.mercId, "walk"), true);
      }
    } else if (this.moving) {
      this.moving = false;
      this.play(mercAnimKey(this.mercId, "idle"), true);
    }
  }

  faceTo(targetX: number): void {
    if (Math.abs(targetX - this.x) > 0.5) this.setFlipX(targetX < this.x);
  }

  tickCooldown(deltaMs: number): void {
    if (this.cooldownLeft > 0) this.cooldownLeft -= deltaMs;
  }

  get ready(): boolean {
    return this.cooldownLeft <= 0;
  }

  resetCooldown(cooldownMs = this.combat.cooldownMs): void {
    this.cooldownLeft = cooldownMs;
  }

  /** 공격 순간의 가벼운 시각 피드백(살짝 커졌다 돌아옴). */
  playAttackCue(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: this.combat.scale * 1.35, to: this.combat.scale },
      scaleY: { from: this.combat.scale * 1.35, to: this.combat.scale },
      duration: 200,
      ease: "Quad.out",
    });
  }
}

/** 4직업 용병의 idle/walk 애니메이션을 1회 등록한다. */
export function ensureMercAnimations(scene: Phaser.Scene): void {
  for (const id of Object.keys(MERC_COMBAT)) {
    const def = CLASS_DEFS[id];

    const idleKey = mercAnimKey(id, "idle");
    if (scene.textures.exists(mercIdleTex(id)) && !scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: scene.anims.generateFrameNumbers(mercIdleTex(id), {
          start: 0,
          end: def.idleFrames - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    const walkKey = mercAnimKey(id, "walk");
    if (scene.textures.exists(mercWalkTex(id)) && !scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: scene.anims.generateFrameNumbers(mercWalkTex(id), {
          start: 0,
          end: def.walkFrames - 1,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }
  }
}
