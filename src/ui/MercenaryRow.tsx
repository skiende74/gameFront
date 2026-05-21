type Mercenary = {
  id: string;
  label: string;
  role: string;
  stats: Array<{ k: string; v: string }>;
  glow: string;
  delay: string;
  Body: () => React.ReactElement;
};

/**
 * 픽셀 실루엣 4종 — 모두 16×24 viewBox.
 * 공통 몸통(머리·토르소·다리) 위에 클래스별 액세서리(검·활·지팡이·후광) 추가.
 * 모두 currentColor 사용 → CSS color로 한 번에 톤 조정.
 *
 * 수치는 기획서 6-2 표 기준.
 */

const Body = () => (
  <>
    <rect x="7" y="3" width="2" height="3" fill="currentColor" />
    <rect x="6" y="7" width="4" height="8" fill="currentColor" />
    <rect x="5" y="15" width="2" height="3" fill="currentColor" />
    <rect x="9" y="15" width="2" height="3" fill="currentColor" />
    <rect x="5" y="18" width="2" height="4" fill="currentColor" />
    <rect x="9" y="18" width="2" height="4" fill="currentColor" />
  </>
);

const SwordsmanBody = () => (
  <>
    <Body />
    <rect x="11" y="6" width="1" height="11" fill="currentColor" />
    <rect x="10" y="6" width="3" height="1" fill="currentColor" />
    <rect x="11" y="16" width="1" height="2" fill="currentColor" />
  </>
);

const ArcherBody = () => (
  <>
    <Body />
    <rect x="12" y="6" width="1" height="10" fill="currentColor" />
    <rect x="13" y="7" width="1" height="2" fill="currentColor" />
    <rect x="13" y="13" width="1" height="2" fill="currentColor" />
  </>
);

const MageBody = () => (
  <>
    <rect x="6" y="2" width="4" height="1" fill="currentColor" />
    <rect x="7" y="1" width="2" height="1" fill="currentColor" />
    <rect x="7" y="3" width="2" height="3" fill="currentColor" />
    <rect x="6" y="7" width="4" height="8" fill="currentColor" />
    <rect x="5" y="15" width="2" height="3" fill="currentColor" />
    <rect x="9" y="15" width="2" height="3" fill="currentColor" />
    <rect x="5" y="18" width="2" height="4" fill="currentColor" />
    <rect x="9" y="18" width="2" height="4" fill="currentColor" />
    <rect x="12" y="6" width="1" height="12" fill="currentColor" />
    <rect x="11" y="5" width="3" height="2" fill="currentColor" />
  </>
);

const ClericBody = () => (
  <>
    <rect x="6" y="1" width="4" height="1" fill="currentColor" />
    <rect x="6" y="3" width="1" height="1" fill="currentColor" />
    <rect x="9" y="3" width="1" height="1" fill="currentColor" />
    <Body />
    <rect x="7" y="9" width="2" height="1" fill="#050309" />
    <rect x="6" y="10" width="4" height="1" fill="#050309" />
    <rect x="7" y="11" width="2" height="1" fill="#050309" />
  </>
);

const MERCS: Mercenary[] = [
  {
    id: "sword",
    label: "검사",
    role: "근접 범위 공격",
    stats: [
      { k: "ATK", v: "15" },
      { k: "사거리", v: "60px" },
      { k: "쿨타임", v: "0.8s" },
    ],
    glow: "var(--color-class-sword)",
    delay: "0s",
    Body: SwordsmanBody,
  },
  {
    id: "bow",
    label: "궁수",
    role: "원거리 투사체",
    stats: [
      { k: "ATK", v: "10" },
      { k: "사거리", v: "280px" },
      { k: "쿨타임", v: "1.0s" },
    ],
    glow: "var(--color-class-bow)",
    delay: "0.25s",
    Body: ArcherBody,
  },
  {
    id: "mage",
    label: "마법사",
    role: "광역 폭발",
    stats: [
      { k: "ATK", v: "25" },
      { k: "폭발반경", v: "80px" },
      { k: "쿨타임", v: "2.0s" },
    ],
    glow: "var(--color-class-mage)",
    delay: "0.5s",
    Body: MageBody,
  },
  {
    id: "cleric",
    label: "성직자",
    role: "아군 전체 회복",
    stats: [
      { k: "회복", v: "+5 HP" },
      { k: "대상", v: "팀 전체" },
      { k: "주기", v: "5.0s" },
    ],
    glow: "var(--color-class-cleric)",
    delay: "0.75s",
    Body: ClericBody,
  },
];

export function MercenaryRow() {
  return (
    <div
      className="flex items-end justify-center gap-6 md:gap-10"
      aria-label="용병 4종 미리보기"
    >
      {MERCS.map((m) => (
        <div
          key={m.id}
          className="merc-tooltip-host relative flex flex-col items-center gap-2 merc-bob cursor-help"
          style={{ animationDelay: m.delay }}
          tabIndex={0}
          aria-label={`${m.label} — ${m.role}`}
        >
          <div className="merc-tooltip" role="tooltip">
            <div
              className="text-sm font-bold mb-1"
              style={{ color: m.glow }}
            >
              {m.label}
            </div>
            <div className="text-[10px] text-ash-grey mb-2">{m.role}</div>
            <div className="space-y-0.5">
              {m.stats.map((s) => (
                <div
                  key={s.k}
                  className="flex justify-between text-[11px] gap-3"
                >
                  <span className="text-bone-white/65">{s.k}</span>
                  <span className="text-bone-white font-pixel-en text-[10px]">
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative w-12 h-16 md:w-14 md:h-20 flex items-center justify-center"
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 50% 70%, ${m.glow}55 0%, transparent 65%)`,
                filter: "blur(6px)",
              }}
            />
            <svg
              viewBox="0 0 16 24"
              width="100%"
              height="100%"
              className="relative"
              style={{
                color: m.glow,
                filter: `drop-shadow(0 0 6px ${m.glow}aa)`,
              }}
              aria-hidden="true"
            >
              <m.Body />
            </svg>
          </div>
          <span
            className="text-[10px] md:text-xs font-pixel-ko text-bone-white/70 tracking-wide"
            style={{ textShadow: `0 0 6px ${m.glow}88` }}
          >
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
