import Phaser from "phaser";
import { HUD } from "../config";

/** GameState 가 발행하는 이벤트 키. HUD·시스템이 구독해 화면/로직을 갱신한다. */
export const GAME_EVENT = {
  time: "state-time",
  wave: "state-wave",
  hp: "state-hp",
  party: "state-party",
  kills: "state-kills",
  score: "state-score",
  upgradeRequest: "state-upgrade-request",
  over: "state-over",
} as const;

export type GameOverPayload = { victory: boolean };
export type UpgradeRequestPayload = { completedWave: number; nextWave: number };

/**
 * 인게임 단일 상태 저장소. 시간·웨이브·체력·처치수·용병단을 보유하고
 * 변경 시 이벤트를 발행한다. HUD와 각 시스템은 이 상태만 바라본다.
 */
export class GameState extends Phaser.Events.EventEmitter {
  elapsedSec = 0;
  wave = 1;
  kills = 0;
  score = 0;
  hp: number = HUD.playerMaxHp;
  readonly maxHp: number = HUD.playerMaxHp;
  party: string[] = [];
  over = false;
  upgradePending = false;

  /** 매 프레임 호출되어 경과 시간과 웨이브를 진행시킨다. */
  tick(deltaMs: number): void {
    if (this.over || this.upgradePending) return;
    this.elapsedSec = Math.min(HUD.totalTimeSec, this.elapsedSec + deltaMs / 1000);
    this.emit(GAME_EVENT.time, this.elapsedSec);

    if (this.elapsedSec >= HUD.totalTimeSec) {
      this.finish(true);
      return;
    }

    if (this.wave < HUD.totalWaves && this.elapsedSec >= this.wave * HUD.waveSec) {
      this.requestUpgrade();
    }
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

  completeUpgrade(): void {
    if (!this.upgradePending || this.over) return;
    this.upgradePending = false;
    this.wave = Math.min(HUD.totalWaves, this.wave + 1);
    this.emit(GAME_EVENT.wave, this.wave);
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
