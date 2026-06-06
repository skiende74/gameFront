import { useEffect, useState } from "react";
import {
  rollUpgradeChoices,
  type UpgradeDef,
} from "../game/data/upgrades";

type UpgradeRequest = {
  completedWave: number;
  nextWave: number;
  blockedHireIds?: string[];
  score: number;
};

const CHOICE_COUNT = 5;
const REROLL_COST = 100;

export function UpgradeModal() {
  const [request, setRequest] = useState<UpgradeRequest | null>(null);
  const [choices, setChoices] = useState<UpgradeDef[]>([]);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const onRequest = (event: WindowEventMap["game:upgrade-request"]) => {
      setRequest(event.detail);
      setPoints(event.detail.score ?? 0);
      setChoices(rollUpgradeChoices(CHOICE_COUNT, { excludeHireIds: event.detail.blockedHireIds }));
    };

    window.addEventListener("game:upgrade-request", onRequest);
    return () => window.removeEventListener("game:upgrade-request", onRequest);
  }, []);

  if (!request) return null;

  const selectUpgrade = (upgrade: UpgradeDef) => {
    window.dispatchEvent(
      new CustomEvent("game:upgrade-selected", { detail: { upgradeId: upgrade.id } }),
    );
    setRequest(null);
    setChoices([]);
  };

  const canReroll = points >= REROLL_COST;

  const reroll = () => {
    if (!canReroll) return;
    setPoints((prev) => prev - REROLL_COST);
    setChoices(rollUpgradeChoices(CHOICE_COUNT, { excludeHireIds: request.blockedHireIds }));
    window.dispatchEvent(
      new CustomEvent("game:upgrade-reroll", { detail: { cost: REROLL_COST } }),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 font-pixel-ko"
      role="dialog"
      aria-modal="true"
      aria-label="업그레이드 선택"
    >
      <div className="w-full max-w-4xl border-4 border-torch-core/70 bg-dungeon-deepest/95 p-5 shadow-[0_0_40px_rgba(255,122,58,0.35)]">
        <div className="mb-5 text-center">
          <div className="font-pixel-en text-[10px] tracking-[0.24em] text-torch-flame/70">
            WAVE CLEAR
          </div>
          <h2 className="mt-2 text-2xl text-torch-core">
            웨이브 {request.completedWave} 종료
          </h2>
          <p className="mt-2 text-sm text-ash-grey">
            카드 1장을 선택하면 웨이브 {request.nextWave}가 시작됩니다.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {choices.map((upgrade) => (
            <button
              key={upgrade.id}
              type="button"
              className="group flex min-h-40 flex-col border-2 border-bone-white/25 bg-dungeon-stone/90 p-3 text-left transition hover:-translate-y-1 hover:border-torch-core hover:shadow-[0_0_24px_rgba(255,122,58,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-torch-core"
              onClick={() => selectUpgrade(upgrade)}
            >
              <div className="text-lg text-bone-white group-hover:text-torch-core">
                {upgrade.title}
              </div>
              <div className="mt-3 flex-1 text-sm leading-relaxed text-ash-grey">
                {upgrade.desc}
              </div>
              <div className="mt-4 border-t border-bone-white/15 pt-3 font-pixel-en text-[10px] leading-relaxed text-torch-core">
                {upgrade.effect}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-bone-white/15 pt-4">
          <div className="text-sm text-ash-grey">
            보유 포인트{" "}
            <span className="font-pixel-en text-base text-torch-core">{points}P</span>
          </div>
          <button
            type="button"
            disabled={!canReroll}
            className="border-2 border-torch-core/60 bg-dungeon-stone/90 px-4 py-2 text-sm text-bone-white transition hover:border-torch-core hover:text-torch-core disabled:cursor-not-allowed disabled:border-bone-white/15 disabled:text-ash-grey/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-torch-core"
            onClick={reroll}
          >
            새로고침 <span className="font-pixel-en">({REROLL_COST}P)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
