import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HUD, MERC_HUD } from "../config";
import { MERC_COMBAT } from "../data/mercs";
import { RANK_BADGE, applyRankToCombat } from "../data/unitRanks";
import { GAME_EVENT, type GameState } from "../state/GameState";
import type { PartyUnit } from "../state/partyUnits";
import { COMBO_SYNERGIES, presentClasses, type ComboSynergy } from "../data/synergies";

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
  private mercTooltip!: Phaser.GameObjects.Container;
  private mercTooltipBg!: Phaser.GameObjects.Graphics;
  private mercTooltipText!: Phaser.GameObjects.Text;

  private synergyPanel!: Phaser.GameObjects.Container;
  private readonly synergyGeom = {
    x: HUD.margin,
    y: HUD.margin + HUD.panelHeight + 8 + 42 + 12,
    w: 214,
    rowH: 28,
    headerH: 26,
  };

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
    this.buildSynergyPanel();
    this.buildBossBar();
    this.buildControlsHint();
    this.buildMercTooltip();

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
  private syncParty(party: PartyUnit[]): void {
    this.hideTooltip();
    for (const slot of this.slots) slot.container.destroy();
    this.slots.length = 0;

    for (const unit of party) {
      if (!MERC_HUD[unit.id]) continue;
      const slot = this.createSlot(unit.id);
      slot.count = unit.rank;
      slot.badgeText.setText(RANK_BADGE[unit.rank]);
      slot.badge.setVisible(unit.rank > 1);
      this.attachTooltip(slot, unit);
      this.slots.push(slot);
    }
    this.layoutMercBar();
    this.refreshSynergy(presentClasses(party));
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
    container
      .setSize(box, box + 22)
      .setInteractive(
        new Phaser.Geom.Rectangle(-box / 2, -box / 2, box, box + 22),
        Phaser.Geom.Rectangle.Contains,
      );

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

  private buildMercTooltip(): void {
    this.mercTooltip = this.scene.add.container(0, 0).setScrollFactor(0).setVisible(false);
    this.mercTooltipBg = this.scene.add.graphics().setScrollFactor(0);
    this.mercTooltipText = this.scene.add
      .text(10, 8, "", {
        fontFamily: FONT,
        fontSize: "12px",
        color: COLOR.bone,
        lineSpacing: 4,
      })
      .setScrollFactor(0);
    this.mercTooltip.add([this.mercTooltipBg, this.mercTooltipText]);
    this.layer.add(this.mercTooltip);
  }

  private attachTooltip(slot: MercSlot, unit: PartyUnit): void {
    const show = (): void => {
      const anchorY = slot.container.y - HUD.slotBox / 2 - 8;
      this.showTooltip(this.tooltipTextFor(unit), slot.container.x, anchorY, MERC_HUD[unit.id].color, "above");
    };
    slot.container.on("pointerover", show);
    slot.container.on("pointermove", show);
    slot.container.on("pointerout", () => this.hideTooltip());
  }

  /** 공용 툴팁. place="above"는 앵커 위쪽, "right"는 앵커 오른쪽에 띄운다. */
  private showTooltip(
    text: string,
    anchorX: number,
    anchorY: number,
    accent: number,
    place: "above" | "right",
  ): void {
    this.mercTooltipText.setText(text);
    const w = Math.max(164, this.mercTooltipText.width + 20);
    const h = this.mercTooltipText.height + 16;
    const x = place === "right" ? anchorX + 10 : anchorX - w / 2;
    const y = place === "right" ? anchorY : anchorY - h;

    this.mercTooltipBg.clear();
    this.mercTooltipBg.fillStyle(COLOR.panelFill, 0.94);
    this.mercTooltipBg.fillRoundedRect(0, 0, w, h, 8);
    this.mercTooltipBg.lineStyle(2, accent, 0.85);
    this.mercTooltipBg.strokeRoundedRect(0, 0, w, h, 8);
    this.mercTooltip
      .setPosition(
        Phaser.Math.Clamp(x, 12, GAME_WIDTH - w - 12),
        Phaser.Math.Clamp(y, 12, GAME_HEIGHT - h - 12),
      )
      .setVisible(true);
  }

  private hideTooltip(): void {
    if (this.mercTooltip) this.mercTooltip.setVisible(false);
  }

  private tooltipTextFor(unit: PartyUnit): string {
    const info = MERC_HUD[unit.id];
    const combat = applyRankToCombat(MERC_COMBAT[unit.id], unit.rank);
    const power = combat.role === "heal" ? `회복 ${combat.heal ?? 0}` : `공격 ${combat.atk}`;
    const lines = [
      `${info.label} ${unit.rank}성 (${RANK_BADGE[unit.rank]})`,
      power,
      `쿨타임 ${(combat.cooldownMs / 1000).toFixed(2)}s`,
    ];
    if (combat.range > 0) lines.push(`사거리 ${combat.range}px`);
    if (combat.aoeRadius) lines.push(`폭발반경 ${combat.aoeRadius}px`);
    return lines.join("\n");
  }

  private buildSynergyPanel(): void {
    this.synergyPanel = this.scene.add.container(0, 0).setScrollFactor(0);
    this.layer.add(this.synergyPanel);
  }

  /**
   * 좌측 조합(시너지) 패널을 다시 그린다. 롤토체스처럼 보유 직업이 하나라도 들어간 시너지는
   * 미발동이어도 회색으로 미리 보여주고, 발동한 것은 강조한다. 행 호버 시 효과 툴팁이 뜬다.
   */
  private refreshSynergy(present: Set<string>): void {
    if (!this.synergyPanel) return;
    this.synergyPanel.removeAll(true);
    this.hideTooltip();

    const rows = COMBO_SYNERGIES.map((combo) => {
      const have = combo.classes.filter((id) => present.has(id)).length;
      return { combo, have, active: have === combo.classes.length };
    })
      .filter((row) => row.have > 0)
      .sort((a, b) => Number(b.active) - Number(a.active) || b.have - a.have);
    if (rows.length === 0) return;

    const { x, y, w, rowH, headerH } = this.synergyGeom;
    const panelH = headerH + rows.length * rowH + 8;

    const bg = this.scene.add.graphics().setScrollFactor(0);
    bg.fillStyle(COLOR.panelFill, 0.82);
    bg.fillRoundedRect(x, y, w, panelH, 8);
    bg.lineStyle(2, 0xc47aff, 0.4);
    bg.strokeRoundedRect(x, y, w, panelH, 8);
    this.synergyPanel.add(bg);

    this.synergyPanel.add(
      this.scene.add
        .text(x + 12, y + 7, "시너지", { fontFamily: FONT, fontSize: "13px", color: COLOR.bone })
        .setScrollFactor(0),
    );

    rows.forEach((row, i) =>
      this.drawSynergyRow(row.combo, present, row.active, y + headerH + i * rowH),
    );
  }

  private drawSynergyRow(
    combo: ComboSynergy,
    present: Set<string>,
    active: boolean,
    rowY: number,
  ): void {
    const { x, w, rowH } = this.synergyGeom;

    combo.classes.forEach((id, j) => {
      const dot = this.scene.add.graphics().setScrollFactor(0);
      dot.fillStyle(MERC_HUD[id]?.color ?? 0xffffff, present.has(id) ? 1 : 0.25);
      dot.fillCircle(x + 16 + j * 13, rowY + rowH / 2, 5);
      this.synergyPanel.add(dot);
    });

    const nameX = x + 16 + combo.classes.length * 13;
    this.synergyPanel.add(
      this.scene.add
        .text(nameX, rowY + 5, combo.name, {
          fontFamily: FONT,
          fontSize: "14px",
          color: active ? COLOR.timer : COLOR.ash,
        })
        .setScrollFactor(0),
    );

    const have = combo.classes.filter((id) => present.has(id)).length;
    this.synergyPanel.add(
      this.scene.add
        .text(x + w - 12, rowY + 6, `${have}/${combo.classes.length}`, {
          fontFamily: FONT,
          fontSize: "12px",
          color: active ? COLOR.timer : COLOR.ash,
        })
        .setOrigin(1, 0)
        .setScrollFactor(0),
    );

    const zone = this.scene.add
      .rectangle(x + w / 2, rowY + rowH / 2, w, rowH, 0x000000, 0)
      .setScrollFactor(0)
      .setInteractive();
    const show = (): void =>
      this.showTooltip(this.synergyTooltipText(combo, present, active), x + w, rowY, 0xc47aff, "right");
    zone.on("pointerover", show);
    zone.on("pointermove", show);
    zone.on("pointerout", () => this.hideTooltip());
    this.synergyPanel.add(zone);
  }

  /** 시너지 행 툴팁 텍스트. 발동이면 효과만, 미발동이면 부족한 직업 안내를 덧붙인다. */
  private synergyTooltipText(combo: ComboSynergy, present: Set<string>, active: boolean): string {
    const need = combo.classes
      .map((id) => MERC_HUD[id]?.label ?? id)
      .join(" + ");
    const header = active ? combo.name : `${combo.name} (미발동)`;
    const lines = [header, `필요: ${need}`, combo.desc];
    if (!active) {
      const missing = combo.classes
        .filter((id) => !present.has(id))
        .map((id) => MERC_HUD[id]?.label ?? id)
        .join(", ");
      lines.push(`▶ ${missing} 합류 시 발동`);
    }
    return lines.join("\n");
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
