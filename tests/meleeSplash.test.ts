import assert from "node:assert/strict";
import { getSplashTargets } from "../src/game/systems/meleeSplash.ts";

const targets = [
  { id: "hit", x: 0, y: 0, targetable: true },
  { id: "near", x: 30, y: 30, targetable: true },
  { id: "edge", x: 45, y: 0, targetable: true },
  { id: "far", x: 46, y: 0, targetable: true },
  { id: "inactive", x: 10, y: 0, targetable: false },
];

const splashIds = getSplashTargets(targets, { x: 0, y: 0 }, 45).map((target) => target.id);

assert.deepEqual(splashIds, ["hit", "near", "edge"]);
