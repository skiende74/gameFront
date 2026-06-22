import { useState, type ReactNode } from "react";
import {
  GAME_RESTART_REQUEST_EVENT,
  GAME_RESUME_REQUEST_EVENT,
} from "./hudEvents.ts";
import type { HudResult } from "./hudTypes.ts";
import { PixelIcon } from "./HudIcons.tsx";
import { recordScore, saveGameRecord } from "./bestScore.ts";

const GAME_EXIT_EVENT = "game:exit";

function dispatch(type: string): void {
  window.dispatchEvent(new CustomEvent(type));
}

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function OverlayButton({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`h-12 w-full rounded-[6px] border-2 bg-dungeon-stone text-base text-bone-white shadow-[inset_1px_1px_0_rgba(236,226,200,0.12),0_0_0_2px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:bg-dungeon-mid sm:h-[52px] sm:w-[280px] sm:text-xl ${
        danger ? "hover:border-blood-red" : "hover:border-torch-core"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-bone-white/30 bg-black/45 px-1 font-pixel-en text-[9px] leading-none text-bone-white/90 shadow-[inset_0_-2px_0_rgba(0,0,0,0.55)]">
      {children}
    </kbd>
  );
}

export function PauseOverlay() {
  return (
    <div className="modal-backdrop pointer-events-auto absolute inset-0 z-10 flex items-center justify-center overflow-y-auto bg-dungeon-deepest/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="modal-pop flex max-h-[calc(100dvh-16px)] w-full max-w-[360px] flex-col items-center overflow-y-auto rounded-[6px] border-2 border-bone-white/70 bg-dungeon-deepest/95 px-5 py-6 shadow-[inset_1px_1px_0_rgba(236,226,200,0.12),0_0_0_2px_rgba(0,0,0,0.65),0_0_42px_rgba(255,122,58,0.18),0_18px_52px_rgba(0,0,0,0.78)] sm:px-8 sm:py-9">
        <PixelIcon name="pause" className="emblem-in h-10 w-10 text-torch-core drop-shadow-[0_0_12px_rgba(255,122,58,0.6)]" />
        <h2 className="mt-4 text-2xl text-bone-white drop-shadow-[0_0_10px_rgba(255,213,138,0.35)] sm:text-3xl">일시정지</h2>
        <div className="mt-3 hidden items-center gap-1.5 text-sm text-ash-grey sm:flex">
          <KeyCap>ESC</KeyCap> 로 돌아가기
        </div>
        <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:gap-4">
          <OverlayButton onClick={() => dispatch(GAME_RESUME_REQUEST_EVENT)}>돌아가기</OverlayButton>
          <OverlayButton danger onClick={() => dispatch(GAME_EXIT_EVENT)}>나가기</OverlayButton>
        </div>
      </section>
    </div>
  );
}

function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <>
      <dt className="text-ash-grey">{label}</dt>
      <dd className={`text-right font-pixel-en ${accent ? "text-torch-core" : "text-bone-white"}`}>{value}</dd>
    </>
  );
}

export function ResultOverlay({ result }: { result: HudResult }) {
  const [{ best, isNewRecord }] = useState(() => {
    saveGameRecord(result);
    return recordScore(result.finalScore);
  });

  const theme = result.victory
    ? {
        title: "생존 성공!",
        icon: "star" as const,
        border: "border-torch-core/75",
        glow: "0 0 44px rgba(255,122,58,0.24)",
        titleClass: "victory-glow text-torch-core",
        emblemClass: "text-torch-core drop-shadow-[0_0_14px_rgba(255,213,138,0.7)]",
        scoreColor: "text-torch-core",
      }
    : {
        title: "패배",
        icon: "skull" as const,
        border: "border-blood-red/70",
        glow: "0 0 44px rgba(196,30,30,0.28)",
        titleClass: "text-blood-red",
        emblemClass: "text-blood-red drop-shadow-[0_0_14px_rgba(196,30,30,0.7)]",
        scoreColor: "text-blood-red",
      };

  const boxShadow = `inset 1px 1px 0 rgba(236,226,200,0.12), 0 0 0 2px rgba(0,0,0,0.65), ${theme.glow}, 0 18px 52px rgba(0,0,0,0.78)`;

  return (
    <div className="modal-backdrop pointer-events-auto absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-dungeon-deepest/85 p-2 backdrop-blur-sm sm:p-4">
      <section
        className={`modal-pop flex max-h-[calc(100dvh-16px)] w-full max-w-[440px] flex-col items-center overflow-y-auto rounded-[6px] border-2 ${theme.border} bg-dungeon-deepest/95 px-5 py-6 sm:px-8 sm:py-9`}
        style={{ boxShadow }}
      >
        <PixelIcon name={theme.icon} className={`emblem-in h-10 w-10 sm:h-12 sm:w-12 ${theme.emblemClass}`} />
        <h2 className={`mt-3 text-3xl sm:text-4xl ${theme.titleClass}`}>{theme.title}</h2>

        <div className="mt-5 flex w-full flex-col items-center rounded-[6px] border border-bone-white/15 bg-black/30 py-3 sm:mt-6 sm:py-4">
          <div className="flex items-center gap-2 font-pixel-en text-[10px] tracking-[0.22em] text-ash-grey">
            최종 점수
            {isNewRecord && (
              <span className="title-glow rounded-[3px] border border-torch-core/70 bg-torch-core/15 px-1.5 py-0.5 text-torch-core">
                NEW!
              </span>
            )}
          </div>
          <div className={`mt-1 font-pixel-en text-4xl sm:text-5xl ${theme.scoreColor} drop-shadow-[0_0_14px_rgba(255,122,58,0.4)]`}>
            {result.finalScore}
          </div>
          <div className="mt-1 font-pixel-en text-[10px] text-ash-grey/70">
            {isNewRecord ? "신기록 달성!" : `최고 ${best}`}
          </div>
        </div>

        <dl className="mt-4 grid w-full grid-cols-[1fr_auto] gap-x-5 gap-y-2 rounded-[6px] border border-bone-white/10 bg-black/25 px-4 py-3 text-sm sm:mt-5 sm:py-4 sm:text-base">
          <StatRow label="생존 시간" value={formatElapsed(result.elapsedSec)} />
          <StatRow label="처치 수" value={String(result.kills)} />
          <StatRow label="처치 점수" value={String(result.score)} />
          <StatRow label="도달 웨이브" value={`${result.wave} / 20`} />
        </dl>

        <div className="mt-6 flex w-full flex-col gap-3 sm:mt-7 sm:w-auto">
          <OverlayButton onClick={() => dispatch(GAME_RESTART_REQUEST_EVENT)}>다시 시작</OverlayButton>
          <OverlayButton danger onClick={() => dispatch(GAME_EXIT_EVENT)}>나가기</OverlayButton>
        </div>
      </section>
    </div>
  );
}
