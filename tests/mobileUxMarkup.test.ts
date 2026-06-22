import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const upgrade = readFileSync("src/ui/UpgradeModal.tsx", "utf8");
assert.ok(upgrade.includes("overflow-y-auto"));
assert.ok(upgrade.includes("max-h-[calc(100dvh-16px)]"));
assert.ok(upgrade.includes("[@media(max-height:480px)]:"));
assert.ok(upgrade.includes("grid-cols-1"));
assert.ok(upgrade.includes("sm:grid-cols-5"));

const gameModals = readFileSync("src/ui/game/GameModals.tsx", "utf8");
assert.ok(gameModals.includes("max-h-[calc(100dvh-16px)]"));
assert.ok(gameModals.includes("overflow-y-auto"));

const characterSelect = readFileSync("src/ui/CharacterSelectModal.tsx", "utf8");
assert.ok(characterSelect.includes("max-h-[calc(100dvh-16px)]"));
assert.ok(characterSelect.includes("overflow-y-auto"));

const devPanel = readFileSync("src/ui/DevModePanel.tsx", "utf8");
assert.ok(devPanel.includes("zIndex: 30"));
