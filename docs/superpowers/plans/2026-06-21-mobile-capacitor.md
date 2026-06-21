# Mobile Capacitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mobile HUD, touch controls, and Capacitor Android packaging preparation.

**Architecture:** Desktop HUD remains unchanged. `GameOverlay` chooses desktop or mobile HUD through a small media-query hook. Capacitor wraps the local Vite build output from `dist`.

**Tech Stack:** React, Tailwind CSS, Phaser, Vite, Capacitor.

---

### Task 1: Mobile HUD Mode Detection

**Files:**
- Create: `src/ui/game/useMobileHud.ts`
- Modify: `src/ui/game/GameOverlay.tsx`
- Test: `tests/mobileHudMarkup.test.ts`

- [ ] Add a failing test that expects `GameOverlay` to reference `useMobileHud` and render a mobile branch.
- [ ] Run `node --experimental-strip-types tests/mobileHudMarkup.test.ts` and confirm it fails.
- [ ] Add `useMobileHud` with this query:

```ts
const MOBILE_HUD_QUERY = "(max-width: 767px), (hover: none) and (pointer: coarse) and (max-height: 480px)";
```

- [ ] Update `GameOverlay` so mobile mode renders mobile HUD components and hides keyboard hints.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat: 모바일 HUD 분기 구현.`

### Task 2: Mobile HUD Components

**Files:**
- Create: `src/ui/game/MobileHud.tsx`
- Create: `src/ui/game/MobileControls.tsx`
- Modify: `src/ui/game/GameOverlay.tsx`
- Test: `tests/mobileHudMarkup.test.ts`

- [ ] Extend the failing test to check for `MobileTopHud`, `MobileBossHud`, `MobileMercBar`, `MobileSynergyPanel`, and `MobileControls`.
- [ ] Run the focused test and confirm it fails.
- [ ] Implement compact mobile top HUD, boss bar, merc dock, synergy bottom sheet, landscape notice, and touch controls.
- [ ] Keep each created file below 200 lines.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat: 모바일 전투 HUD 구현.`

### Task 3: Capacitor Android Package Skeleton

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `capacitor.config.ts`
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/res/values/strings.xml`
- Create: `android/app/src/main/res/values/styles.xml`
- Create: `android/app/src/main/java/com/dacongame/gamefront/MainActivity.java`
- Test: `tests/capacitorConfig.test.ts`

- [ ] Add a failing test that checks Capacitor uses `dist`, app id `com.dacongame.gamefront`, and Android landscape config files exist.
- [ ] Run `node --experimental-strip-types tests/capacitorConfig.test.ts` and confirm it fails.
- [ ] Install Capacitor packages with npm.
- [ ] Add Capacitor config and the minimal Android native files.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat: Capacitor 안드로이드 패키징 준비.`

### Task 4: Verification

**Files:**
- All changed files.

- [ ] Run `npm run lint`.
- [ ] Run focused tests:

```bash
node --experimental-strip-types tests/mobileHudMarkup.test.ts
node --experimental-strip-types tests/capacitorConfig.test.ts
```

- [ ] Inspect `git status --short`.
- [ ] Commit any verification-only fixes with a Korean one-line message using an appropriate prefix.
