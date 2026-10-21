import { readFileSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// The tests sign up real accounts, so they need the same settings as the app. Values already in
// the environment win over .env.local.
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // No .env.local: the tests will say what is missing.
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
