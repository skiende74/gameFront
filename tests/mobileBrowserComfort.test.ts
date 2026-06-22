import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/index.css", "utf8");
assert.ok(css.includes("user-select: none"));
assert.ok(css.includes("-webkit-user-select: none"));
assert.ok(css.includes("-webkit-touch-callout: none"));
assert.ok(css.includes("-webkit-tap-highlight-color: transparent"));
assert.ok(css.includes("overscroll-behavior: none"));
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

const viewport = readFileSync("index.html", "utf8");
assert.ok(viewport.includes("viewport-fit=cover"));
