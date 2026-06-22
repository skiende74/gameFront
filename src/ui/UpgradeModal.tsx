import { useEffect, useState, type CSSProperties } from "react";
import {
  rollUpgradeChoices,
  UPGRADE_TIERS,
  type UpgradeDef,
} from "../game/data/upgrades";
import { PixelIcon } from "./game/HudIcons.tsx";

type UpgradeRequest = {
  completedWave: number;
  nextWave: number;
  blockedHireIds?: string[];
  score: number;
  coins: number;
};

const CHOICE_COUNT = 5;
const REROLL_COST = 100;

export function UpgradeModal() {
  const [request, setRequest] = useState<UpgradeRequest | null>(null);
  const [choices, setChoices] = useState<UpgradeDef[]>([]);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const onRequest = (event: WindowEventMap["game:upgrade-request"]) => {
      setRequest(event.detail);
      setCoins(event.detail.coins ?? 0);
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

  const canReroll = coins >= REROLL_COST;

  const reroll = () => {
    if (!canReroll) return;
    setCoins((prev) => prev - REROLL_COST);
    setChoices(rollUpgradeChoices(CHOICE_COUNT, { excludeHireIds: request.blockedHireIds }));
    window.dispatchEvent(
      new CustomEvent("game:upgrade-reroll", { detail: { cost: REROLL_COST } }),
    );
  };

  return (
    <div
      className="modal-backdrop touch-scroll fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-dungeon-deepest/85 p-2 font-pixel-ko backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="업그레이드 선택"
    >
      <div
        className="modal-pop touch-scroll flex max-h-[calc(100dvh-16px)] w-full max-w-4xl flex-col items-center overflow-y-auto rounded-[6px] border-2 border-torch-core/75 bg-dungeon-deepest/95 px-3 py-4 sm:px-6 sm:py-7 [@media(max-height:480px)]:py-3"
        style={{
          boxShadow:
            "inset 1px 1px 0 rgba(236,226,200,0.12), 0 0 0 2px rgba(0,0,0,0.65), 0 0 44px rgba(255,122,58,0.24), 0 18px 52px rgba(0,0,0,0.78)",
        }}
      >
        <div className="mb-4 flex flex-col items-center text-center lg:mb-6 [@media(max-height:480px)]:mb-3">
          <PixelIcon
            name="star"
            className="emblem-in h-8 w-8 text-torch-core drop-shadow-[0_0_14px_rgba(255,213,138,0.7)] sm:h-10 sm:w-10 [@media(max-height:480px)]:hidden"
          />
          <div className="mt-2 font-pixel-en text-[9px] tracking-[0.24em] text-torch-flame/70 sm:mt-3 sm:text-[10px]">
            WAVE CLEAR
          </div>
          <h2 className="victory-glow mt-1 text-xl text-torch-core sm:mt-2 sm:text-3xl">
            웨이브 {request.completedWave} 종료
          </h2>
          <p className="mt-1 text-[11px] text-ash-grey sm:mt-2 sm:text-sm [@media(max-height:480px)]:hidden">
            카드 1장을 선택하면 웨이브 {request.nextWave}가 시작됩니다.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-5 lg:gap-3">
          {choices.map((upgrade) => {
            const tier = UPGRADE_TIERS[upgrade.tier];
            return (
              <button
                key={upgrade.id}
                type="button"
                className="upgrade-card group flex min-h-28 flex-col rounded-[6px] border-2 bg-dungeon-stone/90 p-2 text-left lg:min-h-40 lg:p-3 [@media(max-height:480px)]:min-h-[120px]"
                style={
                  {
                    "--tier-color": tier.color,
                    "--tier-glow": tier.glow,
                  } as CSSProperties
                }
                onClick={() => selectUpgrade(upgrade)}
              >
                <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
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
                <div className="text-base text-bone-white transition-colors group-hover:text-(--tier-color) sm:text-lg [@media(max-height:480px)]:text-sm">
                  {upgrade.title}
                </div>
                <div className="mt-1.5 max-h-none flex-1 overflow-hidden text-xs leading-relaxed text-ash-grey sm:mt-2 sm:text-sm [@media(max-height:480px)]:max-h-[2.4em] [@media(max-height:480px)]:leading-snug">
                  {upgrade.desc}
                </div>
                <div
                  className="mt-2 max-h-none overflow-hidden border-t pt-2 font-pixel-en text-[9px] leading-relaxed lg:mt-4 lg:pt-3 lg:text-[10px] [@media(max-height:480px)]:max-h-[2.3em] [@media(max-height:480px)]:leading-snug"
                  style={{ borderColor: `${tier.color}33`, color: tier.color }}
                >
                  {upgrade.effect}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex w-full flex-col gap-3 border-t border-bone-white/15 pt-2 sm:flex-row sm:items-center sm:justify-between lg:mt-6 lg:pt-4">
          <div className="flex items-center gap-1.5 text-sm text-ash-grey">
            <PixelIcon name="coin" className="h-3.5 w-3.5 text-coin-gold drop-shadow-[0_0_6px_rgba(255,224,102,0.6)]" />
            보유 코인{" "}
            <span className="font-pixel-en text-base text-coin-gold">{coins}</span>
          </div>
          <button
            type="button"
            disabled={!canReroll}
            className="flex w-full items-center justify-center gap-1.5 border-2 border-torch-core/60 bg-dungeon-stone/90 px-4 py-2 text-sm text-bone-white transition hover:border-torch-core hover:text-torch-core disabled:cursor-not-allowed disabled:border-bone-white/15 disabled:text-ash-grey/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-torch-core sm:w-auto"
            onClick={reroll}
          >
            새로고침{" "}
            <span className="flex items-center gap-1 font-pixel-en">
              <PixelIcon name="coin" className="h-3 w-3 text-coin-gold" />
              {REROLL_COST}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
