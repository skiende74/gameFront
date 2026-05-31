import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HUD, MERC_HUD } from "../config";
import { GAME_EVENT, type GameState } from "../state/GameState";

const FONT = "Galmuri11, monospace";

const COLOR = {
  panelFill: 0x0a0610,
  panelBorder: 0xece2c8,
  bone: "#ece2c8",
  ash: "#9a8da3",
  hpFull: 0x59c46b,
  hpMid: 0xffd54a,
  hpLow: 0xc41e1e,
  hpTrack: 0x2a1f33,
  timer: "#ffd58a",
} as const;

type MercSlot = {
  id: string;
  container: Phaser.GameObjects.Container;
  badge: Phaser.GameObjects.Container;
  badgeText: Phaser.GameObjects.Text;
  count: number;
};

export class GameHud {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly layer: Phaser.GameObjects.Container;

  private timerText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveProgress!: Phaser.GameObjects.Graphics;
  private hpFill!: Phaser.GameObjects.Graphics;
  private hpValueText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  private mercBar!: Phaser.GameObjects.Container;
  private readonly slots: MercSlot[] = [];

  private bossBar!: Phaser.GameObjects.Container;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  private bossMaxHp = 1;
  private readonly bossBarGeom = {
    w: 560,
    h: 16,
    x: (GAME_WIDTH - 560) / 2,
    y: HUD.margin + HUD.panelHeight + 34,
  };

  private readonly hpPanel = { x: HUD.margin, y: HUD.margin, w: 264, h: HUD.panelHeight };
  private readonly hpBar = { x: HUD.margin + 14, y: HUD.margin + 30, w: 236, h: 14 };
  private readonly statsPanel = {
    x: HUD.margin,
    y: HUD.margin + HUD.panelHeight + 8,
    w: 264,
    h: 42,
  };
  private readonly waveBarGeom = { w: 124, h: 6 };

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    this.layer = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD.depth);
  }

  build(): void {
    this.buildTopBar();
    this.buildMercBar();
    this.buildBossBar();
    this.buildControlsHint();

    // GameState 변경 이벤트만 구독해 화면을 갱신한다(상태와 표현의 분리).
    this.state.on(GAME_EVENT.time, this.onTime, this);
    this.state.on(GAME_EVENT.wave, this.onWave, this);
    this.state.on(GAME_EVENT.hp, this.refreshHp, this);
    this.state.on(GAME_EVENT.party, this.syncParty, this);
    this.state.on(GAME_EVENT.kills, this.refreshStats, this);
    this.state.on(GAME_EVENT.score, this.refreshStats, this);

    this.refreshHp();
    this.refreshStats();
    this.refreshTimer();
    this.refreshWave();
    this.syncParty(this.state.party);
  }

  /** 튜토리얼 코치마크가 강조할 HUD 영역(스크린 좌표) 사각형을 반환한다. */
  getRegions(): Record<"hp" | "timer" | "wave" | "mercBar", Phaser.Geom.Rectangle> {
    const panelW = 156;
    const box = HUD.slotBox;
    const n = Math.max(1, this.slots.length);
    const totalW = n * box + (n - 1) * HUD.slotGap;
    const mercX = (GAME_WIDTH - totalW) / 2;
    const mercTop = GAME_HEIGHT - HUD.margin - box - 14;

    return {
      hp: new Phaser.Geom.Rectangle(
        this.hpPanel.x,
        this.hpPanel.y,
        this.hpPanel.w,
        this.hpPanel.h + 8 + this.statsPanel.h,
      ),
      timer: new Phaser.Geom.Rectangle(
        (GAME_WIDTH - panelW) / 2,
        HUD.margin,
        panelW,
        HUD.panelHeight,
      ),
      wave: new Phaser.Geom.Rectangle(
        GAME_WIDTH - HUD.margin - panelW,
        HUD.margin,
        panelW,
        HUD.panelHeight,
      ),
      mercBar: new Phaser.Geom.Rectangle(mercX - 8, mercTop, totalW + 16, box + 24),
    };
  }

  private onTime(): void {
    this.refreshTimer();
    this.refreshWave();
  }

  private onWave(): void {
    this.refreshWave();
    this.flashWave();
  }

  /** GameState.party(중복 포함 배열)를 슬롯/수량 배지로 동기화한다. */
  private syncParty(party: string[]): void {
    const counts = new Map<string, number>();
    for (const id of party) {
      if (MERC_HUD[id]) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const [id, count] of counts) {
      let slot = this.slots.find((s) => s.id === id);
      if (!slot) {
        slot = this.createSlot(id);
        this.slots.push(slot);
      }
      slot.count = count;
      slot.badgeText.setText(`x${count}`);
      slot.badge.setVisible(count > 1);
    }
    this.layoutMercBar();
  }

  private buildTopBar(): void {
    const width = GAME_WIDTH;
    const hpPanelG = this.panel(
      this.hpPanel.x,
      this.hpPanel.y,
      this.hpPanel.w,
      this.hpPanel.h,
      0xc41e1e,
    );
    this.layer.add(hpPanelG);
    this.layer.add(
      this.scene.add
        .text(this.hpPanel.x + 14, this.hpPanel.y + 9, "체력", {
          fontFamily: FONT,
          fontSize: "13px",
          color: COLOR.bone,
        })
        .setScrollFactor(0),
    );
    this.hpValueText = this.scene.add
      .text(this.hpPanel.x + this.hpPanel.w - 12, this.hpPanel.y + 8, "", {
        fontFamily: FONT,
        fontSize: "13px",
        color: COLOR.ash,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
    this.layer.add(this.hpValueText);
    this.hpFill = this.scene.add.graphics().setScrollFactor(0);
    this.layer.add(this.hpFill);

    this.layer.add(
      this.panel(
        this.statsPanel.x,
        this.statsPanel.y,
        this.statsPanel.w,
        this.statsPanel.h,
        0xffd54a,
      ),
    );
    this.killsText = this.scene.add
      .text(this.statsPanel.x + 14, this.statsPanel.y + 12, "", {
        fontFamily: FONT,
        fontSize: "14px",
        color: COLOR.bone,
      })
      .setScrollFactor(0);
    this.scoreText = this.scene.add
      .text(this.statsPanel.x + this.statsPanel.w - 14, this.statsPanel.y + 12, "", {
        fontFamily: FONT,
        fontSize: "14px",
        color: COLOR.timer,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
    this.layer.add([this.killsText, this.scoreText]);

    const timerW = 156;
    const timerX = (width - timerW) / 2;
    this.layer.add(this.panel(timerX, HUD.margin, timerW, HUD.panelHeight, 0xffd58a));
    this.timerText = this.scene.add
      .text(width / 2, HUD.margin + HUD.panelHeight / 2, "0:00", {
        fontFamily: FONT,
        fontSize: "30px",
        color: COLOR.timer,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setShadow(0, 0, "#ff7a3a", 10, false, true);
    this.layer.add(this.timerText);

    const waveW = 156;
    const waveX = width - HUD.margin - waveW;
    this.layer.add(this.panel(waveX, HUD.margin, waveW, HUD.panelHeight, 0x6effe0));
    this.layer.add(
      this.scene.add
        .text(waveX + 14, HUD.margin + 9, "웨이브", {
          fontFamily: FONT,
          fontSize: "13px",
          color: COLOR.bone,
        })
        .setScrollFactor(0),
    );
    this.waveText = this.scene.add
      .text(waveX + waveW - 14, HUD.margin + 7, "", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLOR.timer,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
    this.layer.add(this.waveText);

    const trackX = waveX + 14;
    const trackY = HUD.margin + 36;
    const track = this.scene.add.graphics().setScrollFactor(0);
    track.fillStyle(COLOR.hpTrack, 1);
    track.fillRoundedRect(trackX, trackY, this.waveBarGeom.w, this.waveBarGeom.h, 3);
    this.layer.add(track);
    this.waveProgress = this.scene.add.graphics().setScrollFactor(0);
    this.layer.add(this.waveProgress);
    this.waveProgress.setData("x", trackX);
    this.waveProgress.setData("y", trackY);
  }

  private refreshHp(): void {
    const ratio = this.state.hp / this.state.maxHp;
    const color = ratio > 0.5 ? COLOR.hpFull : ratio > 0.25 ? COLOR.hpMid : COLOR.hpLow;

    this.hpFill.clear();
    this.hpFill.fillStyle(COLOR.hpTrack, 1);
    this.hpFill.fillRoundedRect(this.hpBar.x, this.hpBar.y, this.hpBar.w, this.hpBar.h, 4);
    if (ratio > 0) {
      this.hpFill.fillStyle(color, 1);
      this.hpFill.fillRoundedRect(
        this.hpBar.x,
        this.hpBar.y,
        Math.max(4, this.hpBar.w * ratio),
        this.hpBar.h,
        4,
      );
    }
    this.hpValueText.setText(`${Math.ceil(this.state.hp)} / ${this.state.maxHp}`);
  }

  private refreshStats(): void {
    this.killsText.setText(`처치 ${this.state.kills}`);
    this.scoreText.setText(`점수 ${this.state.score}`);
  }

  private refreshTimer(): void {
    const remaining = Math.max(0, Math.ceil(HUD.totalTimeSec - this.state.elapsedSec));
    const mm = Math.floor(remaining / 60);
    const ss = remaining % 60;
    this.timerText.setText(`${mm}:${ss.toString().padStart(2, "0")}`);
  }

  private refreshWave(): void {
    this.waveText.setText(
      `${this.state.wave.toString().padStart(2, "0")} / ${HUD.totalWaves}`,
    );

    const inWave = Phaser.Math.Clamp(this.state.waveElapsedSec / this.state.waveSec, 0, 1);
    const x = this.waveProgress.getData("x") as number;
    const y = this.waveProgress.getData("y") as number;
    this.waveProgress.clear();
    this.waveProgress.fillStyle(0x6effe0, 1);
    this.waveProgress.fillRoundedRect(
      x,
      y,
      Math.max(2, this.waveBarGeom.w * inWave),
      this.waveBarGeom.h,
      3,
    );
  }

  private flashWave(): void {
    this.scene.tweens.add({
      targets: this.waveText,
      scale: { from: 1.4, to: 1 },
      duration: 320,
      ease: "Back.out",
    });
  }

  private buildMercBar(): void {
    this.mercBar = this.scene.add.container(0, 0).setScrollFactor(0);
    this.layer.add(this.mercBar);
  }

  private createSlot(id: string): MercSlot {
    const info = MERC_HUD[id];
    const box = HUD.slotBox;
    const container = this.scene.add.container(0, 0).setScrollFactor(0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLOR.panelFill, 0.9);
    bg.fillRoundedRect(-box / 2, -box / 2, box, box, 8);
    bg.lineStyle(2, info.color, 0.9);
    bg.strokeRoundedRect(-box / 2, -box / 2, box, box, 8);
    container.add(bg);

    if (this.scene.textures.exists(info.tex)) {
      const cropW = 34;
      const cropH = 42;
      const icon = this.scene.add
        .sprite(0, -2, info.tex, 0)
        .setOrigin(0.5, 0.5)
        .setCrop((100 - cropW) / 2, (100 - cropH) / 2, cropW, cropH)
        .setScale((box - 10) / cropH);
      container.add(icon);
    } else {
      container.add(
        this.scene.add
          .text(0, 0, info.label[0], {
            fontFamily: FONT,
            fontSize: "22px",
            color: COLOR.bone,
          })
          .setOrigin(0.5),
      );
    }

    container.add(
      this.scene.add
        .text(0, box / 2 + 4, info.label, {
          fontFamily: FONT,
          fontSize: "12px",
          color: COLOR.bone,
        })
        .setOrigin(0.5, 0)
        .setShadow(0, 1, "#000", 3, false, true),
    );

    const badge = this.scene.add.container(box / 2 - 6, -box / 2 + 6).setVisible(false);
    const badgeBg = this.scene.add.graphics();
    badgeBg.fillStyle(info.color, 1);
    badgeBg.fillCircle(0, 0, 11);
    const badgeText = this.scene.add
      .text(0, 0, "x1", {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#0a0610",
      })
      .setOrigin(0.5);
    badge.add([badgeBg, badgeText]);
    container.add(badge);

    this.mercBar.add(container);
    return { id, container, badge, badgeText, count: 1 };
  }

  private layoutMercBar(): void {
    const box = HUD.slotBox;
    const step = box + HUD.slotGap;
    const totalW = this.slots.length * box + (this.slots.length - 1) * HUD.slotGap;
    const startX = (GAME_WIDTH - totalW) / 2 + box / 2;
    const y = GAME_HEIGHT - HUD.margin - box / 2 - 14;
    this.slots.forEach((slot, i) => slot.container.setPosition(startX + i * step, y));
  }

  private buildBossBar(): void {
    const { w, h, x, y } = this.bossBarGeom;
    this.bossBar = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD.depth + 1)
      .setVisible(false);

    const panel = this.scene.add.graphics();
    panel.fillStyle(COLOR.panelFill, 0.92);
    panel.fillRoundedRect(x - 12, y - 30, w + 24, h + 44, 8);
    panel.lineStyle(2, 0xc41e1e, 0.85);
    panel.strokeRoundedRect(x - 12, y - 30, w + 24, h + 44, 8);

    this.bossNameText = this.scene.add
      .text(GAME_WIDTH / 2, y - 26, "", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ff7a6b",
      })
      .setOrigin(0.5, 0)
      .setShadow(0, 1, "#000", 3, false, true);

    const track = this.scene.add.graphics();
    track.fillStyle(COLOR.hpTrack, 1);
    track.fillRoundedRect(x, y, w, h, 4);

    this.bossHpFill = this.scene.add.graphics();

    this.bossBar.add([panel, this.bossNameText, track, this.bossHpFill]);
    this.layer.add(this.bossBar);
  }

  /** 보스 라운드 시작 시 보스 체력바를 띄운다. */
  showBossBar(label: string, maxHp: number): void {
    this.bossMaxHp = Math.max(1, maxHp);
    this.bossNameText.setText(`⚔ ${label}`);
    this.bossBar.setVisible(true);
    this.updateBossHp(maxHp);
    this.scene.tweens.add({
      targets: this.bossBar,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: "Quad.out",
    });
  }

  /** 보스 현재 체력을 바에 반영한다. */
  updateBossHp(hp: number): void {
    const { w, h, x, y } = this.bossBarGeom;
    const ratio = Phaser.Math.Clamp(hp / this.bossMaxHp, 0, 1);
    this.bossHpFill.clear();
    if (ratio > 0) {
      this.bossHpFill.fillStyle(0xe0382f, 1);
      this.bossHpFill.fillRoundedRect(x, y, Math.max(2, w * ratio), h, 4);
    }
  }

  hideBossBar(): void {
    this.bossBar.setVisible(false);
  }

  private buildControlsHint(): void {
    this.layer.add(
      this.scene.add
        .text(
          HUD.margin,
          GAME_HEIGHT - HUD.margin,
          "[WASD / 방향키] 이동 · [ESC] 타이틀",
          {
            fontFamily: FONT,
            fontSize: "12px",
            color: COLOR.ash,
          },
        )
        .setOrigin(0, 1)
        .setScrollFactor(0)
        .setShadow(0, 1, "#000", 3, false, true),
    );
  }

  private panel(
    x: number,
    y: number,
    w: number,
    h: number,
    accent: number,
  ): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setScrollFactor(0);
    g.fillStyle(COLOR.panelFill, 0.82);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, accent, 0.45);
    g.strokeRoundedRect(x, y, w, h, 8);
    return g;
  }
}
