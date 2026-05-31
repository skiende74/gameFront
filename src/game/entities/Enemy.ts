import Phaser from "phaser";
import {
  ENEMY_FRAME,
  ENEMY_IDS,
  enemyAnimKey,
  enemyTex,
  type EnemyDef,
} from "../data/enemies";

const ENEMY_DEPTH = 15;

/**
 * 적 유닛. 객체 풀(Physics Group)에서 재사용되며, 활성 상태일 때
 * 매 프레임 플레이어를 추적한다. 사망 애니메이션 후 비활성화되어 풀로 돌아간다.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def!: EnemyDef;
  hp = 0;
  speed = 0;
  damage = 0;
  private dying = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  /** 풀에서 꺼내 특정 종류로 초기화하고 화면에 배치한다. */
  spawn(def: EnemyDef, x: number, y: number): void {
    this.def = def;
    this.hp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.dying = false;

    this.setTexture(enemyTex(def.id, "walk"));
    this.setPosition(x, y);
    this.setScale(def.scale);
    this.setOrigin(0.5, def.feetRatio);
    this.setDepth(ENEMY_DEPTH);
    this.setAlpha(1);
    this.clearTint();
    this.setActive(true);
    this.setVisible(true);
    this.play(enemyAnimKey(def.id, "walk"), true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setSize(def.body.w, def.body.h);
    body.setOffset(
      (ENEMY_FRAME.width - def.body.w) / 2,
      def.feetRatio * ENEMY_FRAME.height - def.body.h,
    );
  }

  /** 플레이어 좌표를 향해 이동. WaveManager 가 매 프레임 호출한다. */
  chase(targetX: number, targetY: number): void {
    if (!this.active || this.dying) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    this.setFlipX(targetX < this.x);
  }

  /** 공격 대상으로 삼을 수 있는 상태인지(활성 + 사망 진행 중 아님). */
  get targetable(): boolean {
    return this.active && !this.dying;
  }

  /** 피해를 입는다. 체력이 0 이하가 되면 사망 처리하고 true 를 반환. */
  takeDamage(amount: number): boolean {
    if (!this.targetable) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    this.playHurt();
    return false;
  }

  private playHurt(): void {
    const hurtKey = enemyAnimKey(this.def.id, "hurt");
    if (!this.scene.anims.exists(hurtKey)) return;
    this.off(`animationcomplete-${hurtKey}`);
    this.play(hurtKey, true);
    this.once(`animationcomplete-${hurtKey}`, () => {
      if (this.targetable) this.play(enemyAnimKey(this.def.id, "walk"), true);
    });
  }

  private die(): void {
    this.dying = true;
    this.off(`animationcomplete-${enemyAnimKey(this.def.id, "hurt")}`);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    const deathKey = enemyAnimKey(this.def.id, "death");
    if (this.scene.anims.exists(deathKey)) {
      this.play(deathKey, true);
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.deactivate());
    } else {
      this.deactivate();
    }
  }

  private deactivate(): void {
    this.clearTint();
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}

/**
 * 적 애니메이션을 1회 등록한다. 스프라이트시트 프레임 수가 종류마다 달라
 * 텍스처 실제 너비에서 프레임 수를 동적으로 계산한다.
 */
export function ensureEnemyAnimations(scene: Phaser.Scene): void {
  const kinds: Array<"idle" | "walk" | "hurt" | "death"> = ["idle", "walk", "hurt", "death"];
  for (const id of ENEMY_IDS) {
    for (const kind of kinds) {
      const tex = enemyTex(id, kind);
      const key = enemyAnimKey(id, kind);
      if (!scene.textures.exists(tex) || scene.anims.exists(key)) continue;

      const source = scene.textures.get(tex).getSourceImage() as HTMLImageElement;
      const frameCount = Math.max(1, Math.floor(source.width / ENEMY_FRAME.width));
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: frameCount - 1 }),
        frameRate: kind === "walk" ? 10 : 8,
        repeat: kind === "idle" || kind === "walk" ? -1 : 0,
      });
    }
  }
}
