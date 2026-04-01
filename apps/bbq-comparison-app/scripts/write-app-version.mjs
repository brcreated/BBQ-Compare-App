import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const publicDir = path.join(rootDir, "public");
const outputPath = path.join(publicDir, "app-version.json");

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

function firstNonEmpty(values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function safeGit(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

const commitHash = firstNonEmpty([
  process.env.CF_PAGES_COMMIT_SHA,
  process.env.GITHUB_SHA,
  safeGit("git rev-parse --short HEAD"),
]);

const commitMessage = firstNonEmpty([
  process.env.CF_PAGES_COMMIT_MESSAGE,
  process.env.GITHUB_COMMIT_MESSAGE,
  safeGit("git log -1 --pretty=%B"),
]) || "Unknown";

const nowIso = new Date().toISOString();
const shortCommit = commitHash ? commitHash.slice(0, 7) : "";
const updateVersion = `${nowIso}${shortCommit ? `-${shortCommit}` : ""}`;

const payload = {
  appVersion: pkg.version,
  commitMessage,
  updateVersion,
  updatedAt: nowIso,
  commit: shortCommit,
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`Wrote ${outputPath}`);
console.log(payload);