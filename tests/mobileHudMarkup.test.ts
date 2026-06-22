import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const overlay = readFileSync("src/ui/game/GameOverlay.tsx", "utf8");

assert.ok(overlay.includes("useMobileHud"));
assert.ok(overlay.includes("MobileHud"));
assert.ok(overlay.includes("MobileControls"));
assert.ok(overlay.includes("!isMobileHud && <ControlsHint />"));
assert.ok(overlay.includes("LoadingOverlay"));
assert.ok(overlay.includes("게임 로딩 중"));
assert.ok(!overlay.includes("if (!snapshot) return null;"));

assert.ok(existsSync("src/ui/game/useMobileHud.ts"));
assert.ok(existsSync("src/ui/game/MobileHud.tsx"));
assert.ok(existsSync("src/ui/game/MobileControls.tsx"));

const hook = readFileSync("src/ui/game/useMobileHud.ts", "utf8");
assert.ok(hook.includes("max-width: 767px"));
assert.ok(hook.includes("max-width: 960px"));
assert.ok(hook.includes("pointer: coarse"));
assert.ok(hook.includes("max-height: 480px"));

const mobileHud = readFileSync("src/ui/game/MobileHud.tsx", "utf8");
assert.ok(mobileHud.includes("MobileTopHud"));
assert.ok(mobileHud.includes("MobileBossHud"));
assert.ok(mobileHud.includes("MobileMercBar"));
assert.ok(mobileHud.includes("MobileSynergyPanel"));
assert.ok(mobileHud.includes("가로모드 권장"));

const controls = readFileSync("src/ui/game/MobileControls.tsx", "utf8");
assert.ok(controls.includes('glyph: "▲"'));
assert.ok(controls.includes('glyph: "◀"'));
assert.ok(controls.includes('glyph: "▼"'));
assert.ok(controls.includes('glyph: "▶"'));
assert.ok(controls.includes("KeyboardEvent"));
assert.ok(controls.includes("keydown"));
assert.ok(controls.includes("keyup"));
assert.ok(controls.includes("GAME_PAUSE_REQUEST_EVENT"));

const events = readFileSync("src/ui/game/hudEvents.ts", "utf8");
assert.ok(events.includes("GAME_PAUSE_REQUEST_EVENT"));

const scene = readFileSync("src/game/scenes/DungeonScene.ts", "utf8");
assert.ok(scene.includes("GAME_PAUSE_REQUEST_EVENT"));
assert.ok(scene.includes("togglePause"));
