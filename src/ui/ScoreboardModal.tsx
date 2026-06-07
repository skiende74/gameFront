import { useMemo, useState, type ReactNode } from "react";
import { useEventListener } from "usehooks-ts";
import {
  clearGameRecords,
  getBestScore,
  getGameRecords,
  type GameRecord,
} from "./game/bestScore.ts";
import type { HudResultMerc, HudResultSynergy } from "./game/hudTypes.ts";
import { PixelIcon } from "./game/HudIcons.tsx";

type Props = { open: boolean; onClose: () => void };

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function StatChip({
  icon,
  label,
  value,
  tone = "text-bone-white",
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[4px] border border-bone-white/10 bg-black/25 px-2 py-1.5">
      <span className="flex items-center gap-1 text-[9px] tracking-[0.12em] text-ash-grey/80">
        {icon}
        {label}
      </span>
      <span className={`mt-0.5 font-pixel-en text-sm ${tone}`}>{value}</span>
    </div>
  );
}

function MercChip({ merc }: { merc: HudResultMerc }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-[4px] border px-1.5 py-1 text-[11px] ${
        merc.isPlayer ? "border-torch-core/55 bg-torch-core/10" : "border-bone-white/12 bg-black/25"
      }`}
    >
      <span
        className="h-2 w-2 rotate-45 border border-black/60"
        style={{ backgroundColor: merc.color }}
      />
      <span className="text-bone-white/85">{merc.label}</span>
      {merc.rank > 1 && (
        <span
          className="ml-0.5 px-1 font-pixel-en text-[8px] leading-4 text-dungeon-deepest"
          style={{ backgroundColor: merc.color }}
        >
          {merc.badge}
        </span>
      )}
      {merc.isPlayer && <span className="text-[8px] text-torch-core">나</span>}
    </span>
  );
}

function SynergyChip({ syn }: { syn: HudResultSynergy }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-[4px] border px-1.5 py-1 text-[11px] ${
        syn.active
          ? "border-torch-core/55 bg-torch-core/12 text-torch-core"
          : "border-bone-white/12 bg-black/25 text-ash-grey/80"
      }`}
    >
      {syn.name}
      <span className="font-pixel-en text-[8px] opacity-80">{syn.progressLabel}</span>
    </span>
  );
}

function RecordCard({ record }: { record: GameRecord }) {
  const mercs = record.mercs ?? [];
  const synergies = record.synergies ?? [];

  return (
    <article
      className={`rounded-[6px] border-2 bg-dungeon-deepest/80 p-3 shadow-[inset_1px_1px_0_rgba(236,226,200,0.08),0_0_0_2px_rgba(0,0,0,0.5)] ${
        record.victory ? "border-torch-core/45" : "border-blood-red/40"
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PixelIcon
            name={record.victory ? "star" : "skull"}
            className={`h-4 w-4 ${record.victory ? "text-torch-core" : "text-blood-red"}`}
          />
          <span className={`text-sm ${record.victory ? "text-torch-core" : "text-blood-red"}`}>
            {record.victory ? "생존 성공" : "패배"}
          </span>
          <span className="font-pixel-en text-[9px] text-ash-grey/70">{formatDate(record.date)}</span>
        </div>
        <div className="text-right">
          <div className="font-pixel-en text-[8px] tracking-[0.18em] text-ash-grey/70">SCORE</div>
          <div
            className={`font-pixel-en text-xl ${record.victory ? "text-torch-core" : "text-blood-red"}`}
          >
            {record.finalScore}
          </div>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        <StatChip
          icon={<PixelIcon name="star" className="h-2.5 w-2.5 text-torch-core" />}
          label="점수"
          value={record.score}
          tone="text-torch-core"
        />
        <StatChip
          icon={<PixelIcon name="coin" className="h-2.5 w-2.5 text-coin-gold" />}
          label="코인"
          value={record.coins ?? 0}
          tone="text-coin-gold"
        />
        <StatChip
          icon={<PixelIcon name="sword" className="h-2.5 w-2.5 text-bone-white/80" />}
          label="처치"
          value={record.kills}
        />
        <StatChip
          icon={<PixelIcon name="wave" className="h-2.5 w-2.5 text-rune-cyan" />}
          label="웨이브"
          value={record.wave}
          tone="text-rune-cyan"
        />
        <StatChip
          icon={<PixelIcon name="clock" className="h-2.5 w-2.5 text-bone-white/80" />}
          label="생존"
          value={formatElapsed(record.elapsedSec)}
        />
      </div>

      {mercs.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 font-pixel-en text-[8px] tracking-[0.18em] text-ash-grey/70">용병</div>
          <div className="flex flex-wrap gap-1">
            {mercs.map((merc) => (
              <MercChip key={`${record.date}-${merc.id}-${merc.label}`} merc={merc} />
            ))}
          </div>
        </div>
      )}

      {synergies.length > 0 && (
        <div className="mt-2.5">
          <div className="mb-1 font-pixel-en text-[8px] tracking-[0.18em] text-ash-grey/70">시너지</div>
          <div className="flex flex-wrap gap-1">
            {synergies.map((syn) => (
              <SynergyChip key={`${record.date}-${syn.key}`} syn={syn} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export function ScoreboardModal({ open, onClose }: Props) {
  const [version, setVersion] = useState(0);
  const records = useMemo(() => (open ? getGameRecords() : []), [open, version]);
  const best = useMemo(() => (open ? getBestScore() : 0), [open, version]);

  useEventListener("keydown", (e) => {
    if (open && e.key === "Escape") onClose();
  });

  if (!open) return null;

  const handleClear = () => {
    clearGameRecords();
    setVersion((v) => v + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 font-pixel-ko backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="기록"
    >
      <div
        className="relative flex max-h-[86vh] w-full max-w-2xl flex-col border-4 border-bone-white/30 bg-dungeon-stone p-5 shadow-[0_0_40px_rgba(255,122,58,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b-2 border-bone-white/20 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-xl text-torch-core">기록</h2>
            <span className="flex items-center gap-1 font-pixel-en text-[10px] text-torch-flame">
              <PixelIcon name="star" className="h-3 w-3" />
              BEST {best}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                type="button"
                className="rounded-[4px] border border-bone-white/20 px-2 py-1 font-pixel-en text-[9px] text-ash-grey transition hover:border-blood-red/60 hover:text-blood-red"
                onClick={handleClear}
              >
                전체 삭제
              </button>
            )}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-2xl leading-none text-bone-white/60 transition-colors hover:text-torch-flame"
              onClick={onClose}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <PixelIcon name="skull" className="h-8 w-8 text-ash-grey/40" />
              <p className="text-sm text-ash-grey/70">아직 플레이 기록이 없습니다.</p>
              <p className="text-xs text-ash-grey/50">게임을 플레이하면 여기에 기록이 쌓입니다.</p>
            </div>
          ) : (
            records.map((record) => <RecordCard key={record.date} record={record} />)
          )}
        </div>
      </div>
    </div>
  );
}
