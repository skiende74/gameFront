import Phaser from "phaser";
import { HUD } from "../config";
import type { GameState } from "../state/GameState";

export class GameHud {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  build(): void {
    // React GameOverlay renders the visible HUD. This adapter keeps tutorial regions stable.
  }

  getRegions(): Record<"hp" | "timer" | "wave" | "mercBar" | "synergy", Phaser.Geom.Rectangle> {
    // 화면(캔버스) 크기에 맞춰 동적으로 영역을 잡는다. React HUD가 화면 모서리에
    // 1:1(px)로 앵커링되므로, Phaser 좌표도 동일한 화면 px를 그대로 사용한다.
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;
    const panelW = 156;
    const box = HUD.slotBox;
    const n = Math.max(1, this.state.party.length);
    const totalW = n * box + (n - 1) * HUD.slotGap;
    const mercX = (screenW - totalW) / 2;
    const mercTop = screenH - HUD.margin - box - 14;

    return {
      hp: new Phaser.Geom.Rectangle(HUD.margin, HUD.margin, 264, HUD.panelHeight + 50),
      timer: new Phaser.Geom.Rectangle((screenW - panelW) / 2, HUD.margin, panelW, HUD.panelHeight),
      wave: new Phaser.Geom.Rectangle(screenW - HUD.margin - panelW, HUD.margin, panelW, HUD.panelHeight),
      mercBar: new Phaser.Geom.Rectangle(mercX - 8, mercTop, totalW + 16, box + 24),
      // React SynergyPanel(left-4 top-[154px] w-[252px]) 위치에 맞춘 근사 영역.
      synergy: new Phaser.Geom.Rectangle(16, 154, 252, 360),
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
