import Phaser from "phaser";
import {
  CLASS_ANIM,
  CLASS_DEFS,
  CLASS_FRAME,
  CLASS_SCALE,
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
import { GameHud } from "../hud/GameHud";
import { PauseMenu } from "../hud/PauseMenu";
import { GameState } from "../state/GameState";
import { Enemy, ensureEnemyAnimations } from "../entities/Enemy";
import { ensureMercAnimations } from "../entities/Mercenary";
import { WaveManager } from "../systems/WaveManager";
import { ProjectileManager } from "../systems/ProjectileManager";
import { MercManager } from "../systems/MercManager";

const GAME_EXIT_EVENT = "game:exit";
const TORCH_ANIM_KEY = "torch-burn";
const HURT_IFRAME_MS = 700;

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
  private hud?: GameHud;
  private pauseMenu?: PauseMenu;
  private paused = false;
  private hurtCooldown = 0;
  private state!: GameState;
  private waves?: WaveManager;
  private projectiles?: ProjectileManager;
  private mercs?: MercManager;
  private facing: Facing = "down";
  private usingClass = false;
  private attacking = false;
  private footOffset = HERO_FRAME.height * TILE_SCALE * 0.42;

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

    this.state = new GameState();

    this.createInfiniteFloor();
    this.registerAnimations();
    ensureEnemyAnimations(this);
    ensureMercAnimations(this);
    this.spawnAmbientTorches();
    this.spawnPlayer();
    this.drawVignette();
    this.buildHud();
    this.setupInput();

    this.waves = new WaveManager(this, this.state, () => this.player);
    this.projectiles = new ProjectileManager(this, this.state, () => this.waves!.enemies);
    this.mercs = new MercManager(
      this,
      this.state,
      () => this.player,
      () => this.waves!.enemies,
      this.projectiles,
      (targetX) => this.triggerAttackAnim(targetX),
    );

    // 적과 몸이 닿으면 플레이어가 접촉 피해를 입는다.
    this.physics.add.overlap(
      this.player,
      this.waves.enemies,
      this.onEnemyContact as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.pauseMenu = new PauseMenu(
      this,
      () => this.setPaused(false),
      () => window.dispatchEvent(new CustomEvent(GAME_EXIT_EVENT)),
    );
    this.pauseMenu.build();

    this.input.keyboard?.on("keydown-ESC", () => this.togglePause());
  }

  private togglePause(): void {
    this.setPaused(!this.paused);
  }

  private setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;

    if (paused) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.physics.world.pause();
      this.pauseMenu?.show();
    } else {
      this.physics.world.resume();
      this.pauseMenu?.hide();
    }
  }

  /** 적과 겹칠 때 호출. 무적 시간이 끝났을 때만 해당 적의 피해량만큼 체력을 깎는다. */
  private onEnemyContact(
    _player: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    if (this.paused || this.hurtCooldown > 0 || this.state.over) return;
    const enemy = enemyObj as Enemy;
    if (!enemy.targetable) return;

    this.hurtCooldown = HURT_IFRAME_MS;
    this.state.damagePlayer(enemy.damage);
    this.flashPlayerHurt();
  }

  /** 피격 피드백: 플레이어를 붉게 깜빡이고 카메라를 살짝 흔든다. */
  private flashPlayerHurt(): void {
    this.player.setTint(0xff6b6b);
    this.cameras.main.shake(120, 0.006);
    this.time.delayedCall(140, () => this.player.clearTint());
  }

  update(_time: number, delta: number): void {
    if (!this.keys || !this.player) return;
    if (this.paused) return;

    if (this.hurtCooldown > 0) this.hurtCooldown -= delta;

    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      body.setVelocity((dx / len) * PLAYER_SPEED, (dy / len) * PLAYER_SPEED);
      if (this.usingClass) {
        if (dx < 0) this.player.setFlipX(true);
        else if (dx > 0) this.player.setFlipX(false);
        // 공격 모션 재생 중에는 idle/walk 로 덮어쓰지 않는다.
        if (!this.attacking) this.player.play(CLASS_ANIM.walk, true);
      } else {
        this.updateFacing(dx, dy);
      }
    } else {
      body.setVelocity(0, 0);
      if (this.usingClass && !this.attacking) this.player.play(CLASS_ANIM.idle, true);
    }

    this.shadow.setPosition(this.player.x, this.player.y + this.footOffset);

    this.floor.tilePositionX = this.cameras.main.scrollX;
    this.floor.tilePositionY = this.cameras.main.scrollY;

    this.state.tick(delta);
    this.waves?.update(delta);
    this.mercs?.update(delta);
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

    const classId = this.registry.get("classId") as string | null;
    const classDef = classId ? CLASS_DEFS[classId] : undefined;
    if (classDef && this.textures.exists(TEX.classIdle) && !this.anims.exists(CLASS_ANIM.idle)) {
      this.anims.create({
        key: CLASS_ANIM.idle,
        frames: this.anims.generateFrameNumbers(TEX.classIdle, {
          start: 0,
          end: classDef.idleFrames - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (classDef && this.textures.exists(TEX.classWalk) && !this.anims.exists(CLASS_ANIM.walk)) {
      this.anims.create({
        key: CLASS_ANIM.walk,
        frames: this.anims.generateFrameNumbers(TEX.classWalk, {
          start: 0,
          end: classDef.walkFrames - 1,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (classDef && this.textures.exists(TEX.classAttack) && !this.anims.exists(CLASS_ANIM.attack)) {
      const img = this.textures.get(TEX.classAttack).getSourceImage() as HTMLImageElement;
      const frameTotal = Math.max(1, Math.floor(img.width / CLASS_FRAME.width));
      this.anims.create({
        key: CLASS_ANIM.attack,
        frames: this.anims.generateFrameNumbers(TEX.classAttack, {
          start: 0,
          end: frameTotal - 1,
        }),
        frameRate: 18,
        repeat: 0,
      });
    }
  }

  /** 플레이어가 공격할 때 직업 공격 모션을 1회 재생한다(이동 애니메이션을 잠시 막는다). */
  triggerAttackAnim(targetX: number): void {
    if (!this.usingClass || this.attacking || !this.anims.exists(CLASS_ANIM.attack)) return;
    this.player.setFlipX(targetX < this.player.x);
    this.attacking = true;
    this.player.play(CLASS_ANIM.attack, true);
    this.player.once("animationcomplete-" + CLASS_ANIM.attack, () => {
      this.attacking = false;
    });
  }

  /** 플레이어 = 선택한 직업 캐릭터(이동 + 자동 공격). 1명으로 시작한다. */
  private spawnPlayer(): void {
    this.usingClass = this.anims.exists(CLASS_ANIM.idle) && this.textures.exists(TEX.classIdle);

    if (this.usingClass) {
      this.spawnClassPlayer();
      return;
    }

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

  private spawnClassPlayer(): void {
    const feetY = 58;
    const feetRatio = feetY / CLASS_FRAME.height;
    this.footOffset = 4;

    this.shadow = this.add
      .image(0, 0, TEX.heroShadow)
      .setOrigin(0.5, 0.875)
      .setScale(TILE_SCALE * 1.5)
      .setAlpha(0.5)
      .setDepth(19);

    this.player = this.physics.add.sprite(0, 0, TEX.classIdle, 0);
    this.player.setScale(CLASS_SCALE);
    this.player.setDepth(20);
    this.player.setOrigin(0.5, feetRatio);
    this.player.play(CLASS_ANIM.idle);

    const bodyW = 22;
    const bodyH = 20;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyW, bodyH);
    body.setOffset((CLASS_FRAME.width - bodyW) / 2, feetY - bodyH);
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

  private buildHud(): void {
    this.hud = new GameHud(this, this.state);
    this.hud.build();

    // 파티 0번 = 플레이어 자신(선택한 직업). 추가 용병은 카드로 고용된다.
    const classId = this.registry.get("classId") as string | null;
    this.state.addMerc(classId ?? "sword");
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
