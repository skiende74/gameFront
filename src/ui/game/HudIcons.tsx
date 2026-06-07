import type { CSSProperties } from "react";

export type IconName =
  | "heart"
  | "sword"
  | "star"
  | "clock"
  | "wave"
  | "skull"
  | "coin"
  | "pause";

const GRIDS: Record<IconName, string[]> = {
  heart: ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"],
  sword: ["0000010", "0000110", "0011110", "0111100", "1111000", "1110000", "1100000"],
  star: ["0001000", "0001000", "0011100", "1111111", "0011100", "0001000", "0001000"],
  clock: ["0111110", "1000001", "1001001", "1001101", "1000001", "0111110"],
  wave: ["1111100", "1000110", "1000110", "1111100", "1000000", "1000000", "1000000"],
  skull: [
    "0111110",
    "1111111",
    "1101011",
    "1111111",
    "1111111",
    "0111110",
    "0101010",
  ],
  pause: ["110011", "110011", "110011", "110011", "110011", "110011"],
  coin: [
    "0011100",
    "0111110",
    "1101011",
    "1101011",
    "1101011",
    "0111110",
    "0011100",
  ],
};

type Props = {
  name: IconName;
  className?: string;
  style?: CSSProperties;
};

export function PixelIcon({ name, className = "", style }: Props) {
  const grid = GRIDS[name];
  const width = grid[0].length;
  const height = grid.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ shapeRendering: "crispEdges", fill: "currentColor", ...style }}
      aria-hidden="true"
    >
      {grid.map((row, y) =>
        [...row].map((cell, x) =>
          cell === "1" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
          ) : null,
        ),
      )}
    </svg>
  );
}
