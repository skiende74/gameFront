import assert from "node:assert/strict";
import { CLASS_DEFS } from "../src/game/config.ts";
import {
  CLASS_ATTACK_EFFECT_SOURCES,
  attackEffectAnimKey,
  attackEffectTex,
} from "../src/game/effects/classAttackEffects.ts";

const byId = Object.fromEntries(CLASS_ATTACK_EFFECT_SOURCES.map((source) => [source.id, source]));

assert.deepEqual(Object.keys(byId).sort(), ["bow", "mage", "sword"]);
assert.equal(byId.sword.path.endsWith("Swordsman-Attack01_Effect.png"), true);
assert.equal(byId.bow.path.endsWith("Archer-Attack01_Effect.png"), true);
assert.equal(byId.mage.path.endsWith("Wizard-Attack01_Effect.png"), true);
assert.equal(byId.cleric, undefined);

assert.equal(attackEffectTex("bow"), "tex-attack-effect-bow");
assert.equal(attackEffectAnimKey("mage"), "attack-effect-mage");
assert.equal(CLASS_DEFS.cleric.attackFile, "Heal");
