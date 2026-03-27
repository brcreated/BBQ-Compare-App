import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function run(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function getPackageVersion() {
  try {
    const packageJsonPath = path.resolve("package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return packageJson.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const now = new Date();
const iso = now.toISOString();
const commit = run("git rev-parse --short HEAD") || "unknown";
const commitMessage = run("git log -1 --pretty=%s") || "Unknown";
const packageVersion = getPackageVersion();

const payload = {
  appVersion: `v${packageVersion}`,
  commitMessage,
  updateVersion: `${iso}-${commit}`,
  updatedAt: iso,
  commit,
};

const outputDir = path.resolve("public");
const outputFile = path.join(outputDir, "app-version.json");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`Wrote ${outputFile}`);
console.log(payload);