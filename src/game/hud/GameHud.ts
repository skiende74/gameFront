import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HUD, MERC_HUD } from "../config";

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
  private readonly layer: Phaser.GameObjects.Container;

  private elapsedSec = 0;
  private hp: number = HUD.playerMaxHp;
  private readonly maxHp: number = HUD.playerMaxHp;
  private wave = 1;

  private timerText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveProgress!: Phaser.GameObjects.Graphics;
  private hpFill!: Phaser.GameObjects.Graphics;
  private hpValueText!: Phaser.GameObjects.Text;

  private mercBar!: Phaser.GameObjects.Container;
  private readonly slots: MercSlot[] = [];

  private readonly hpPanel = { x: HUD.margin, y: HUD.margin, w: 264, h: HUD.panelHeight };
  private readonly hpBar = { x: HUD.margin + 14, y: HUD.margin + 30, w: 236, h: 14 };
  private readonly waveBarGeom = { w: 124, h: 6 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layer = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD.depth);
  }

  build(): void {
    this.buildTopBar();
    this.buildMercBar();
    this.buildControlsHint();
    this.refreshHp();
    this.refreshTimer();
    this.refreshWave();
  }

  update(deltaMs: number): void {
    const before = this.wave;
    this.elapsedSec = Math.min(HUD.totalTimeSec, this.elapsedSec + deltaMs / 1000);
    this.wave = Math.min(
      HUD.totalWaves,
      Math.floor(this.elapsedSec / HUD.waveSec) + 1,
    );
    this.refreshTimer();
    this.refreshWave();
    if (this.wave !== before) this.flashWave();
  }

  setHp(value: number): void {
    this.hp = Phaser.Math.Clamp(value, 0, this.maxHp);
    this.refreshHp();
  }

  addMerc(id: string): void {
    if (!MERC_HUD[id]) return;
    const existing = this.slots.find((s) => s.id === id);
    if (existing) {
      existing.count += 1;
      existing.badgeText.setText(`x${existing.count}`);
      existing.badge.setVisible(existing.count > 1);
      return;
    }
    this.slots.push(this.createSlot(id));
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
    const ratio = this.hp / this.maxHp;
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
    this.hpValueText.setText(`${Math.ceil(this.hp)} / ${this.maxHp}`);
  }

  private refreshTimer(): void {
    const elapsed = Math.floor(this.elapsedSec);
    const mm = Math.floor(elapsed / 60);
    const ss = elapsed % 60;
    this.timerText.setText(`${mm}:${ss.toString().padStart(2, "0")}`);
  }

  private refreshWave(): void {
    this.waveText.setText(
      `${this.wave.toString().padStart(2, "0")} / ${HUD.totalWaves}`,
    );

    const inWave = (this.elapsedSec % HUD.waveSec) / HUD.waveSec;
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
