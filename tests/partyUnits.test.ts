import assert from "node:assert/strict";
import {
  addUnitWithMerge,
  canAddOrMergeUnit,
  createPartyUnit,
} from "../src/game/state/partyUnits.ts";

const player = createPartyUnit("bow", { isPlayer: true });
const rank2 = addUnitWithMerge([player], "bow");
assert.equal(rank2.length, 1);
assert.equal(rank2[0].id, "bow");
assert.equal(rank2[0].rank, 2);
assert.equal(rank2[0].isPlayer, true);

const rank3 = addUnitWithMerge(rank2, "bow");
assert.equal(rank3.length, 1);
assert.equal(rank3[0].rank, 3);

const capped = addUnitWithMerge(rank3, "bow");
assert.equal(capped.length, 2);
assert.equal(capped[0].rank, 3);
assert.equal(capped[1].rank, 1);

const full = [
  createPartyUnit("sword", { isPlayer: true }),
  createPartyUnit("bow"),
  createPartyUnit("mage"),
];
assert.equal(canAddOrMergeUnit(full, "cleric", 2), false);
assert.equal(canAddOrMergeUnit(full, "bow", 2), true);
