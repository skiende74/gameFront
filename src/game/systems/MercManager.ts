import Phaser from "phaser";
import { Mercenary } from "../entities/Mercenary";
import { Enemy } from "../entities/Enemy";
import { MERC_COMBAT, type MercCombat } from "../data/mercs";
import { GAME_EVENT, type GameState } from "../state/GameState";
import type { ProjectileManager } from "./ProjectileManager";

const CLUMP_COLUMNS = 5;
const CLUMP_SPACING_X = 32;
const CLUMP_SPACING_Y = 20;
const CLUMP_Y_OFFSET = 14;

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
    onPlayerAttack?: (targetX: number) => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.getPlayer = getPlayer;
    this.getEnemies = getEnemies;
    this.projectiles = projectiles;
    this.onPlayerAttack = onPlayerAttack;

    this.syncParty(state.party);
    state.on(GAME_EVENT.party, this.syncParty, this);
  }

  private syncParty(party: string[]): void {
    // 0번은 플레이어 본인의 전투 스펙
    this.playerCombat = party.length > 0 ? MERC_COMBAT[party[0]] ?? null : null;

    // 1번 이후만 추종 용병 스프라이트로 생성
    const wanted = Math.max(0, party.length - 1);
    while (this.mercs.length < wanted) {
      const id = party[this.mercs.length + 1];
      const merc = new Mercenary(this.scene, id);
      const player = this.getPlayer();
      if (player) merc.setPosition(player.x, player.y);
      this.mercs.push(merc);
    }
  }

  update(deltaMs: number): void {
    const player = this.getPlayer();
    if (!player) return;

    this.runPlayerCombat(player, deltaMs);

    this.mercs.forEach((merc, i) => {
      const offset = this.clumpOffset(i, this.mercs.length);
      const tx = player.x + offset.x;
      const ty = player.y + offset.y;
      merc.steer(tx, ty);
      merc.tickCooldown(deltaMs);
      this.runCombat(merc, player);
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
        this.state.healPlayer(combat.heal ?? 0);
        this.healPulse(player.x, player.y);
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

  private runCombat(merc: Mercenary, player: Phaser.Physics.Arcade.Sprite): void {
    if (merc.combat.role === "heal") {
      if (merc.ready) {
        merc.resetCooldown(this.cooldownFor(merc.combat));
        merc.playAttackCue();
        this.state.healPlayer(merc.combat.heal ?? 0);
        this.healPulse(player.x, player.y);
      }
      return;
    }

    const center = this.bodyCenter(merc);
    const target = this.nearestEnemy(center.x, center.y, merc.combat.range);
    if (!target) return;

    merc.faceTo(target.x);
    if (!merc.ready) return;
    merc.resetCooldown(this.cooldownFor(merc.combat));
    merc.playAttackCue();
    this.performAttack(merc.combat, merc.x, merc.y, target);
  }

  /** 역할별 실제 타격/투사체 발사. 플레이어와 용병이 공유한다. */
  private performAttack(combat: MercCombat, x: number, y: number, target: Enemy): void {
    const damage = this.damageFor(combat);
    switch (combat.role) {
      case "melee": {
        if (target.takeDamage(damage)) this.state.addKill(target.def.score);
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

  private clumpOffset(index: number, total: number): Phaser.Math.Vector2 {
    const row = Math.floor(index / CLUMP_COLUMNS);
    const col = index % CLUMP_COLUMNS;
    const columnsInRow = Math.min(CLUMP_COLUMNS, total - row * CLUMP_COLUMNS);
    const centeredCol = col - (columnsInRow - 1) / 2;
    return new Phaser.Math.Vector2(
      centeredCol * CLUMP_SPACING_X,
      CLUMP_Y_OFFSET + row * CLUMP_SPACING_Y,
    );
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
}
