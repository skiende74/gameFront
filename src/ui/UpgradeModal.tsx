import { useEffect, useState, type CSSProperties } from "react";
import {
  rollUpgradeChoices,
  UPGRADE_TIERS,
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
      <div className="w-full max-w-4xl rounded-[6px] border-2 border-torch-core/70 bg-dungeon-deepest/95 p-5 shadow-[inset_1px_1px_0_rgba(236,226,200,0.12),0_0_0_2px_rgba(0,0,0,0.65),0_0_42px_rgba(255,122,58,0.3),0_18px_52px_rgba(0,0,0,0.78)]">
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
          {choices.map((upgrade) => {
            const tier = UPGRADE_TIERS[upgrade.tier];
            return (
              <button
                key={upgrade.id}
                type="button"
                className="upgrade-card group flex min-h-40 flex-col rounded-[6px] border-2 bg-dungeon-stone/90 p-3 text-left"
                style={
                  {
                    "--tier-color": tier.color,
                    "--tier-glow": tier.glow,
                  } as CSSProperties
                }
                onClick={() => selectUpgrade(upgrade)}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rotate-45 border border-black/50"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span
                    className="font-pixel-en text-[8px] uppercase tracking-[0.18em]"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>
                <div className="text-lg text-bone-white transition-colors group-hover:text-(--tier-color)">
                  {upgrade.title}
                </div>
                <div className="mt-2 flex-1 text-sm leading-relaxed text-ash-grey">
                  {upgrade.desc}
                </div>
                <div
                  className="mt-4 border-t pt-3 font-pixel-en text-[10px] leading-relaxed"
                  style={{ borderColor: `${tier.color}33`, color: tier.color }}
                >
                  {upgrade.effect}
                </div>
              </button>
            );
          })}
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
