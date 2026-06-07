import assert from "node:assert/strict";
import { EFFECT_ANIM, MAGIC_PROJECTILE_FRAME, PACK_PATH, TEX } from "../src/game/config.ts";

assert.equal(TEX.wizardExplosionEffect, "tex-wizard-attack01-effect");
assert.equal(EFFECT_ANIM.wizardExplosion, "effect-wizard-explosion");
assert.equal(MAGIC_PROJECTILE_FRAME, 2);
assert.equal("wizardAttackEffect" in TEX, false);
assert.equal("wizardAttack" in EFFECT_ANIM, false);
assert.equal(
  PACK_PATH.wizardExplosionEffect.endsWith(
    "Magic(Projectile)/Wizard-Attack01_Effect.png",
  ),
  true,
);
