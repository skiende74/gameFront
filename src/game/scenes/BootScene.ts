import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, HEX } from "../config";

const GAME_EXIT_EVENT = "game:exit";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(HEX.bg);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "10분 용병단", {
        fontFamily: "Galmuri11, monospace",
        fontSize: "56px",
        color: HEX.bone,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "게임 준비 중", {
        fontFamily: "Galmuri11, monospace",
        fontSize: "24px",
        color: HEX.torch,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 70,
        "다음 단계에서 플레이 씬(이동·웨이브·카드)이 여기에 들어갑니다",
        {
          fontFamily: "Galmuri11, monospace",
          fontSize: "14px",
          color: HEX.ash,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "[ESC] 타이틀로 돌아가기", {
        fontFamily: "Galmuri11, monospace",
        fontSize: "14px",
        color: HEX.ash,
      })
      .setOrigin(0.5);

    this.input.keyboard?.on("keydown-ESC", () => {
      window.dispatchEvent(new CustomEvent(GAME_EXIT_EVENT));
    });
  }
}
