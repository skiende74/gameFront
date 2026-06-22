# Android APK Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce installable Android APK artifacts from the existing Capacitor project.

**Architecture:** Keep Vite as the source of web assets and Capacitor as the Android wrapper. Generate a debug APK first for device QA, then add release signing only after runtime behavior is verified.

**Tech Stack:** React, Vite, Capacitor 8, Android Gradle Plugin, Gradle wrapper, Android SDK.

---

### Task 1: Align Android Runtime Policy

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `tests/capacitorConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Change `tests/capacitorConfig.test.ts` so it expects the APK to allow both portrait and landscape:

```ts
assert.ok(!manifest.includes('android:screenOrientation="landscape"'));
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/opt/homebrew/bin/node tests/capacitorConfig.test.ts
```

Expected: FAIL because the current manifest still contains `android:screenOrientation="landscape"`.

- [ ] **Step 3: Remove the Android landscape lock**

Delete this line from `android/app/src/main/AndroidManifest.xml`:

```xml
android:screenOrientation="landscape"
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/opt/homebrew/bin/node tests/capacitorConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml tests/capacitorConfig.test.ts
git commit -m "fix: 안드로이드 화면 방향 고정 제거."
```

### Task 2: Add APK Build Scripts

**Files:**
- Modify: `package.json`
- Modify: `tests/capacitorConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that `package.json` exposes the APK commands:

```ts
assert.equal(packageJson.scripts["android:sync"], "npm run build && cap sync android");
assert.equal(packageJson.scripts["android:apk:debug"], "npm run android:sync && cd android && ./gradlew assembleDebug");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/opt/homebrew/bin/node tests/capacitorConfig.test.ts
```

Expected: FAIL because the scripts are not present.

- [ ] **Step 3: Add scripts**

Add these scripts to `package.json`:

```json
"android:sync": "npm run build && cap sync android",
"android:apk:debug": "npm run android:sync && cd android && ./gradlew assembleDebug"
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/opt/homebrew/bin/node tests/capacitorConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/capacitorConfig.test.ts
git commit -m "feat: 안드로이드 APK 빌드 스크립트 추가."
```

### Task 3: Generate Debug APK

**Files:**
- Generated: `dist`
- Generated: `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 1: Run lint before packaging**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run lint
```

Expected: exit 0. Existing lint warnings in `src/ui/ScoreboardModal.tsx` may remain unless fixed separately.

- [ ] **Step 2: Build web assets and sync Capacitor**

Run:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run android:sync
```

Expected: `dist` is refreshed and Android assets are synced.

- [ ] **Step 3: Assemble debug APK**

Run:

```bash
cd android && ./gradlew assembleDebug
```

Expected: `android/app/build/outputs/apk/debug/app-debug.apk` exists.

- [ ] **Step 4: Commit source-only packaging changes**

Do not commit generated APK or Gradle build output. Commit only source/config changes from earlier tasks.

### Task 4: Device QA

**Files:**
- Read: `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 1: Install debug APK**

Run with an Android device or emulator connected:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Expected: install succeeds.

- [ ] **Step 2: Smoke test gameplay**

Open the app and check:

```text
title screen -> character select -> game start -> mobile controls -> pause -> portrait rotate -> landscape rotate
```

Expected: the game remains playable in both orientations, no browser address bar exists, fullscreen native shell is used, audio starts after user interaction, and touch controls do not trigger Android/browser gestures.

### Task 5: Release APK Signing

**Files:**
- Modify: `android/app/build.gradle`
- Create local only: a release keystore outside git

- [ ] **Step 1: Generate a release keystore outside the repo**

Run:

```bash
keytool -genkeypair -v -keystore "$HOME/.android/dacon-game-release.jks" -alias dacon-game -keyalg RSA -keysize 2048 -validity 10000
```

Expected: a keystore exists outside the repository.

- [ ] **Step 2: Add signing config using environment variables**

Use `DACON_RELEASE_STORE_FILE`, `DACON_RELEASE_STORE_PASSWORD`, `DACON_RELEASE_KEY_ALIAS`, and `DACON_RELEASE_KEY_PASSWORD` in `android/app/build.gradle`. Do not hard-code secrets.

- [ ] **Step 3: Assemble release APK**

Run:

```bash
cd android && ./gradlew assembleRelease
```

Expected: `android/app/build/outputs/apk/release/app-release.apk` exists and is signed.

- [ ] **Step 4: Commit signing config only**

```bash
git add android/app/build.gradle
git commit -m "feat: 안드로이드 릴리스 서명 설정 추가."
```
