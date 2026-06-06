import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HUD } from "../config";
import type { GameState } from "../state/GameState";

export class GameHud {
  private readonly state: GameState;

  constructor(scene: Phaser.Scene, state: GameState) {
    void scene;
    this.state = state;
  }

  build(): void {
    // React GameOverlay renders the visible HUD. This adapter keeps tutorial regions stable.
  }

  getRegions(): Record<"hp" | "timer" | "wave" | "mercBar", Phaser.Geom.Rectangle> {
    const panelW = 156;
    const box = HUD.slotBox;
    const n = Math.max(1, this.state.party.length);
    const totalW = n * box + (n - 1) * HUD.slotGap;
    const mercX = (GAME_WIDTH - totalW) / 2;
    const mercTop = GAME_HEIGHT - HUD.margin - box - 14;

    return {
      hp: new Phaser.Geom.Rectangle(HUD.margin, HUD.margin, 264, HUD.panelHeight + 50),
      timer: new Phaser.Geom.Rectangle((GAME_WIDTH - panelW) / 2, HUD.margin, panelW, HUD.panelHeight),
      wave: new Phaser.Geom.Rectangle(GAME_WIDTH - HUD.margin - panelW, HUD.margin, panelW, HUD.panelHeight),
      mercBar: new Phaser.Geom.Rectangle(mercX - 8, mercTop, totalW + 16, box + 24),
    };
  }

  showBossBar(name: string, maxHp: number): void {
    void name;
    void maxHp;
  }

  updateBossHp(hp: number): void {
    void hp;
  }

  hideBossBar(): void {}
}
