import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:5173";
if (process.platform === "darwin" && process.env.PLAYWRIGHT_TEMP_HOME !== "0") {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "pw-home-"));
  process.env.HOME = tmpHome;
  const crashpadDir = path.join(
    tmpHome,
    "Library",
    "Application Support",
    "Google",
    "Chrome",
    "Crashpad"
  );
  fs.mkdirSync(crashpadDir, { recursive: true });
}
const browserName = process.env.PLAYWRIGHT_BROWSER as
  | "chromium"
  | "firefox"
  | "webkit"
  | undefined;
const headless = process.env.PLAYWRIGHT_HEADFUL === "1" ? false : undefined;
const chromiumSandbox =
  browserName === "chromium" || (!browserName && process.platform === "darwin")
    ? true
    : undefined;
const chromiumLaunchArgs =
  browserName === "chromium" || !browserName
    ? [
        "--disable-crashpad",
        "--disable-crash-reporter",
        "--disable-features=Crashpad,OutOfProcessCrashpad"
      ]
    : undefined;
const useSystemChrome =
  !browserName &&
  process.platform === "darwin" &&
  process.env.PLAYWRIGHT_SKIP_SYSTEM_CHROME !== "1";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(headless !== undefined ? { headless } : {}),
    ...(chromiumSandbox !== undefined ? { chromiumSandbox } : {}),
    ...(chromiumLaunchArgs ? { launchOptions: { args: chromiumLaunchArgs } } : {}),
    ...(browserName ? { browserName } : {}),
    ...(useSystemChrome ? { channel: "chrome" } : {})
  },
  retries: 0,
  reporter: "list"
});
