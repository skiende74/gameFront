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
import { GameOverMenu } from "../hud/GameOverMenu";
import { TutorialGuide } from "../hud/TutorialGuide";
import {
  GAME_EVENT,
  GameState,
  type BossStartPayload,
  type GameOverPayload,
  type UpgradeRequestPayload,
} from "../state/GameState";
import { Enemy, ensureEnemyAnimations } from "../entities/Enemy";
import { enemyAnimKey, enemyEffectAnimKey, enemyEffectTex } from "../data/enemies";
import { ensureMercAnimations } from "../entities/Mercenary";
import { WaveManager } from "../systems/WaveManager";
import { ProjectileManager } from "../systems/ProjectileManager";
import { MercManager } from "../systems/MercManager";
import { SfxManager } from "../systems/SfxManager";
import { getUpgrade, type UpgradeId } from "../data/upgrades";

const GAME_EXIT_EVENT = "game:exit";
const UPGRADE_REQUEST_EVENT = "game:upgrade-request";
const UPGRADE_SELECTED_EVENT = "game:upgrade-selected";
const UPGRADE_REROLL_EVENT = "game:upgrade-reroll";
const DEV_WAVE_SEC_EVENT = "game:dev-wave-sec-change";
const TORCH_ANIM_KEY = "torch-burn";
/**
 * 피격 사이의 짧은 전역 최소 간격(ms).
 * 무적은 적 개체별 쿨다운(Enemy.canHitPlayer)으로 관리하고,
 * 이 값은 한 프레임에 다수의 적이 동시에 닿아 즉사하는 것만 방지한다.
 * 둘러싸이면 여러 적이 번갈아 때려 실제로 더 위험해진다.
 */
const HIT_GLOBAL_GAP_MS = 160;

/** 보스 공격: 사거리(px) / 쿨타임(ms) / 모션 시작 후 타격 판정까지(ms). */
const BOSS_ATTACK_RANGE = 132;
const BOSS_ATTACK_COOLDOWN_MS = 1500;
const BOSS_ATTACK_WINDUP_MS = 320;

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
  private overMenu?: GameOverMenu;
  private tutorial?: TutorialGuide;
  private paused = false;
  private gameOver = false;
  private waitingForUpgrade = false;
  private upgradeOverlay?: Phaser.GameObjects.Container;
  private upgradeSelectedHandler?: EventListener;
  private upgradeRerollHandler?: EventListener;
  private devWaveSecHandler?: EventListener;
  private hurtCooldown = 0;
  private state!: GameState;
  private waves?: WaveManager;
  private projectiles?: ProjectileManager;
  private mercs?: MercManager;
  private sfx!: SfxManager;
  private boss?: Enemy;
  private bossAura?: Phaser.GameObjects.Container;
  private bossAttackCooldown = 0;
  private bossAttacking = false;
  private facing: Facing = "down";
  private usingClass = false;
  private attacking = false;
  private hurting = false;
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

    const devWaveSec = this.registry.get("devWaveSec");
    this.state = new GameState({
      waveSec: typeof devWaveSec === "number" ? devWaveSec : undefined,
    });

    this.createInfiniteFloor();
    this.registerAnimations();
    ensureEnemyAnimations(this);
    ensureMercAnimations(this);
    this.spawnAmbientTorches();
    this.spawnPlayer();
    this.drawVignette();
    this.buildHud();
    this.setupInput();
    this.sfx = new SfxManager(this);

    this.waves = new WaveManager(this, this.state, () => this.player);
    this.projectiles = new ProjectileManager(this, this.state, () => this.waves!.enemies, this.sfx);
    this.mercs = new MercManager(
      this,
      this.state,
      () => this.player,
      () => this.waves!.enemies,
      this.projectiles,
      this.sfx,
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

    this.overMenu = new GameOverMenu(
      this,
      () => this.scene.restart(),
      () => window.dispatchEvent(new CustomEvent(GAME_EXIT_EVENT)),
    );
    this.overMenu.build();
    this.state.on(GAME_EVENT.over, this.onGameOver, this);
    this.state.on(GAME_EVENT.upgradeRequest, this.onUpgradeRequest, this);
    this.state.on(GAME_EVENT.bossStart, this.onBossStart, this);
    this.state.on(GAME_EVENT.bossEnd, this.onBossEnd, this);

    this.input.keyboard?.on("keydown-ESC", () => this.togglePause());

    this.upgradeSelectedHandler = (event) => {
      const detail = (event as CustomEvent<{ upgradeId?: string }>).detail;
      this.completeUpgradeWait(detail?.upgradeId);
    };
    window.addEventListener(UPGRADE_SELECTED_EVENT, this.upgradeSelectedHandler);

    this.upgradeRerollHandler = (event) => {
      if (!this.waitingForUpgrade || this.gameOver) return;
      const cost = (event as CustomEvent<{ cost?: number }>).detail?.cost ?? 0;
      const ok = this.state.spendScore(cost);
      this.sfx.play(ok ? "uiConfirm" : "uiDenied");
    };
    window.addEventListener(UPGRADE_REROLL_EVENT, this.upgradeRerollHandler);

    if (this.registry.get("devMode") === true) {
      this.devWaveSecHandler = (event) => {
        const detail = (event as CustomEvent<{ waveSec?: number }>).detail;
        if (typeof detail?.waveSec === "number") this.state.setWaveSec(detail.waveSec);
      };
      window.addEventListener(DEV_WAVE_SEC_EVENT, this.devWaveSecHandler);
    }
    this.events.once("shutdown", this.cleanupScene, this);
    this.events.once("destroy", this.cleanupScene, this);

    if (this.registry.get("tutorial") === true) this.startTutorial();
  }

  /** 튜토리얼 모드: 자동 진행을 끄고 안내 가이드를 시작한다. */
  private startTutorial(): void {
    this.state.autoProgress = false;
    if (this.waves) this.waves.spawnEnabled = false;

    this.tutorial = new TutorialGuide(this, this.hud!, {
      enableSpawn: () => {
        if (this.waves) this.waves.spawnEnabled = true;
      },
      forceCard: () => this.state.forceUpgradeRequest(),
      exit: () => window.dispatchEvent(new CustomEvent(GAME_EXIT_EVENT)),
    });
    this.tutorial.start();
  }

  private onGameOver(payload: GameOverPayload): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.waitingForUpgrade = false;
    this.hideUpgradeWait();
    this.clearBossVisuals();
    this.hud?.hideBossBar();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    if (!payload.victory) this.playPlayerDeath();
    else this.sfx.play("victory");
    this.physics.world.pause();
    this.pauseMenu?.hide();

    this.overMenu?.show({
      victory: payload.victory,
      elapsedSec: this.state.elapsedSec,
      kills: this.state.kills,
      score: this.state.score,
      finalScore: this.state.finalScore,
      wave: this.state.wave,
    });
  }

  private togglePause(): void {
    if (this.gameOver || this.waitingForUpgrade) return;
    this.setPaused(!this.paused);
  }

  private setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;

    if (paused) {
      this.sfx.play("pause");
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.physics.world.pause();
      this.pauseMenu?.show();
    } else {
      this.sfx.play("unpause");
      this.physics.world.resume();
      this.pauseMenu?.hide();
    }
  }

  /** 적과 겹칠 때 호출. 전역 최소 간격 + 적 개체별 쿨다운을 모두 통과하면 그 적의 피해량만큼 깎는다. */
  private onEnemyContact(
    _player: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    if (this.paused || this.waitingForUpgrade || this.hurtCooldown > 0 || this.state.over) return;
    const enemy = enemyObj as Enemy;
    if (!enemy.targetable) return;
    // 보스는 접촉 피해 대신 공격 모션으로만 타격한다.
    if (enemy.def.boss) return;

    // 적 개체별 쿨다운: 같은 적은 일정 시간 안에 다시 때리지 못한다.
    const now = this.time.now;
    if (!enemy.canHitPlayer(now)) return;
    enemy.registerPlayerHit(now);

    this.hurtCooldown = HIT_GLOBAL_GAP_MS;
    this.state.damagePlayer(enemy.damage);
    this.sfx.play("playerHurt");
    if (!this.state.over) this.flashPlayerHurt();
  }

  /** 피격 피드백: 직업 에셋의 Hurt 애니메이션을 재생하고 카메라를 살짝 흔든다. */
  private flashPlayerHurt(): void {
    this.cameras.main.shake(120, 0.006);
    if (!this.usingClass || !this.anims.exists(CLASS_ANIM.hurt)) {
      this.player.setTint(0xff6b6b);
      this.time.delayedCall(140, () => this.player.clearTint());
      return;
    }

    this.attacking = false;
    this.hurting = true;
    this.player.off(`animationcomplete-${CLASS_ANIM.hurt}`);
    this.player.play(CLASS_ANIM.hurt, true);
    this.player.once(`animationcomplete-${CLASS_ANIM.hurt}`, () => {
      this.hurting = false;
    });
  }

  update(_time: number, delta: number): void {
    if (!this.keys || !this.player) return;
    if (this.paused || this.gameOver || this.waitingForUpgrade) return;

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
      const speed = PLAYER_SPEED * this.state.playerSpeedMultiplier;
      body.setVelocity((dx / len) * speed, (dy / len) * speed);
      if (this.usingClass) {
        if (dx < 0) this.player.setFlipX(true);
        else if (dx > 0) this.player.setFlipX(false);
        // 공격/피격 모션 재생 중에는 idle/walk 로 덮어쓰지 않는다.
        if (!this.attacking && !this.hurting) this.player.play(CLASS_ANIM.walk, true);
      } else {
        this.updateFacing(dx, dy);
      }
    } else {
      body.setVelocity(0, 0);
      if (this.usingClass && !this.attacking && !this.hurting) this.player.play(CLASS_ANIM.idle, true);
    }

    this.shadow.setPosition(this.player.x, this.player.y + this.footOffset);

    this.floor.tilePositionX = this.cameras.main.scrollX;
    this.floor.tilePositionY = this.cameras.main.scrollY;

    this.state.tick(delta);
    this.waves?.update(delta);
    this.mercs?.update(delta);
    this.tutorial?.update(delta, moving);

    if (this.boss?.targetable) {
      this.hud?.updateBossHp(this.boss.hp);
      const c = this.boss.getCenter();
      this.bossAura?.setPosition(c.x, c.y);
      this.updateBossAttack(delta);
    }
  }

  /** 보스가 사거리 안에 들어오면 공격 모션을 재생하고, 모션 도중 타격 판정을 낸다. */
  private updateBossAttack(deltaMs: number): void {
    if (this.bossAttackCooldown > 0) this.bossAttackCooldown -= deltaMs;
    if (this.bossAttacking || this.paused || this.waitingForUpgrade || this.state.over) return;

    const boss = this.boss;
    if (!boss || this.bossAttackCooldown > 0) return;

    const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
    if (dist > BOSS_ATTACK_RANGE) return;
    this.performBossAttack(boss);
  }

  private performBossAttack(boss: Enemy): void {
    this.bossAttacking = true;
    this.bossAttackCooldown = BOSS_ATTACK_COOLDOWN_MS;
    boss.frozen = true;
    boss.setFlipX(this.player.x < boss.x);

    const attackKey = enemyAnimKey(boss.def.id, "attack");
    const hasAnim = this.anims.exists(attackKey);
    if (hasAnim) {
      boss.play(attackKey, true);
      this.playBossAttackEffect(boss);
      boss.once(`animationcomplete-${attackKey}`, () => this.endBossAttack(boss));
    } else {
      this.time.delayedCall(BOSS_ATTACK_WINDUP_MS + 220, () => this.endBossAttack(boss));
    }

    this.time.delayedCall(BOSS_ATTACK_WINDUP_MS, () => this.bossStrike(boss));
  }

  /** 보스 공격 모션에 맞춰 보스 위치에 전용 공격 이펙트(Split Effects)를 겹쳐 재생한다. */
  private playBossAttackEffect(boss: Enemy): void {
    const fxTex = enemyEffectTex(boss.def.id);
    const fxKey = enemyEffectAnimKey(boss.def.id);
    if (!this.textures.exists(fxTex) || !this.anims.exists(fxKey)) return;

    const fx = this.add
      .sprite(boss.x, boss.y, fxTex, 0)
      .setScale(boss.def.scale)
      .setOrigin(0.5, boss.def.feetRatio)
      .setFlipX(boss.flipX)
      .setDepth(boss.depth + 1);
    fx.play(fxKey, true);
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  /** 보스 타격 판정: 여전히 사거리 안이면 피해 + 임팩트 연출. */
  private bossStrike(boss: Enemy): void {
    if (!boss.targetable || this.state.over || this.paused) return;
    const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
    if (dist > BOSS_ATTACK_RANGE + 48) return;

    this.state.damagePlayer(boss.damage);
    this.sfx.play("playerHurt");
    if (!this.state.over) this.flashPlayerHurt();
    this.cameras.main.shake(170, 0.007);
  }

  private endBossAttack(boss: Enemy): void {
    this.bossAttacking = false;
    if (!boss.targetable) return;
    boss.frozen = false;
    boss.play(enemyAnimKey(boss.def.id, "walk"), true);
  }

  private onUpgradeRequest(payload: UpgradeRequestPayload): void {
    if (this.gameOver) return;
    this.waitingForUpgrade = true;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.physics.world.pause();
    this.showUpgradeWait(payload);
    this.sfx.play("uiConfirm");

    window.dispatchEvent(
      new CustomEvent(UPGRADE_REQUEST_EVENT, {
        detail: {
          ...payload,
          blockedHireIds: this.state.blockedHireIds,
          mercFull: this.state.mercFull,
          score: this.state.score,
        },
      }),
    );
  }

  private completeUpgradeWait(upgradeId?: string): void {
    if (!this.waitingForUpgrade || this.gameOver) return;
    if (upgradeId) this.applyUpgrade(upgradeId);
    this.waitingForUpgrade = false;
    this.hideUpgradeWait();
    this.state.completeUpgrade();
    this.physics.world.resume();
  }

  private applyUpgrade(upgradeId: string): void {
    const upgrade = getUpgrade(upgradeId);
    if (!upgrade) {
      this.sfx.play("uiDenied");
      return;
    }

    switch (upgrade.id as UpgradeId) {
      case "hire-sword":
        this.state.addMerc("sword");
        this.sfx.play("upgradeSelect");
        break;
      case "hire-bow":
        this.state.addMerc("bow");
        this.sfx.play("upgradeSelect");
        break;
      case "hire-mage":
        this.state.addMerc("mage");
        this.sfx.play("upgradeSelect");
        break;
      case "hire-cleric":
        this.state.addMerc("cleric");
        this.sfx.play("upgradeSelect");
        break;
      case "tactics":
        this.state.boostMercenaryDamage(0.1);
        this.sfx.play("atkBuff");
        break;
      case "haste":
        this.state.boostMercenaryAttackSpeed(0.1);
        this.sfx.play("speedBuff");
        break;
      case "agility":
        this.state.boostPlayerSpeed(0.1);
        this.sfx.play("speedBuff");
        break;
      case "first-aid":
        this.state.healPlayer(30);
        this.sfx.play("heal");
        break;
      case "defense":
        this.state.increaseMaxHp(20);
        this.sfx.play("maxHpBuff");
        break;
    }
  }

  /** 보스 라운드 시작: 보스 스폰 + 배너 + 체력바 + 보스 전용 연출. */
  private onBossStart(payload: BossStartPayload): void {
    if (this.gameOver) return;
    this.sfx.play("encounter");
    const boss = this.waves?.spawnBoss(payload.bossId);
    if (boss) {
      boss.onDeath = () => this.state.defeatBoss();
      this.boss = boss;
      this.attachBossAura(boss);
      this.hud?.showBossBar(boss.def.label, boss.maxHp);
      this.showBossBanner(boss.def.label);
    }
    this.cameras.main.shake(280, 0.008);
  }

  /** 보스 격파/종료: 연출·체력바·참조를 정리한다. */
  private onBossEnd(): void {
    this.clearBossVisuals();
    this.boss = undefined;
    this.bossAttacking = false;
    this.bossAttackCooldown = 0;
    this.hud?.hideBossBar();
  }

  /** 잡몹과 구분되도록 보스에 맥동하는 붉은 이중 오라를 입힌다. */
  private attachBossAura(boss: Enemy): void {
    const aura = this.add.container(boss.x, boss.y).setDepth(13);
    const radius = boss.displayHeight * 0.13;
    const halo = this.add
      .circle(0, 0, radius * 1.35, 0x8a0d0d, 0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glow = this.add
      .circle(0, 0, radius, 0xff2a2a, 0.26)
      .setBlendMode(Phaser.BlendModes.ADD);
    const ring = this.add
      .circle(0, 0, radius * 0.84)
      .setStrokeStyle(3, 0xff6a3a, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    aura.add([halo, glow, ring]);

    this.tweens.add({
      targets: aura,
      scale: { from: 0.9, to: 1.14 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.26, to: 0.5 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.bossAura = aura;
  }

  private clearBossVisuals(): void {
    this.bossAura?.destroy(true);
    this.bossAura = undefined;
  }

  private showBossBanner(name: string): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 60;
    const banner = this.add.container(0, 0).setScrollFactor(0).setDepth(86);

    const title = this.add
      .text(cx, cy, "⚔  보스 라운드  ⚔", {
        fontFamily: "Galmuri11, monospace",
        fontSize: "44px",
        color: "#ff5a3a",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, "#ff7a3a", 16, false, true);
    const nameText = this.add
      .text(cx, cy + 54, name, {
        fontFamily: "Galmuri11, monospace",
        fontSize: "26px",
        color: "#ffd58a",
      })
      .setOrigin(0.5)
      .setShadow(0, 2, "#000", 4, false, true);

    banner.add([title, nameText]);
    banner.setAlpha(0).setScale(0.7);

    this.tweens.chain({
      targets: banner,
      tweens: [
        { alpha: 1, scale: 1, duration: 320, ease: "Back.out" },
        { alpha: 1, duration: 1400 },
        { alpha: 0, scale: 1.1, duration: 380, ease: "Quad.in" },
      ],
      onComplete: () => banner.destroy(true),
    });
  }

  private showUpgradeWait(payload: UpgradeRequestPayload): void {
    this.hideUpgradeWait();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(95);
    const scrim = this.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x05030a, 0.66)
      .setInteractive();
    const panel = this.add
      .rectangle(cx, cy, 460, 190, 0x0a0610, 0.98)
      .setStrokeStyle(2, 0xffd54a, 0.82);
    const title = this.add
      .text(cx, cy - 38, `웨이브 ${payload.completedWave} 종료`, {
        fontFamily: "Galmuri11, monospace",
        fontSize: "30px",
        color: "#ffd58a",
      })
      .setOrigin(0.5);
    const body = this.add
      .text(cx, cy + 22, `업그레이드 선택 대기\n다음 웨이브 ${payload.nextWave} / 20`, {
        fontFamily: "Galmuri11, monospace",
        fontSize: "17px",
        color: "#ece2c8",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    overlay.add([scrim, panel, title, body]);
    this.upgradeOverlay = overlay;
  }

  private hideUpgradeWait(): void {
    this.upgradeOverlay?.destroy(true);
    this.upgradeOverlay = undefined;
  }

  private cleanupScene(): void {
    if (this.upgradeSelectedHandler) {
      window.removeEventListener(UPGRADE_SELECTED_EVENT, this.upgradeSelectedHandler);
      this.upgradeSelectedHandler = undefined;
    }
    if (this.upgradeRerollHandler) {
      window.removeEventListener(UPGRADE_REROLL_EVENT, this.upgradeRerollHandler);
      this.upgradeRerollHandler = undefined;
    }
    if (this.devWaveSecHandler) {
      window.removeEventListener(DEV_WAVE_SEC_EVENT, this.devWaveSecHandler);
      this.devWaveSecHandler = undefined;
    }
    this.tutorial?.destroy();
    this.tutorial = undefined;
    this.bossAura?.destroy(true);
    this.bossAura = undefined;
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
        frameRate: classDef.attackFrameRate ?? 18,
        repeat: 0,
      });
    }
    this.registerOneShotClassAnim(TEX.classHurt, CLASS_ANIM.hurt, 10);
    this.registerOneShotClassAnim(TEX.classDeath, CLASS_ANIM.death, 8);
  }

  private registerOneShotClassAnim(texKey: string, animKey: string, frameRate: number): void {
    if (this.anims.exists(animKey) || !this.textures.exists(texKey)) return;
    const img = this.textures.get(texKey).getSourceImage() as HTMLImageElement;
    const frameTotal = Math.max(1, Math.floor(img.width / CLASS_FRAME.width));
    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: frameTotal - 1 }),
      frameRate,
      repeat: 0,
    });
  }

  /** 플레이어가 공격할 때 직업 공격 모션을 1회 재생한다(이동 애니메이션을 잠시 막는다). */
  triggerAttackAnim(targetX: number): void {
    if (!this.usingClass || this.attacking || this.hurting || !this.anims.exists(CLASS_ANIM.attack)) return;
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

  private playPlayerDeath(): void {
    this.attacking = false;
    this.hurting = false;
    this.player.off(`animationcomplete-${CLASS_ANIM.hurt}`);
    if (this.usingClass && this.anims.exists(CLASS_ANIM.death)) {
      this.player.play(CLASS_ANIM.death, true);
      return;
    }
    this.player.setTint(0xff6b6b);
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
    this.state.addPlayerClass(classId ?? "sword");
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
