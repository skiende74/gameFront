type Props = {
  side: "left" | "right";
};

/**
 * 픽셀 아트 횃불 — SVG로 벽 브라켓 / 나무 손잡이 / 헝겊 심지 / 3중 불꽃 표현.
 * 불꽃 3레이어와 잿불 4개가 서로 다른 주기로 깜빡이며 자연스러운 흔들림을 만든다.
 */
export function Torch({ side }: Props) {
  const isLeft = side === "left";
  const offsetA = isLeft ? "0s" : "0.6s";
  const offsetB = isLeft ? "0.15s" : "0.4s";
  const offsetC = isLeft ? "0.3s" : "0.7s";

  return (
    <div
      className="absolute pointer-events-none"
      aria-hidden="true"
      style={{
        top: "20%",
        [isLeft ? "left" : "right"]: "7%",
        width: 48,
        height: 110,
      }}
    >
      <div
        className="torch-glow"
        style={{
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animationDelay: offsetA,
        }}
      />

      <svg
        viewBox="0 0 32 100"
        width="48"
        height="100"
        className="relative"
        style={{ shapeRendering: "crispEdges" }}
      >
        <g fill="#0d0804">
          <rect x="2" y="44" width="3" height="14" />
          <rect x="5" y="44" width="1" height="14" fill="#241608" />
        </g>
        <g>
          <rect x="5" y="48" width="9" height="3" fill="#0d0804" />
          <rect x="5" y="48" width="9" height="1" fill="#2a1a0c" />
          <rect x="5" y="51" width="9" height="1" fill="#000" opacity="0.6" />
        </g>
        <g fill="#0d0804">
          <rect x="14" y="42" width="2" height="16" />
          <rect x="13" y="42" width="3" height="2" />
          <rect x="13" y="56" width="3" height="2" />
        </g>

        <g>
          <rect x="13" y="44" width="9" height="42" fill="#2a1408" />
          <rect x="14" y="44" width="7" height="42" fill="#4a2814" />
          <rect x="15" y="44" width="5" height="42" fill="#6b3a1c" />
          <rect x="16" y="44" width="3" height="42" fill="#8a4e26" />
          <rect x="16" y="44" width="1" height="42" fill="#a86234" opacity="0.7" />

          <rect x="13" y="52" width="9" height="1" fill="#0d0804" />
          <rect x="13" y="62" width="9" height="1" fill="#0d0804" />
          <rect x="13" y="72" width="9" height="1" fill="#0d0804" />
          <rect x="13" y="82" width="9" height="1" fill="#0d0804" />
        </g>

        <g>
          <rect x="11" y="36" width="13" height="9" fill="#1a0d04" />
          <rect x="12" y="37" width="11" height="7" fill="#2e1808" />
          <rect x="12" y="38" width="11" height="1" fill="#5a3018" />
          <rect x="12" y="42" width="11" height="1" fill="#5a3018" />
          <rect x="11" y="36" width="13" height="2" fill="#000" opacity="0.85" />
          <rect x="13" y="34" width="9" height="3" fill="#0d0804" />
          <rect x="14" y="34" width="7" height="1" fill="#1a0d04" />
        </g>

        <g
          className="flame-layer flame-outer"
          style={{ animationDelay: offsetA }}
        >
          <path
            d="M 7 34 Q 4 22, 11 12 Q 14 18, 17 8 Q 20 18, 23 12 Q 30 22, 27 34 Q 24 28, 17 32 Q 10 28, 7 34 Z"
            fill="#cc2200"
            opacity="0.75"
          />
        </g>
        <g
          className="flame-layer flame-mid"
          style={{ animationDelay: offsetB }}
        >
          <path
            d="M 10 34 Q 8 22, 14 14 Q 16 20, 17 12 Q 18 20, 20 14 Q 26 22, 24 34 Q 21 28, 17 32 Q 13 28, 10 34 Z"
            fill="#ff7a3a"
          />
        </g>
        <g
          className="flame-layer flame-inner"
          style={{ animationDelay: offsetC }}
        >
          <path
            d="M 12 34 Q 11 24, 15 18 Q 17 22, 17 14 Q 17 22, 19 18 Q 23 24, 22 34 Q 19 30, 17 32 Q 15 30, 12 34 Z"
            fill="#ffd58a"
          />
        </g>
        <g
          className="flame-layer flame-core"
          style={{ animationDelay: offsetB }}
        >
          <ellipse cx="17" cy="26" rx="1.8" ry="3.5" fill="#fffce6" />
        </g>
      </svg>

      <span
        className="ember"
        style={{
          left: "calc(50% - 6px)",
          top: 22,
          ["--ember-drift" as string]: "4px",
          animationDelay: "0s",
        }}
      />
      <span
        className="ember"
        style={{
          left: "50%",
          top: 18,
          ["--ember-drift" as string]: "-3px",
          animationDelay: "0.7s",
        }}
      />
      <span
        className="ember"
        style={{
          left: "calc(50% + 6px)",
          top: 24,
          ["--ember-drift" as string]: "5px",
          animationDelay: "1.3s",
        }}
      />
      <span
        className="ember"
        style={{
          left: "calc(50% - 2px)",
          top: 20,
          ["--ember-drift" as string]: "-5px",
          animationDelay: "1.9s",
        }}
      />
    </div>
  );
}
