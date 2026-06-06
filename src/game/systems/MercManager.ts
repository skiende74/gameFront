import Phaser from "phaser";
import { EFFECT_ANIM, TEX } from "../config";
import { Mercenary } from "../entities/Mercenary";
import { Enemy } from "../entities/Enemy";
import { MERC_COMBAT, type MercCombat } from "../data/mercs";
import { RANK_BADGE, applyRankToCombat } from "../data/unitRanks";
import { applySynergyToCombat, presentClasses } from "../data/synergies";
import { GAME_EVENT, type GameState, type UnitRankUpPayload } from "../state/GameState";
import type { PartyUnit } from "../state/partyUnits";
import type { ProjectileManager } from "./ProjectileManager";
import type { SfxManager } from "./SfxManager";
import { getSplashTargets } from "./meleeSplash";

const CLUMP_SPACING_X = 32;
const CLUMP_SPACING_Y = 20;
const HEAL_DELAY_MS = 400;

/**
 * 파티(GameState.party)에 맞춰 전투를 조율한다.
 * - party[0] = 플레이어 본인(선택한 직업). 별도 스프라이트 없이 플레이어 위치에서 자동 공격.
 * - party[1..] = 카드로 고용된 추가 용병. 플레이어 주위를 추종하며 자동 전투.
 */
export class MercManager {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly getPlayer: () => Phaser.Physics.Arcade.Sprite | undefined;
  private readonly getEnemies: () => Phaser.Physics.Arcade.Group;
  private readonly projectiles: ProjectileManager;
  private readonly sfx: SfxManager;
  private readonly onPlayerAttack?: (targetX: number) => void;
  private readonly mercs: Mercenary[] = [];
  private playerCombat: MercCombat | null = null;
  private playerCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    getPlayer: () => Phaser.Physics.Arcade.Sprite | undefined,
    getEnemies: () => Phaser.Physics.Arcade.Group,
    projectiles: ProjectileManager,
    sfx: SfxManager,
    onPlayerAttack?: (targetX: number) => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.getPlayer = getPlayer;
    this.getEnemies = getEnemies;
    this.projectiles = projectiles;
    this.sfx = sfx;
    this.onPlayerAttack = onPlayerAttack;
    this.ensureEffectAnimations();

    this.syncParty(state.party);
    state.on(GAME_EVENT.party, this.syncParty, this);
    state.on(GAME_EVENT.unitRankUp, this.onUnitRankUp, this);
  }

  private syncParty(party: PartyUnit[]): void {
    // 0번은 플레이어 본인의 전투 스펙
    const playerUnit = party.find((unit) => unit.isPlayer);
    this.playerCombat = playerUnit ? this.combatFor(playerUnit) : null;

    // 1번 이후만 추종 용병 스프라이트로 생성
    this.mercs.splice(0).forEach((merc) => merc.destroy());
    for (const unit of party.filter((item) => !item.isPlayer)) {
      const merc = new Mercenary(this.scene, unit);
      const player = this.getPlayer();
      if (player) merc.setPosition(player.x, player.y);
      this.mercs.push(merc);
    }
  }

  private combatFor(unit: PartyUnit): MercCombat | null {
    const base = MERC_COMBAT[unit.id];
    if (!base) return null;
    const ranked = applyRankToCombat(base, unit.rank);
    return applySynergyToCombat(ranked, presentClasses(this.state.party));
  }

  private onUnitRankUp(unit: UnitRankUpPayload): void {
    const target = unit.isPlayer
      ? this.getPlayer()
      : this.mercs.find((merc) => merc.unit.uid === unit.uid);
    if (!target) return;
    this.playRankUpFx(target, RANK_BADGE[unit.rank]);
  }

  private playRankUpFx(target: Phaser.GameObjects.Sprite, label: string): void {
    target.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => target.clearTint());

    const depth = target.depth + 3;
    const burst = this.scene.add
      .circle(target.x, target.y - 30, 28, 0xffffff, 0.55)
      .setDepth(depth)
      .setBlendMode(Phaser.BlendModes.ADD);
    const text = this.scene.add
      .text(target.x, target.y - 92, label, {
        fontFamily: "Galmuri11, monospace",
        fontSize: "26px",
        color: "#ffffff",
        stroke: "#ffd58a",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setShadow(0, 0, "#ffffff", 12, false, true);

    this.scene.tweens.add({
      targets: burst,
      scale: { from: 0.5, to: 2.1 },
      alpha: { from: 0.55, to: 0 },
      duration: 520,
      ease: "Quad.out",
      onComplete: () => burst.destroy(),
    });
    this.scene.tweens.add({
      targets: text,
      y: text.y - 34,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.9, to: 1.2 },
      duration: 900,
      ease: "Quad.out",
      onComplete: () => text.destroy(),
    });
  }

  update(deltaMs: number): void {
    const player = this.getPlayer();
    if (!player) return;

    this.runPlayerCombat(player, deltaMs);

    this.mercs.forEach((merc, i) => {
      const offset = this.clumpOffset(i);
      const tx = player.x + offset.x;
      const ty = player.y + offset.y;
      merc.steer(tx, ty);
      merc.setDepth(merc.y > player.y ? 21 : 18);
      merc.tickCooldown(deltaMs);
      this.runCombat(merc);
    });
  }

  /** 플레이어 본인의 직업 자동 공격(스프라이트는 플레이어 그대로). */
  private runPlayerCombat(player: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    const combat = this.playerCombat;
    if (!combat) return;
    if (this.playerCooldown > 0) this.playerCooldown -= deltaMs;

    if (combat.role === "heal") {
      if (this.playerCooldown <= 0) {
        this.playerCooldown = this.cooldownFor(combat);
        this.onPlayerAttack?.(player.x);
        this.scheduleHeal(combat.heal ?? 0);
      }
      return;
    }

    const center = this.bodyCenter(player);
    const target = this.nearestEnemy(center.x, center.y, combat.range);
    if (!target) return;
    if (this.playerCooldown > 0) return;
    this.playerCooldown = this.cooldownFor(combat);
    this.onPlayerAttack?.(target.x);
    this.performAttack(combat, player.x, player.y, target);
  }

  private runCombat(merc: Mercenary): void {
    const combat = this.combatFor(merc.unit);
    if (!combat) return;

    if (combat.role === "heal") {
      if (merc.ready) {
        merc.resetCooldown(this.cooldownFor(combat));
        merc.playAttackCue();
        this.scheduleHeal(combat.heal ?? 0);
      }
      return;
    }

    const center = this.bodyCenter(merc);
    const target = this.nearestEnemy(center.x, center.y, combat.range);
    if (!target) return;

    merc.faceTo(target.x);
    if (!merc.ready) return;
    merc.resetCooldown(this.cooldownFor(combat));
    merc.playAttackCue();
    this.performAttack(combat, merc.x, merc.y, target);
  }

  /** 역할별 실제 타격/투사체 발사. 플레이어와 용병이 공유한다. */
  private performAttack(combat: MercCombat, x: number, y: number, target: Enemy): void {
    const damage = this.damageFor(combat);
    switch (combat.role) {
      case "melee": {
        this.sfx.play("swordAttack");
        this.damageMeleeTargets(target, damage, combat.aoeRadius ?? 0);
        this.meleeSlash(x, y, target.x, target.y);
        break;
      }
      case "ranged":
        this.projectiles.fireArrow(x, y - 24, target.x, target.y, damage);
        break;
      case "aoe":
        this.projectiles.fireMagic(x, y - 24, target.x, target.y, damage, combat.aoeRadius ?? 60);
        break;
    }
  }

  private damageFor(combat: MercCombat): number {
    return Math.max(1, Math.round(combat.atk * this.state.mercenaryDamageMultiplier));
  }

  private cooldownFor(combat: MercCombat): number {
    return combat.cooldownMs / this.state.mercenaryAttackSpeedMultiplier;
  }

  private damageMeleeTargets(target: Enemy, damage: number, splashRadius: number): void {
    if (splashRadius <= 0) {
      this.damageEnemy(target, damage);
      return;
    }

    const origin = this.bodyCenter(target);
    const splashCandidates = this.getEnemies().getChildren().map((obj) => {
      const enemy = obj as Enemy;
      const center = this.bodyCenter(enemy);
      return {
        enemy,
        targetable: enemy.targetable,
        x: center.x,
        y: center.y,
      };
    });

    for (const splashTarget of getSplashTargets(splashCandidates, origin, splashRadius)) {
      this.damageEnemy(splashTarget.enemy, damage);
    }
  }

  private damageEnemy(enemy: Enemy, damage: number): void {
    const killed = enemy.takeDamage(damage);
    this.sfx.play(killed ? "enemyDeath" : "hitFlesh");
    if (killed) this.state.addKill(enemy.def.score);
  }

  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = range * range;
    for (const obj of this.getEnemies().getChildren()) {
      const e = obj as Enemy;
      if (!e.targetable) continue;
      const center = this.bodyCenter(e);
      const d = (center.x - x) * (center.x - x) + (center.y - y) * (center.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private bodyCenter(sprite: Phaser.GameObjects.Sprite): Phaser.Math.Vector2 {
    const body = (sprite as Phaser.GameObjects.Sprite & { body?: Phaser.Physics.Arcade.Body }).body;
    if (!body) return new Phaser.Math.Vector2(sprite.x, sprite.y);
    return new Phaser.Math.Vector2(body.center.x, body.center.y);
  }

  private clumpOffset(index: number): Phaser.Math.Vector2 {
    let remaining = index;
    for (let radius = 1; ; radius += 1) {
      const cells = this.ringCells(radius);
      if (remaining < cells.length) {
        const cell = cells[remaining];
        return new Phaser.Math.Vector2(
          cell.x * CLUMP_SPACING_X,
          cell.y * CLUMP_SPACING_Y,
        );
      }
      remaining -= cells.length;
    }
  }

  private ringCells(radius: number): Phaser.Math.Vector2[] {
    const cells: Phaser.Math.Vector2[] = [];
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (x === 0 && y === 0) continue;
        if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
        cells.push(new Phaser.Math.Vector2(x, y));
      }
    }
    return cells.sort((a, b) => {
      const da = Math.abs(a.x) + Math.abs(a.y);
      const db = Math.abs(b.x) + Math.abs(b.y);
      if (da !== db) return da - db;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  /** 공격자(ax,ay)에서 대상(tx,ty) 방향으로 칼날이 호를 그리며 베는 슬래시 이펙트. */
  private meleeSlash(ax: number, ay: number, tx: number, ty: number): void {
    const angle = Math.atan2(ty - ay, tx - ax);
    const radius = 52;
    const halfSpan = Phaser.Math.DegToRad(48);

    const g = this.scene.add
      .graphics()
      .setDepth(24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setPosition((ax + tx) / 2, (ay + ty) / 2);

    const proxy = { t: 0 };
    this.scene.tweens.add({
      targets: proxy,
      t: 1,
      duration: 170,
      ease: "Quad.out",
      onUpdate: () => {
        const sweep = Phaser.Math.DegToRad(-46 + 92 * proxy.t);
        const alpha = 0.9 * (1 - proxy.t) + 0.15;
        const thickness = 7 * (1 - proxy.t) + 2;
        g.clear();
        g.lineStyle(thickness, 0xffffff, alpha);
        g.beginPath();
        g.arc(0, 0, radius, angle - halfSpan + sweep, angle + halfSpan + sweep, false);
        g.strokePath();
      },
      onComplete: () => g.destroy(),
    });
  }

  private healPulse(x: number, y: number): void {
    if (this.scene.textures.exists(TEX.priestHealEffect) && this.scene.anims.exists(EFFECT_ANIM.priestHeal)) {
      const effect = this.scene.add
        .sprite(x, y - 30, TEX.priestHealEffect, 0)
        .setDepth(23)
        .setScale(2)
        .setBlendMode(Phaser.BlendModes.ADD);

      effect.play(EFFECT_ANIM.priestHeal, true);
      this.scene.tweens.add({
        targets: effect,
        alpha: { from: 0.95, to: 0 },
        scale: { from: 2, to: 2.2 },
        duration: 420,
        ease: "Quad.out",
        onComplete: () => effect.destroy(),
      });
      return;
    }

    const pulse = this.scene.add
      .circle(x, y, 64, 0x59c46b, 0.45)
      .setDepth(23)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: pulse,
      scale: { from: 0.4, to: 1.6 },
      alpha: { from: 0.55, to: 0 },
      duration: 480,
      ease: "Quad.out",
      onComplete: () => pulse.destroy(),
    });
  }

  private scheduleHeal(amount: number): void {
    this.scene.time.delayedCall(HEAL_DELAY_MS, () => {
      const player = this.getPlayer();
      if (!player || this.state.over) return;
      this.state.healPlayer(amount);
      this.sfx.play("heal");
      this.healPulse(player.x, player.y);
    });
  }

  private ensureEffectAnimations(): void {
    if (this.scene.textures.exists(TEX.priestHealEffect) && !this.scene.anims.exists(EFFECT_ANIM.priestHeal)) {
      this.scene.anims.create({
        key: EFFECT_ANIM.priestHeal,
        frames: this.scene.anims.generateFrameNumbers(TEX.priestHealEffect, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }
}
