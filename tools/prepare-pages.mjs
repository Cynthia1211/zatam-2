import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(repoRoot, "dist");
const excluded = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist",
  "tools",
  "Games/MemoryConnect-app"
]);

function isIncluded(source) {
  const path = relative(repoRoot, source).split(sep).join("/");
  return path === "" || ![...excluded].some((entry) => path === entry || path.startsWith(`${entry}/`));
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const entry of await readdir(repoRoot)) {
  const source = resolve(repoRoot, entry);
  if (!isIncluded(source)) continue;
  await cp(source, resolve(outputRoot, entry), { recursive: true, filter: isIncluded });
}
