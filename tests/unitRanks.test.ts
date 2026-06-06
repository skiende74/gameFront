import assert from "node:assert/strict";
import type { MercCombat } from "../src/game/data/mercs.ts";
import { applyRankToCombat } from "../src/game/data/unitRanks.ts";

const bow: MercCombat = {
  id: "bow",
  role: "ranged",
  atk: 12,
  range: 320,
  cooldownMs: 800,
  projectile: "arrow",
  scale: 3,
  feetRatio: 0.58,
};

const mage: MercCombat = {
  id: "mage",
  role: "aoe",
  atk: 14,
  range: 300,
  cooldownMs: 1800,
  aoeRadius: 75,
  projectile: "magic",
  scale: 3,
  feetRatio: 0.58,
};

const bow2 = applyRankToCombat(bow, 2);
assert.equal(bow2.atk, 19);
assert.equal(bow2.range, 340);
assert.equal(bow2.cooldownMs, 680);

const bow3 = applyRankToCombat(bow, 3);
assert.equal(bow3.atk, 38);
assert.equal(bow3.range, 390);
assert.equal(bow3.cooldownMs, 480);

const mage2 = applyRankToCombat(mage, 2);
assert.equal(mage2.atk, 22);
assert.equal(mage2.range, 310);
assert.equal(mage2.cooldownMs, 1530);
assert.equal(mage2.aoeRadius, 95);

const mage3 = applyRankToCombat(mage, 3);
assert.equal(mage3.atk, 45);
assert.equal(mage3.range, 340);
assert.equal(mage3.cooldownMs, 1080);
assert.equal(mage3.aoeRadius, 150);
