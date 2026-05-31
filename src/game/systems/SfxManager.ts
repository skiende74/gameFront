import Phaser from "phaser";
import { sfxKey, type SfxId } from "../data/sfx";

type SfxSetting = {
  volume: number;
  cooldownMs?: number;
};

const SFX_SETTINGS: Partial<Record<SfxId, SfxSetting>> = {
  uiConfirm: { volume: 0.45 },
  uiDenied: { volume: 0.45 },
  upgradeSelect: { volume: 0.55 },
  pause: { volume: 0.45 },
  unpause: { volume: 0.45 },

  swordAttack: { volume: 0.45, cooldownMs: 100 },
  bowAttack: { volume: 0.4, cooldownMs: 100 },
  hitFlesh: { volume: 0.35, cooldownMs: 80 },
  playerHurt: { volume: 0.5, cooldownMs: 180 },
  enemyDeath: { volume: 0.4, cooldownMs: 120 },

  magicCast: { volume: 0.35, cooldownMs: 120 },
  magicExplosion: { volume: 0.42, cooldownMs: 150 },
  heal: { volume: 0.48, cooldownMs: 150 },

  atkBuff: { volume: 0.48 },
  speedBuff: { volume: 0.48 },
  maxHpBuff: { volume: 0.48 },
  encounter: { volume: 0.55, cooldownMs: 500 },
  victory: { volume: 0.55 },
};

export class SfxManager {
  private readonly scene: Phaser.Scene;
  private readonly lastPlayed = new Map<SfxId, number>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(id: SfxId, config: Phaser.Types.Sound.SoundConfig = {}): void {
    const key = sfxKey(id);
    if (!this.scene.cache.audio.exists(key)) return;

    const setting = SFX_SETTINGS[id];
    const cooldownMs = setting?.cooldownMs ?? 0;
    const now = this.scene.time.now;
    const last = this.lastPlayed.get(id) ?? -Infinity;
    if (cooldownMs > 0 && now - last < cooldownMs) return;

    this.lastPlayed.set(id, now);
    this.scene.sound.play(key, {
      volume: setting?.volume ?? 0.45,
      ...config,
    });
  }
}
