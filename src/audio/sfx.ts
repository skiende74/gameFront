/**
 * 사운드 이펙트 — Web Audio API 합성 (외부 에셋 0)
 *
 * 설정 모달의 마스터/SFX 음량과 자동 연동 (localStorage).
 * AudioContext는 최초 유저 입력 시 lazy-init (브라우저 autoplay 정책 회피).
 */

const SETTINGS_LS_KEY = "dacon_game.settings.v1";

type SettingsShape = {
  master?: number;
  sfx?: number;
  music?: number;
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v / 100));
}

function getSfxVolume(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (!raw) return 0.8;
    const parsed = JSON.parse(raw) as SettingsShape;
    return clamp01(parsed.master ?? 80) * clamp01(parsed.sfx ?? 100);
  } catch {
    return 0.8;
  }
}

type BlipOpts = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  startOffset?: number;
  peak?: number;
};

function blip({
  freq,
  duration,
  type = "square",
  startOffset = 0,
  peak = 0.18,
}: BlipOpts): void {
  const c = getCtx();
  if (!c) return;
  const vol = getSfxVolume() * peak;
  if (vol <= 0.0001) return;

  const t0 = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playHover(): void {
  blip({ freq: 880, duration: 0.05, type: "square", peak: 0.08 });
}

export function playConfirm(): void {
  blip({ freq: 660, duration: 0.06, type: "square", peak: 0.15 });
  blip({
    freq: 990,
    duration: 0.1,
    type: "square",
    startOffset: 0.05,
    peak: 0.18,
  });
}

export function playCancel(): void {
  blip({ freq: 440, duration: 0.06, type: "square", peak: 0.12 });
  blip({
    freq: 330,
    duration: 0.1,
    type: "square",
    startOffset: 0.05,
    peak: 0.14,
  });
}

export function playOpen(): void {
  blip({ freq: 520, duration: 0.05, type: "triangle", peak: 0.12 });
  blip({
    freq: 780,
    duration: 0.08,
    type: "triangle",
    startOffset: 0.04,
    peak: 0.15,
  });
}
