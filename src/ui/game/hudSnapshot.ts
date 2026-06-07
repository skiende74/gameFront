import { HUD, MERC_HUD } from "../../game/config.ts";
import { MERC_COMBAT } from "../../game/data/mercs.ts";
import { COMBO_SYNERGIES } from "../../game/data/synergies.ts";
import { RANK_BADGE, applyRankToCombat, type UnitRank } from "../../game/data/unitRanks.ts";
import type {
  GameHudSnapshot,
  HudBoss,
  HudPartyUnit,
  HudResultMerc,
  HudResultSynergy,
  HudStateSource,
  HudSynergyRow,
} from "./hudTypes";

const CLASS_LABELS: Record<string, string> = {
  sword: "검사",
  bow: "궁수",
  mage: "마법사",
  cleric: "성직자",
};

const CLASS_SPRITES: Record<string, { folder: string; file: string }> = {
  sword: { folder: "Swordsman", file: "Swordsman" },
  bow: { folder: "Archer", file: "Archer" },
  mage: { folder: "Wizard", file: "Wizard" },
  cleric: { folder: "Priest", file: "Priest" },
};

const ASSET_BASE = "/assets/Tiny RPG Character Asset Pack v1.03 -Full 20 Characters/Characters(100x100)";

const SYNERGY_TEXT: Record<string, { name: string; effect: string }> = {
  "cover-fire": { name: "엄호 사격", effect: "궁수 공격력 +15%" },
  "rally-blast": { name: "집결 폭발", effect: "마법사 폭발 반경 +25" },
  "guard-oath": { name: "수호 서약", effect: "받는 피해 -15%" },
  barrage: { name: "포격대", effect: "원거리 사거리 +30, 공격력 +15%" },
  "blessed-arrow": { name: "축복의 화살", effect: "궁수 공격속도 +20%" },
  "purge-flame": { name: "정화의 불꽃", effect: "마법사 공격력 +20%" },
  annihilation: { name: "섬멸전", effect: "전체 공격력 +20%" },
  expedition: { name: "원정대", effect: "전체 공격력 +10%, 받는 피해 -10%" },
  "rear-battery": { name: "후방 포대", effect: "원거리 공격력 +30%, 받는 피해 +20%" },
  "four-square": { name: "사방진", effect: "전체 공격력 +10%, 공격속도 +10%, 받는 피해 -10%" },
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function classLabel(id: string): string {
  return CLASS_LABELS[id] ?? MERC_HUD[id]?.label ?? id;
}

function classColor(id: string): string {
  return hexColor(MERC_HUD[id]?.color ?? 0xffffff);
}

function spriteUrl(id: string): string {
  const sprite = CLASS_SPRITES[id];
  if (!sprite) return "";
  return encodeURI(`${ASSET_BASE}/${sprite.folder}/${sprite.folder}/${sprite.file}-Idle.png`);
}

function partyUnitSnapshot(unit: HudStateSource["party"][number]): HudPartyUnit | null {
  const combatBase = MERC_COMBAT[unit.id];
  if (!combatBase) return null;

  const rank = unit.rank as UnitRank;
  const combat = applyRankToCombat(combatBase, rank);
  const label = classLabel(unit.id);
  const power = combat.role === "heal" ? `회복 ${combat.heal ?? 0}` : `공격 ${combat.atk}`;
  const tooltip = [
    `${label} ${rank}등급(${RANK_BADGE[rank]})`,
    power,
    `쿨타임 ${(combat.cooldownMs / 1000).toFixed(2)}s`,
  ];

  if (combat.range > 0) tooltip.push(`사거리 ${combat.range}px`);
  if (combat.aoeRadius) tooltip.push(`폭발반경 ${combat.aoeRadius}px`);

  return {
    uid: unit.uid,
    id: unit.id,
    label,
    color: classColor(unit.id),
    spriteUrl: spriteUrl(unit.id),
    rank,
    badge: RANK_BADGE[rank],
    isPlayer: unit.isPlayer === true,
    tooltip,
  };
}

function synergyRows(party: HudStateSource["party"]): HudSynergyRow[] {
  const present = new Set(party.map((unit) => unit.id));
  return COMBO_SYNERGIES.map((combo) => {
    const have = combo.classes.filter((id) => present.has(id)).length;
    const active = have === combo.classes.length;
    const text = SYNERGY_TEXT[combo.key] ?? { name: combo.name, effect: combo.desc };
    const labels = combo.classes.map(classLabel);
    const missingLabels = combo.classes.filter((id) => !present.has(id)).map(classLabel);
    const tooltip = [
      active ? text.name : `${text.name} (미발동)`,
      `필요: ${labels.join(" + ")}`,
      text.effect,
    ];

    if (!active) tooltip.push(`${missingLabels.join(", ")} 합류 시 발동`);

    return {
      key: combo.key,
      name: text.name,
      active,
      progressLabel: `${have}/${combo.classes.length}`,
      missingLabels,
      classes: combo.classes.map((id) => ({
        id,
        label: classLabel(id),
        color: classColor(id),
        present: present.has(id),
      })),
      tooltip,
      have,
    };
  })
    .filter((row) => row.have > 0)
    .sort((a, b) => Number(b.active) - Number(a.active) || b.have - a.have)
    .map((row) => ({
      key: row.key,
      name: row.name,
      active: row.active,
      progressLabel: row.progressLabel,
      missingLabels: row.missingLabels,
      classes: row.classes,
      tooltip: row.tooltip,
    }));
}

/** 결과/기록 저장용 용병 요약 목록을 만든다. */
export function resultMercsFromSnapshot(snapshot: GameHudSnapshot): HudResultMerc[] {
  return snapshot.party.map((unit) => ({
    id: unit.id,
    label: unit.label,
    color: unit.color,
    rank: unit.rank,
    badge: unit.badge,
    isPlayer: unit.isPlayer,
  }));
}

/** 결과/기록 저장용 시너지 요약 목록을 만든다(현재 보유 중인 조합만). */
export function resultSynergiesFromSnapshot(snapshot: GameHudSnapshot): HudResultSynergy[] {
  return snapshot.synergies.map((row) => ({
    key: row.key,
    name: row.name,
    progressLabel: row.progressLabel,
    active: row.active,
  }));
}

export function buildHudSnapshot(source: HudStateSource, boss: HudBoss | null = null): GameHudSnapshot {
  const remainingSec = Math.max(0, Math.ceil(HUD.totalTimeSec - source.elapsedSec));
  return {
    hp: {
      current: source.hp,
      max: source.maxHp,
      ratio: clamp01(source.hp / source.maxHp),
    },
    time: {
      elapsedSec: source.elapsedSec,
      remainingSec,
      label: formatTime(remainingSec),
    },
    wave: {
      current: source.wave,
      total: HUD.totalWaves,
      progress: clamp01(source.waveElapsedSec / source.waveSec),
      label: `${source.wave.toString().padStart(2, "0")} / ${HUD.totalWaves}`,
    },
    stats: {
      kills: source.kills,
      score: source.score,
      coins: source.coins,
      finalScore: source.finalScore,
    },
    party: source.party.map(partyUnitSnapshot).filter((unit) => unit !== null),
    synergies: synergyRows(source.party),
    boss,
  };
}
