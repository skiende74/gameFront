import assert from "node:assert/strict";
import {
  EFFECT_ANIM,
  MAGIC_PROJECTILE_CROP,
  MAGIC_PROJECTILE_ROTATION_OFFSET,
  PACK_PATH,
  TEX,
} from "../src/game/config.ts";

assert.equal(TEX.wizardExplosionEffect, "tex-wizard-attack01-effect");
assert.equal(TEX.wizardIceProjectile, "tex-wizard-ice-projectile");
assert.equal(EFFECT_ANIM.wizardExplosion, "effect-wizard-explosion");
assert.deepEqual(MAGIC_PROJECTILE_CROP, { x: 45, y: 10, width: 16, height: 28 });
assert.equal(MAGIC_PROJECTILE_ROTATION_OFFSET, Math.PI / 2);
assert.equal("wizardAttackEffect" in TEX, false);
assert.equal("wizardAttack" in EFFECT_ANIM, false);
assert.equal(
  PACK_PATH.wizardExplosionEffect.endsWith(
    "Magic(Projectile)/Wizard-Attack01_Effect.png",
  ),
  true,
);
