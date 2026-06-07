import Phaser from "phaser";

export type ProjectileConfig = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  /** 0 이면 단일 타격, >0 이면 착탄 시 광역 피해 반경(px) */
  aoe: number;
  texture: string;
  frame?: number;
  scale: number;
  tint: number;
  maxRange: number;
  rotateToDir: boolean;
  animKey?: string;
  /** 충돌 판정용 원형 반경(텍스처 px 기준, 스프라이트 스케일이 곱해짐). */
  bodyRadius: number;
};

const PROJECTILE_DEPTH = 22;

/** 풀링되는 투사체(화살/마법구). 사거리를 넘으면 스스로 비활성화된다. */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  aoe = 0;
  private startX = 0;
  private startY = 0;
  private maxRange = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  fire(cfg: ProjectileConfig): void {
    this.damage = cfg.damage;
    this.aoe = cfg.aoe;
    this.startX = cfg.x;
    this.startY = cfg.y;
    this.maxRange = cfg.maxRange;

    this.setTexture(cfg.texture);
    if (cfg.frame !== undefined) this.setFrame(cfg.frame);
    this.setPosition(cfg.x, cfg.y);
    this.setScale(cfg.scale);
    this.setTint(cfg.tint);
    this.setDepth(PROJECTILE_DEPTH);
    this.setRotation(cfg.rotateToDir ? cfg.angle : 0);
    this.anims.stop();
    if (cfg.animKey && this.scene.anims.exists(cfg.animKey)) this.play(cfg.animKey, true);
    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    // 프레임 전체가 아닌 실제 투사체 크기에 맞춘 작은 원형 충돌 박스 (프레임 중앙 정렬)
    const r = Math.min(cfg.bodyRadius, this.width / 2, this.height / 2);
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
    body.setVelocity(Math.cos(cfg.angle) * cfg.speed, Math.sin(cfg.angle) * cfg.speed);
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    body.setVelocity(0, 0);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y) > this.maxRange) {
      this.deactivate();
    }
  }
}
