import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const FONT = "Galmuri11, monospace";
const DEPTH = 110;

const COLOR = {
  scrim: 0x05030a,
  panelFill: 0x0a0610,
  bone: "#ece2c8",
  ash: "#9a8da3",
  victory: 0xffd54a,
  defeat: 0xc41e1e,
  btnFill: 0x1b1320,
  btnHover: 0x3a2742,
  exitHover: 0x5a1e1e,
} as const;

export type ResultStats = {
  victory: boolean;
  /** 생존 시간(초) */
  elapsedSec: number;
  kills: number;
  score: number;
  finalScore: number;
  wave: number;
};

/** 게임 종료(패배/승리) 결과 화면. 통계 + 다시 시작 / 나가기. */
export class GameOverMenu {
  private readonly scene: Phaser.Scene;
  private readonly onRestart: () => void;
  private readonly onExit: () => void;
  private readonly objects: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  > = [];
  private titleText!: Phaser.GameObjects.Text;
  private statText!: Phaser.GameObjects.Text;
  visible = false;

  constructor(scene: Phaser.Scene, onRestart: () => void, onExit: () => void) {
    this.scene = scene;
    this.onRestart = onRestart;
    this.onExit = onExit;
  }

  build(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 420;
    const panelH = 380;

    const scrim = this.scene.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, COLOR.scrim, 0.82)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive();

    const panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, COLOR.panelFill, 0.98)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(2, COLOR.victory, 0.9);

    this.titleText = this.scene.add
      .text(cx, cy - panelH / 2 + 56, "", { fontFamily: FONT, fontSize: "38px", color: COLOR.bone })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.statText = this.scene.add
      .text(cx, cy - 18, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLOR.ash,
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.objects.push(scrim, panel, this.titleText, this.statText);

    this.makeButton(cx, cy + panelH / 2 - 96, "다시 시작", COLOR.btnHover, () => this.onRestart());
    this.makeButton(cx, cy + panelH / 2 - 36, "나가기", COLOR.exitHover, () => this.onExit());

    this.setShown(false);
  }

  private makeButton(
    x: number,
    y: number,
    text: string,
    hoverColor: number,
    onClick: () => void,
  ): void {
    const bg = this.scene.add
      .rectangle(x, y, 280, 50, COLOR.btnFill, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3)
      .setStrokeStyle(2, COLOR.victory, 0.5)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(x, y, text, { fontFamily: FONT, fontSize: "20px", color: COLOR.bone })
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

  show(stats: ResultStats): void {
    const mm = Math.floor(stats.elapsedSec / 60);
    const ss = Math.floor(stats.elapsedSec % 60);
    const time = `${mm}:${String(ss).padStart(2, "0")}`;

    this.titleText
      .setText(stats.victory ? "생존 성공!" : "패배")
      .setColor(stats.victory ? "#ffd54a" : "#ff6b6b");
    this.statText.setText(
      [
        `생존 시간   ${time}`,
        `처치한 적   ${stats.kills}`,
        `처치 점수   ${stats.score}`,
        `최종 점수   ${stats.finalScore}`,
        `도달 웨이브  ${stats.wave} / 20`,
      ].join("\n"),
    );

    this.visible = true;
    this.setShown(true);
  }
}
