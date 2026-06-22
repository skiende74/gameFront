import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("vercel.json", "utf8"));

assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
