import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const FONT = "Galmuri11, monospace";
const DEPTH = 100;

const COLOR = {
  scrim: 0x05030a,
  panelFill: 0x0a0610,
  panelBorder: 0xece2c8,
  bone: "#ece2c8",
  ash: "#9a8da3",
  btnFill: 0x1b1320,
  btnHover: 0x3a2742,
  exitHover: 0x5a1e1e,
} as const;

export class PauseMenu {
  private readonly scene: Phaser.Scene;
  private readonly onResume: () => void;
  private readonly onExit: () => void;
  private readonly objects: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  > = [];
  visible = false;

  constructor(scene: Phaser.Scene, onResume: () => void, onExit: () => void) {
    this.scene = scene;
    this.onResume = onResume;
    this.onExit = onExit;
  }

  build(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const scrim = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, COLOR.scrim, 0.72)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive();

    const panelW = 360;
    const panelH = 300;
    const panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, COLOR.panelFill, 0.98)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(2, COLOR.panelBorder, 0.9);

    const title = this.scene.add
      .text(cx, cy - panelH / 2 + 46, "일시정지", {
        fontFamily: FONT,
        fontSize: "30px",
        color: COLOR.bone,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    const hint = this.scene.add
      .text(cx, cy - panelH / 2 + 86, "ESC 로 돌아가기", {
        fontFamily: FONT,
        fontSize: "14px",
        color: COLOR.ash,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.objects.push(scrim, panel, title, hint);

    this.makeButton(cx, cy + 6, "돌아가기", COLOR.btnHover, () => this.onResume());
    this.makeButton(cx, cy + 78, "나가기", COLOR.exitHover, () => this.onExit());

    this.setShown(false);
  }

  private makeButton(
    x: number,
    y: number,
    text: string,
    hoverColor: number,
    onClick: () => void,
  ): void {
    const w = 260;
    const h = 56;
    const bg = this.scene.add
      .rectangle(x, y, w, h, COLOR.btnFill, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3)
      .setStrokeStyle(2, COLOR.panelBorder, 0.55)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(x, y, text, { fontFamily: FONT, fontSize: "22px", color: COLOR.bone })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 4);

    bg.on("pointerover", () => bg.setFillStyle(hoverColor, 1));
    bg.on("pointerout", () => bg.setFillStyle(COLOR.btnFill, 1));
    bg.on("pointerup", onClick);

    this.objects.push(bg, label);
  }

  private setShown(shown: boolean): void {
    for (const obj of this.objects) {
      obj.setVisible(shown);
      if (obj.input) obj.input.enabled = shown;
    }
  }

  show(): void {
    this.visible = true;
    this.setShown(true);
  }

  hide(): void {
    this.visible = false;
    this.setShown(false);
  }
}
