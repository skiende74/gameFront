import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  HERO_ANIM,
  HERO_FRAME,
  HEX,
  PLAYER_SPEED,
  TEX,
  TILE_DRAW,
  TILE_SCALE,
  TORCH_FRAMES,
  WORLD_BOUNDARY,
} from "../config";

const GAME_EXIT_EVENT = "game:exit";
const TORCH_ANIM_KEY = "torch-burn";

type WasdKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
};

type Facing = "down" | "up" | "side";

export class DungeonScene extends Phaser.Scene {
  private floor!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private keys?: WasdKeys;
  private coordText?: Phaser.GameObjects.Text;
  private facing: Facing = "down";

  constructor() {
    super({ key: "DungeonScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(HEX.bg);
    this.cameras.main.setBounds(
      -WORLD_BOUNDARY / 2,
      -WORLD_BOUNDARY / 2,
      WORLD_BOUNDARY,
      WORLD_BOUNDARY,
    );

    this.createInfiniteFloor();
    this.registerAnimations();
    this.spawnAmbientTorches();
    this.spawnPlayer();
    this.drawVignette();
    this.drawHud();
    this.setupInput();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.input.keyboard?.on("keydown-ESC", () => {
      window.dispatchEvent(new CustomEvent(GAME_EXIT_EVENT));
    });
  }

  update(_time: number, delta: number): void {
    if (!this.keys || !this.player) return;

    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      body.setVelocity((dx / len) * PLAYER_SPEED, (dy / len) * PLAYER_SPEED);
      this.updateFacing(dx, dy);
    } else {
      body.setVelocity(0, 0);
    }

    this.shadow.setPosition(this.player.x, this.player.y + HERO_FRAME.height * TILE_SCALE * 0.42);

    this.floor.tilePositionX = this.cameras.main.scrollX;
    this.floor.tilePositionY = this.cameras.main.scrollY;

    if (this.coordText) {
      const x = Math.round(this.player.x);
      const y = Math.round(this.player.y);
      this.coordText.setText(`X: ${x.toLocaleString()} / Y: ${y.toLocaleString()}`);
    }

    // delta is unused for now (Arcade physics handles dt), keep param for the
    // signature so we don't have to widen it later.
    void delta;
  }

  private createInfiniteFloor(): void {
    const useBaked = this.textures.exists(TEX.floorPatch);
    const key = useBaked ? TEX.floorPatch : TEX.procFloor;

    this.floor = this.add
      .tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, key)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(0);

    if (!useBaked) {
      this.floor.tileScaleX = TILE_SCALE;
      this.floor.tileScaleY = TILE_SCALE;
    }
  }

  private registerAnimations(): void {
    if (this.textures.exists(TEX.torchStrip) && !this.anims.exists(TORCH_ANIM_KEY)) {
      this.anims.create({
        key: TORCH_ANIM_KEY,
        frames: TORCH_FRAMES.map((f) => ({ key: TEX.torchStrip, frame: f })),
        frameRate: 8,
        repeat: -1,
      });
    }

    const idleAnim = (key: string, texKey: string) => {
      if (this.anims.exists(key) || !this.textures.exists(texKey)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(texKey, {
          start: 0,
          end: HERO_FRAME.frameCount - 1,
        }),
        frameRate: 6,
        repeat: -1,
      });
    };
    idleAnim(HERO_ANIM.idleDown, TEX.heroIdleDown);
    idleAnim(HERO_ANIM.idleUp, TEX.heroIdleUp);
    idleAnim(HERO_ANIM.idleSide, TEX.heroIdleSide);
  }

  private spawnPlayer(): void {
    this.shadow = this.add
      .image(0, 0, TEX.heroShadow)
      .setOrigin(0.5, 0.5)
      .setScale(TILE_SCALE)
      .setAlpha(0.55)
      .setDepth(19);

    this.player = this.physics.add.sprite(0, 0, TEX.heroIdleDown, 0);
    this.player.setScale(TILE_SCALE);
    this.player.setDepth(20);
    this.player.setOrigin(0.5, 0.5);
    this.player.play(HERO_ANIM.idleDown);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 18);
    body.setOffset((HERO_FRAME.width - 16) / 2, HERO_FRAME.height - 22);
    body.setCollideWorldBounds(false);
  }

  private updateFacing(dx: number, dy: number): void {
    let next: Facing;
    if (Math.abs(dx) >= Math.abs(dy)) {
      next = "side";
      this.player.setFlipX(dx < 0);
    } else {
      next = dy > 0 ? "down" : "up";
      this.player.setFlipX(false);
    }
    if (next === this.facing) return;
    this.facing = next;
    const animKey =
      next === "down" ? HERO_ANIM.idleDown : next === "up" ? HERO_ANIM.idleUp : HERO_ANIM.idleSide;
    this.player.play(animKey, true);
  }

  /** Atmospheric torches placed in world space around origin. They scroll with the camera. */
  private spawnAmbientTorches(): void {
    const ringRadius = 360;
    const positions = [
      { x: -ringRadius, y: -ringRadius * 0.6 },
      { x: ringRadius, y: -ringRadius * 0.6 },
      { x: -ringRadius * 0.4, y: ringRadius * 0.7 },
      { x: ringRadius * 0.4, y: ringRadius * 0.7 },
      { x: 0, y: -ringRadius * 1.2 },
    ];
    for (const p of positions) this.spawnTorch(p.x, p.y);
  }

  private spawnTorch(worldX: number, worldY: number): void {
    if (this.textures.exists(TEX.torchStrip)) {
      const sprite = this.add
        .sprite(worldX, worldY, TEX.torchStrip, 0)
        .setOrigin(0.5, 1)
        .setScale(TILE_SCALE)
        .setDepth(10);
      sprite.play(TORCH_ANIM_KEY);
    }

    const glow = this.add.circle(worldX, worldY - TILE_DRAW * 0.4, 110, 0xff7a3a, 0.22);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(9);
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.18 },
      alpha: { from: 0.22, to: 0.38 },
      duration: 420 + Math.random() * 220,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    if (this.textures.exists(TEX.flameParticle)) {
      const emitter = this.add.particles(worldX, worldY - TILE_DRAW * 0.6, TEX.flameParticle, {
        lifespan: 600,
        speedY: { min: -40, max: -80 },
        speedX: { min: -8, max: 8 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.75, end: 0 },
        tint: [0xffb066, 0xff7a3a],
        blendMode: Phaser.BlendModes.ADD,
        frequency: 70,
        quantity: 1,
      });
      emitter.setDepth(11);
    }
  }

  private drawVignette(): void {
    if (!this.textures.exists(TEX.vignette)) return;
    this.add
      .image(0, 0, TEX.vignette)
      .setOrigin(0, 0)
      .setDepth(18)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  private drawHud(): void {
    const cx = GAME_WIDTH / 2;
    const fix = (t: Phaser.GameObjects.Text) => t.setScrollFactor(0).setDepth(30);

    fix(
      this.add
        .text(
          cx,
          GAME_HEIGHT - 28,
          "[WASD / 방향키] 이동 · [ESC] 타이틀로 돌아가기",
          {
            fontFamily: "Galmuri11, monospace",
            fontSize: "13px",
            color: HEX.ash,
          },
        )
        .setOrigin(0.5)
        .setShadow(0, 1, "#000", 3, true, true),
    );

    this.coordText = this.add
      .text(GAME_WIDTH - 20, 20, "X: 0 / Y: 0", {
        fontFamily: "Galmuri11, monospace",
        fontSize: "14px",
        color: HEX.ash,
      })
      .setOrigin(1, 0)
      .setShadow(0, 1, "#000", 3, true, true);
    fix(this.coordText);
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      w: kb.addKey(K.W),
      a: kb.addKey(K.A),
      s: kb.addKey(K.S),
      d: kb.addKey(K.D),
    };
  }
}
