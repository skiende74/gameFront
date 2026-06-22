# Mobile Browser UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce mobile browser UI interference during gameplay.

**Architecture:** Keep browser-level behavior in `index.html` and `src/index.css`. Keep gameplay fullscreen behavior in a small hook and a small mobile-only button component rendered by `GameOverlay`.

**Tech Stack:** React, Vite, Phaser, Tailwind CSS, Node assertion tests, ESLint.

---

### Task 1: Browser Metadata And Viewport Comfort

**Files:**
- Modify: `index.html`
- Create: `public/manifest.webmanifest`
- Modify: `src/index.css`
- Test: `tests/mobileBrowserComfort.test.ts`

- [ ] **Step 1: Write the failing test**

Add checks for manifest metadata, web-app meta tags, `100dvh`, safe-area variables, and fullscreen source files in `tests/mobileBrowserComfort.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobileBrowserComfort.test.ts`
Expected: FAIL because the manifest and new fullscreen files do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add the manifest link and mobile web-app meta tags to `index.html`, create `public/manifest.webmanifest`, and add viewport CSS variables plus dynamic-height rules to `src/index.css`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobileBrowserComfort.test.ts`
Expected: PASS.

### Task 2: Mobile Fullscreen Button

**Files:**
- Create: `src/ui/game/useFullscreen.ts`
- Create: `src/ui/game/MobileUtilityButtons.tsx`
- Modify: `src/ui/game/GameOverlay.tsx`
- Test: `tests/mobileBrowserComfort.test.ts`

- [ ] **Step 1: Write the failing test**

Add checks that `GameOverlay` imports and renders `MobileUtilityButtons`, and that the hook uses `requestFullscreen`, `exitFullscreen`, and orientation lock guarded by browser support.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobileBrowserComfort.test.ts`
Expected: FAIL because mobile fullscreen files are missing.

- [ ] **Step 3: Write minimal implementation**

Create `useFullscreen.ts` with fullscreen state and `toggleFullscreen()`. Create `MobileUtilityButtons.tsx` with a top-right button. Render it only in the mobile HUD path.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobileBrowserComfort.test.ts`
Expected: PASS.

### Task 3: Verify And Commit

**Files:**
- All files above.

- [ ] **Step 1: Run focused mobile tests**

Run: `node tests/mobileBrowserComfort.test.ts && node tests/mobileHudMarkup.test.ts && node tests/mobileUxMarkup.test.ts`
Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

Run: `git add ... && git commit -m "feat: 모바일 브라우저 UX 개선 구현."`
Expected: one commit containing the implementation.
