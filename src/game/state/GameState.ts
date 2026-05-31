import Phaser from "phaser";
import { HUD } from "../config";
import { bossIdForWave, isBossWave, type EnemyId } from "../data/enemies";

/** GameState 가 발행하는 이벤트 키. HUD·시스템이 구독해 화면/로직을 갱신한다. */
export const GAME_EVENT = {
  time: "state-time",
  wave: "state-wave",
  hp: "state-hp",
  party: "state-party",
  kills: "state-kills",
  score: "state-score",
  upgradeRequest: "state-upgrade-request",
  bossStart: "state-boss-start",
  bossEnd: "state-boss-end",
  over: "state-over",
} as const;

export type GameOverPayload = { victory: boolean };
export type UpgradeRequestPayload = { completedWave: number; nextWave: number };
export type BossStartPayload = { wave: number; bossId: EnemyId };
export type BossEndPayload = { wave: number };
export type GameStateOptions = { waveSec?: number };

/**
 * 인게임 단일 상태 저장소. 시간·웨이브·체력·처치수·용병단을 보유하고
 * 변경 시 이벤트를 발행한다. HUD와 각 시스템은 이 상태만 바라본다.
 */
export class GameState extends Phaser.Events.EventEmitter {
  elapsedSec = 0;
  waveElapsedSec = 0;
  waveSec: number = HUD.waveSec;
  wave = 1;
  kills = 0;
  score = 0;
  hp: number = HUD.playerMaxHp;
  maxHp: number = HUD.playerMaxHp;
  mercenaryDamageMultiplier = 1;
  mercenaryAttackSpeedMultiplier = 1;
  playerSpeedMultiplier = 1;
  party: string[] = [];
  over = false;
  upgradePending = false;
  /** 현재 웨이브 진행 시간(초). 웨이브가 바뀔 때마다 0으로 초기화된다. */
  /** 보스 라운드 진행 중인지. 이때는 시간 경과/자동 웨이브 진행이 멈춘다. */
  bossActive = false;
  /** 튜토리얼 모드에서는 false로 두어 시간 경과에 따른 자동 웨이브 진행을 막는다. */
  autoProgress = true;

  constructor(options: GameStateOptions = {}) {
    super();
    if (options.waveSec) this.waveSec = options.waveSec;
  }

  /** 매 프레임 호출되어 경과 시간과 웨이브를 진행시킨다. */
  tick(deltaMs: number): void {
    // 보스 라운드/업그레이드 대기 중에는 타이머와 웨이브 진행을 멈춘다.
    if (this.over || this.upgradePending || this.bossActive) return;

    const dt = deltaMs / 1000;
    this.waveElapsedSec += dt;
    this.elapsedSec = Math.min(HUD.totalTimeSec, this.elapsedSec + dt);
    this.emit(GAME_EVENT.time, this.elapsedSec);

    if (!this.autoProgress) return;
    if (isBossWave(this.wave)) return;

    if (this.wave < HUD.totalWaves && this.waveElapsedSec >= HUD.waveSec) {
      this.requestUpgrade();
    }
  }

  setWaveSec(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.waveSec = seconds;
    this.emit(GAME_EVENT.time, this.elapsedSec);
  }

  /** 튜토리얼에서 카드 선택 단계를 직접 띄우기 위해 업그레이드 요청을 강제한다. */
  forceUpgradeRequest(): void {
    this.requestUpgrade();
  }

  addKill(scoreValue = 0): void {
    this.kills += 1;
    this.score += scoreValue;
    this.emit(GAME_EVENT.kills, this.kills);
    this.emit(GAME_EVENT.score, this.score);
  }

  addMerc(id: string): void {
    this.party.push(id);
    this.emit(GAME_EVENT.party, this.party);
  }

  damagePlayer(amount: number): void {
    if (this.over) return;
    this.hp = Phaser.Math.Clamp(this.hp - amount, 0, this.maxHp);
    this.emit(GAME_EVENT.hp, this.hp);
    if (this.hp <= 0) this.finish(false);
  }

  healPlayer(amount: number): void {
    this.hp = Phaser.Math.Clamp(this.hp + amount, 0, this.maxHp);
    this.emit(GAME_EVENT.hp, this.hp);
  }

  increaseMaxHp(amount: number): void {
    this.maxHp += amount;
    this.hp = Phaser.Math.Clamp(this.hp + amount, 0, this.maxHp);
    this.emit(GAME_EVENT.hp, this.hp);
  }

  boostMercenaryDamage(ratio: number): void {
    this.mercenaryDamageMultiplier *= 1 + ratio;
  }

  boostMercenaryAttackSpeed(ratio: number): void {
    this.mercenaryAttackSpeedMultiplier *= 1 + ratio;
  }

  boostPlayerSpeed(ratio: number): void {
    this.playerSpeedMultiplier *= 1 + ratio;
  }

  completeUpgrade(): void {
    if (!this.upgradePending || this.over) return;
    this.upgradePending = false;
    this.waveElapsedSec = 0;
    this.wave = Math.min(HUD.totalWaves, this.wave + 1);
    this.waveElapsedSec = 0;
    this.emit(GAME_EVENT.wave, this.wave);

    if (isBossWave(this.wave)) this.startBoss();
  }

  /** 보스가 등장하는 웨이브에 진입할 때 보스 라운드를 시작한다. */
  private startBoss(): void {
    const bossId = bossIdForWave(this.wave);
    if (!bossId) return;
    this.bossActive = true;
    this.emit(GAME_EVENT.bossStart, { wave: this.wave, bossId } satisfies BossStartPayload);
  }

  /** 보스가 쓰러졌을 때 DungeonScene이 호출. 최종 보스면 승리, 아니면 카드 선택. */
  defeatBoss(): void {
    if (!this.bossActive || this.over) return;
    this.bossActive = false;
    this.emit(GAME_EVENT.bossEnd, { wave: this.wave } satisfies BossEndPayload);

    if (this.wave >= HUD.totalWaves) {
      this.finish(true);
    } else {
      this.requestUpgrade();
    }
    this.emit(GAME_EVENT.time, this.elapsedSec);
  }

  get finalScore(): number {
    return this.score + Math.floor(this.elapsedSec) * 10 + this.kills * 20;
  }

  private requestUpgrade(): void {
    if (this.upgradePending || this.over) return;
    this.upgradePending = true;
    this.emit(GAME_EVENT.upgradeRequest, {
      completedWave: this.wave,
      nextWave: Math.min(HUD.totalWaves, this.wave + 1),
    } satisfies UpgradeRequestPayload);
  }

  private finish(victory: boolean): void {
    if (this.over) return;
    this.over = true;
    this.emit(GAME_EVENT.over, { victory } satisfies GameOverPayload);
  }
}
