export type SplashPoint = {
  x: number;
  y: number;
  targetable: boolean;
};

export function getSplashTargets<T extends SplashPoint>(
  targets: Iterable<T>,
  origin: Pick<SplashPoint, "x" | "y">,
  radius: number,
): T[] {
  const radiusSq = radius * radius;

  return Array.from(targets).filter((target) => {
    if (!target.targetable) return false;

    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    return dx * dx + dy * dy <= radiusSq;
  });
}
