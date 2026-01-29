import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const env = { ...process.env };

if (
  process.platform === "darwin" &&
  process.arch === "arm64" &&
  !env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE
) {
  const major = Math.min(parseInt(os.release().split(".")[0], 10) - 9, 15);
  env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = `mac${major}-arm64`;
}

if (process.platform === "darwin") {
  if (!env.PLAYWRIGHT_HEADFUL) env.PLAYWRIGHT_HEADFUL = "1";
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "pw-home-"));
  env.HOME = tmpHome;
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

const bin = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(bin, ["playwright", "test"], { stdio: "inherit", env });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
