import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const css = `${readFileSync("src/index.css", "utf8")}\n${readFileSync("src/mobile-browser.css", "utf8")}`;
assert.ok(css.includes("user-select: none"));
assert.ok(css.includes("-webkit-user-select: none"));
assert.ok(css.includes("-webkit-touch-callout: none"));
assert.ok(css.includes("-webkit-tap-highlight-color: transparent"));
assert.ok(css.includes("overscroll-behavior: none"));
assert.ok(css.includes("--game-viewport-height"));
assert.ok(css.includes("100dvh"));
assert.ok(css.includes("safe-area-inset-top"));
assert.ok(css.includes("safe-area-inset-bottom"));
assert.ok(css.includes(".game-canvas-surface"));
assert.ok(css.includes("touch-action: none"));
assert.ok(css.includes("-webkit-overflow-scrolling: touch"));

const app = readFileSync("src/App.tsx", "utf8");
assert.ok(app.includes("preventGameBrowserGesture"));
assert.ok(app.includes('addEventListener("contextmenu"'));
assert.ok(app.includes('addEventListener("selectstart"'));
assert.ok(app.includes('addEventListener("dragstart"'));

const phaserGame = readFileSync("src/game/PhaserGame.tsx", "utf8");
assert.ok(phaserGame.includes("game-touch-surface"));
assert.ok(phaserGame.includes("game-canvas-surface"));

const gameStage = readFileSync("src/ui/game/GameStage.tsx", "utf8");
assert.ok(gameStage.includes("game-touch-surface"));
assert.ok(gameStage.includes("game-viewport"));

const viewport = readFileSync("index.html", "utf8");
assert.ok(viewport.includes("viewport-fit=cover"));
assert.ok(viewport.includes("interactive-widget=resizes-content"));
assert.ok(viewport.includes("user-scalable=no"));
assert.ok(viewport.includes('rel="manifest"'));
assert.ok(viewport.includes("mobile-web-app-capable"));
assert.ok(viewport.includes("apple-mobile-web-app-capable"));
assert.ok(viewport.includes("apple-mobile-web-app-status-bar-style"));

assert.ok(existsSync("public/manifest.webmanifest"));
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
assert.ok(manifest.includes('"display": "fullscreen"'));
assert.ok(manifest.includes('"orientation": "landscape"'));
assert.ok(manifest.includes('"src": "/favicon.svg"'));

assert.ok(existsSync("src/ui/game/useFullscreen.ts"));
assert.ok(existsSync("src/ui/game/MobileUtilityButtons.tsx"));
const fullscreen = readFileSync("src/ui/game/useFullscreen.ts", "utf8");
assert.ok(fullscreen.includes("requestFullscreen"));
assert.ok(fullscreen.includes("exitFullscreen"));
assert.ok(fullscreen.includes("orientation.lock"));

const overlay = readFileSync("src/ui/game/GameOverlay.tsx", "utf8");
assert.ok(overlay.includes("MobileUtilityButtons"));
assert.ok(overlay.includes("<MobileUtilityButtons />"));
