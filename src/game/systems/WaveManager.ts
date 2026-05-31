import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { ENEMY_DEFS, enemyTex, type EnemyId } from "../data/enemies";
import { desiredAliveCount, phaseForWave } from "../data/waves";
import type { GameState } from "../state/GameState";

const MAX_ENEMIES = 80;
const SPAWN_INTERVAL_MS = 260;
const SPAWN_BATCH = 3;
/** 카메라 밖(플레이어 기준)에서 스폰하기 위한 반경 */
const SPAWN_RADIUS = 760;

/**
 * 웨이브에 따라 적을 스폰하고 매 프레임 추적시키는 시스템.
 * 적은 Physics Group 으로 풀링해 재사용한다(동시 60마리 안전선).
 */
export class WaveManager {
  private readonly state: GameState;
  private readonly getPlayer: () => Phaser.Physics.Arcade.Sprite | undefined;
  private readonly group: Phaser.Physics.Arcade.Group;
  private spawnAccumMs = 0;
  /** 튜토리얼에서 특정 단계 전까지 적 스폰을 멈추기 위한 토글. */
  spawnEnabled = true;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    getPlayer: () => Phaser.Physics.Arcade.Sprite | undefined,
  ) {
    this.state = state;
    this.getPlayer = getPlayer;
    this.group = scene.physics.add.group({
      classType: Enemy,
      maxSize: MAX_ENEMIES,
      runChildUpdate: false,
    });
  }

  /** 충돌/공격 대상 등록용으로 적 그룹을 노출한다. */
  get enemies(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  update(deltaMs: number): void {
    const player = this.getPlayer();
    if (!player) return;

    for (const obj of this.group.getChildren()) {
      const enemy = obj as Enemy;
      if (enemy.active) enemy.chase(player.x, player.y);
    }

    if (this.state.over || !this.spawnEnabled) return;

    this.spawnAccumMs += deltaMs;
    if (this.spawnAccumMs < SPAWN_INTERVAL_MS) return;
    this.spawnAccumMs = 0;

    const desired = desiredAliveCount(this.state.wave);
    const alive = this.group.countActive(true);
    const deficit = desired - alive;
    if (deficit <= 0) return;

    const batch = Math.min(SPAWN_BATCH, deficit);
    for (let i = 0; i < batch; i++) this.spawnOne(player);
  }

  private spawnOne(player: Phaser.Physics.Arcade.Sprite): void {
    const types = phaseForWave(this.state.wave).types;
    const typeId = Phaser.Utils.Array.GetRandom(types) as EnemyId;
    const def = ENEMY_DEFS[typeId];

    const angle = Math.random() * Math.PI * 2;
    const radius = SPAWN_RADIUS + Math.random() * 140;
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;

    const enemy = this.group.get(x, y, enemyTex(typeId, "walk")) as Enemy | null;
    if (!enemy) return;
    enemy.spawn(def, x, y);
  }
}
