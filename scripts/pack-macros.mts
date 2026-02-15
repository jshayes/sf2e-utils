import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const projectRoot = process.cwd();

const sourceDir = path.join(projectRoot, "src", "packs", "macros");
const packDir = path.join(projectRoot, "dist", "packs", "macros");

await mkdir(sourceDir, { recursive: true });
await mkdir(path.dirname(packDir), { recursive: true });
await rm(packDir, { recursive: true, force: true });

await compilePack(sourceDir, packDir, {
  recursive: true,
  log: true,
});

console.log(`Packed macros compendium from ${sourceDir} -> ${packDir}`);
