import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

assert.equal(packageJson.scripts["android:sync"], "npm run build && cap sync android");
assert.equal(packageJson.scripts["android:apk:debug"], "npm run android:sync && cd android && ./gradlew assembleDebug");

assert.ok(deps["@capacitor/core"]);
assert.ok(deps["@capacitor/android"]);
assert.ok(deps["@capacitor/cli"]);

assert.ok(existsSync("capacitor.config.ts"));
const config = readFileSync("capacitor.config.ts", "utf8");
assert.ok(config.includes('appId: "com.dacongame.gamefront"'));
assert.ok(config.includes('appName: "Dacon Game"'));
assert.ok(config.includes('webDir: "dist"'));

assert.ok(existsSync("android/app/src/main/AndroidManifest.xml"));
const manifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
assert.ok(!manifest.includes('android:screenOrientation="landscape"'));
assert.ok(manifest.includes('android:configChanges='));
assert.ok(manifest.includes("com.dacongame.gamefront.MainActivity"));
