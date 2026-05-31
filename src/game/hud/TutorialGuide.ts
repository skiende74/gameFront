import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import type { GameHud } from "./GameHud";

const FONT = "Galmuri11, monospace";
const UPGRADE_SELECTED_EVENT = "game:upgrade-selected";

type RegionKey = "hp" | "timer" | "wave" | "mercBar";

/** 한 단계의 정의. gate 는 다음 단계로 넘어가는 조건을 의미한다. */
type Step = {
  text: string;
  regions?: RegionKey[];
  gate: "move" | "next" | "card";
  onEnter?: () => void;
};

type GuideCallbacks = {
  /** 적 스폰을 시작한다(자동 전투 시연용). */
  enableSpawn: () => void;
  /** 카드 선택 단계: 업그레이드 모달을 강제로 띄운다. */
  forceCard: () => void;
  /** 튜토리얼 종료 후 타이틀로 복귀한다. */
  exit: () => void;
};

/**
 * 실제 게임 위에 얹어 단계별로 진행되는 인터랙티브 튜토리얼.
 * 말풍선 안내 + HUD 영역 강조 + 진행 게이트(이동/다음/카드)를 관리한다.
 */
export class TutorialGuide {
  private readonly scene: Phaser.Scene;
  private readonly hud: GameHud;
  private readonly cb: GuideCallbacks;
  private readonly steps: Step[];

  private index = -1;
  private moveAccumMs = 0;
  private finished = false;
  private destroyed = false;

  private layer!: Phaser.GameObjects.Container;
  private box!: Phaser.GameObjects.Graphics;
  private labelText!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private scrim!: Phaser.GameObjects.Graphics;
  private highlight!: Phaser.GameObjects.Graphics;
  private highlightTween?: Phaser.Tweens.Tween;
  private promptTween?: Phaser.Tweens.Tween;

  private keyHandler?: (e: KeyboardEvent) => void;
  private pointerHandler?: () => void;
  private cardHandler?: EventListener;

  private readonly boxW = 680;
  private readonly boxH = 132;
  private readonly boxCx = GAME_WIDTH / 2;
  private readonly boxCy = GAME_HEIGHT - 190;

  constructor(scene: Phaser.Scene, hud: GameHud, cb: GuideCallbacks) {
    this.scene = scene;
    this.hud = hud;
    this.cb = cb;
    this.steps = this.buildSteps();
  }

  private buildSteps(): Step[] {
    return [
      {
        text: "환영합니다! 먼저 [방향키] 또는 [W·A·S·D]로 자유롭게 움직여 보세요.",
        gate: "move",
      },
      {
        text: "왼쪽 위는 체력입니다. 적과 부딪히면 체력이 닳고, 0이 되면 즉시 게임 오버예요.",
        regions: ["hp"],
        gate: "next",
      },
      {
        text: "가운데는 남은 시간, 오른쪽은 현재 웨이브. 10분(20웨이브)을 버티면 승리합니다.",
        regions: ["timer", "wave"],
        gate: "next",
      },
      {
        text: "이제 적이 몰려옵니다. 당신은 직접 공격할 수 없으니 계속 도망쳐서 살아남으세요!",
        gate: "next",
        onEnter: () => this.cb.enableSpawn(),
      },
      {
        text: "하단의 용병이 적을 자동으로 처치합니다. 당신은 동선만 잘 잡으면 돼요.",
        regions: ["mercBar"],
        gate: "next",
      },
      {
        text: "웨이브가 끝날 때마다 카드 3장 중 1장을 골라 용병단을 강화합니다. 한 장 골라보세요!",
        gate: "card",
        onEnter: () => this.cb.forceCard(),
      },
      {
        text: "좋아요! 이게 전부입니다. 무기가 아닌 동료를 빌드해 10분을 버텨 살아남으세요.",
        gate: "next",
      },
    ];
  }

  start(): void {
    this.buildUi();
    this.next();
  }

  /** DungeonScene.update 에서 매 프레임 호출. moving = 이번 프레임 이동 여부. */
  update(deltaMs: number, moving: boolean): void {
    if (this.finished) return;
    const step = this.steps[this.index];
    if (!step || step.gate !== "move") return;

    if (moving) {
      this.moveAccumMs += deltaMs;
      if (this.moveAccumMs >= 450) this.next();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.finished = true;
    if (this.keyHandler) {
      this.scene.input.keyboard?.off("keydown", this.keyHandler);
      this.keyHandler = undefined;
    }
    if (this.pointerHandler) {
      this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler);
      this.pointerHandler = undefined;
    }
    if (this.cardHandler) {
      window.removeEventListener(UPGRADE_SELECTED_EVENT, this.cardHandler);
      this.cardHandler = undefined;
    }
    this.highlightTween?.stop();
    this.promptTween?.stop();
    this.layer?.destroy(true);
    this.highlight?.destroy();
    this.scrim?.destroy();
  }

  private buildUi(): void {
    // 강조 영역 외부를 어둡게 덮는 스포트라이트 막(화면 고정).
    this.scrim = this.scene.add.graphics().setScrollFactor(0).setDepth(78).setVisible(false);

    this.highlight = this.scene.add.graphics().setScrollFactor(0).setDepth(79);

    this.layer = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(80);

    const left = this.boxCx - this.boxW / 2;
    const top = this.boxCy - this.boxH / 2;

    this.box = this.scene.add.graphics();
    this.box.fillStyle(0x0a0610, 0.96);
    this.box.fillRoundedRect(left, top, this.boxW, this.boxH, 10);
    this.box.lineStyle(2, 0xffb066, 0.85);
    this.box.strokeRoundedRect(left, top, this.boxW, this.boxH, 10);

    this.labelText = this.scene.add.text(left + 18, top + 14, "TUTORIAL", {
      fontFamily: FONT,
      fontSize: "11px",
      color: "#ffb066",
    });

    this.counterText = this.scene.add
      .text(left + this.boxW - 18, top + 14, "", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#9a8da3",
      })
      .setOrigin(1, 0);

    this.bodyText = this.scene.add.text(left + 18, top + 42, "", {
      fontFamily: FONT,
      fontSize: "17px",
      color: "#ece2c8",
      lineSpacing: 7,
      wordWrap: { width: this.boxW - 36, useAdvancedWrap: true },
    });

    this.promptText = this.scene.add
      .text(left + this.boxW - 18, top + this.boxH - 16, "", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#ffd58a",
      })
      .setOrigin(1, 1);

    this.layer.add([
      this.box,
      this.labelText,
      this.counterText,
      this.bodyText,
      this.promptText,
    ]);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.tryAdvanceByInput();
      }
    };
    this.scene.input.keyboard?.on("keydown", this.keyHandler);

    // 씬 전역 클릭으로 진행한다(카메라 추적 좌표 어긋남 방지).
    this.pointerHandler = () => this.tryAdvanceByInput();
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler);
  }

  /** Enter/Space/클릭 입력으로 'next' 게이트 단계를 넘긴다. */
  private tryAdvanceByInput(): void {
    if (this.finished) return;
    const step = this.steps[this.index];
    if (step?.gate === "next") this.next();
  }

  private next(): void {
    if (this.finished) return;

    if (this.index >= this.steps.length - 1) {
      this.complete();
      return;
    }

    this.index += 1;
    this.moveAccumMs = 0;
    const step = this.steps[this.index];

    step.onEnter?.();
    this.render(step);

    if (step.gate === "card") this.waitForCard();
  }

  private render(step: Step): void {
    this.counterText.setText(`${this.index + 1} / ${this.steps.length}`);
    this.bodyText.setText(step.text);

    const isCard = step.gate === "card";
    this.setBoxVisible(!isCard);

    this.promptTween?.stop();
    this.promptText.setAlpha(1);
    if (step.gate === "move") {
      this.promptText.setText("◆ 직접 움직여 보세요");
    } else if (step.gate === "next") {
      this.promptText.setText("▶ 다음  [Enter / 클릭]");
      this.promptTween = this.scene.tweens.add({
        targets: this.promptText,
        alpha: { from: 1, to: 0.35 },
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    } else {
      this.promptText.setText("");
    }

    this.applyHighlight(step.regions);
  }

  private setBoxVisible(visible: boolean): void {
    this.layer.setVisible(visible);
  }

  private applyHighlight(regions?: RegionKey[]): void {
    this.highlightTween?.stop();
    this.highlight.clear();

    if (!regions || regions.length === 0) {
      this.highlight.setVisible(false);
      this.scrim.setVisible(false);
      return;
    }

    const all = this.hud.getRegions();
    const pad = 6;
    const radius = 12;

    // 강조 영역들의 합집합 사각형을 구해, 그 바깥쪽을 4개의 어두운 사각형으로 덮는다.
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const key of regions) {
      const r = all[key];
      left = Math.min(left, r.x - pad);
      top = Math.min(top, r.y - pad);
      right = Math.max(right, r.right + pad);
      bottom = Math.max(bottom, r.bottom + pad);
    }
    left = Phaser.Math.Clamp(left, 0, GAME_WIDTH);
    top = Phaser.Math.Clamp(top, 0, GAME_HEIGHT);
    right = Phaser.Math.Clamp(right, 0, GAME_WIDTH);
    bottom = Phaser.Math.Clamp(bottom, 0, GAME_HEIGHT);

    const dark = 0x05030a;
    const alpha = 0.74;
    this.scrim.clear();
    this.scrim.fillStyle(dark, alpha);
    this.scrim.fillRect(0, 0, GAME_WIDTH, top);
    this.scrim.fillRect(0, bottom, GAME_WIDTH, GAME_HEIGHT - bottom);
    this.scrim.fillRect(0, top, left, bottom - top);
    this.scrim.fillRect(right, top, GAME_WIDTH - right, bottom - top);
    this.scrim.setVisible(true);

    this.highlight.setVisible(true);
    this.highlight.lineStyle(3, 0xffd54a, 1);
    for (const key of regions) {
      const r = all[key];
      this.highlight.strokeRoundedRect(
        r.x - pad,
        r.y - pad,
        r.width + pad * 2,
        r.height + pad * 2,
        radius,
      );
    }

    this.highlight.setAlpha(1);
    this.highlightTween = this.scene.tweens.add({
      targets: this.highlight,
      alpha: { from: 1, to: 0.35 },
      duration: 560,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private waitForCard(): void {
    this.cardHandler = () => {
      if (this.cardHandler) {
        window.removeEventListener(UPGRADE_SELECTED_EVENT, this.cardHandler);
        this.cardHandler = undefined;
      }
      // 카드 적용/물리 재개 직후 마지막 안내로 넘어간다.
      this.scene.time.delayedCall(120, () => this.next());
    };
    window.addEventListener(UPGRADE_SELECTED_EVENT, this.cardHandler);
  }

  private complete(): void {
    this.destroy();
    this.cb.exit();
  }
}
