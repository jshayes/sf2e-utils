import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { extractPack } from "@foundryvtt/foundryvtt-cli";

const projectRoot = process.cwd();

const sourcePackDir = path.join(projectRoot, "dist", "packs", "macros");
const outputDir = path.join(projectRoot, "src", "packs", "macros");

try {
  const packStat = await stat(sourcePackDir);
  if (!packStat.isDirectory()) {
    throw new Error(`Pack path is not a directory: ${sourcePackDir}`);
  }
} catch (error) {
  throw new Error(
    `Missing macros compendium pack at ${sourcePackDir}. Run the module once in Foundry or pack first.`,
    { cause: error },
  );
}

await mkdir(outputDir, { recursive: true });

await extractPack(sourcePackDir, outputDir, {
  clean: true,
  folders: true,
  omitVolatile: true,
  log: true,
});

console.log(`Unpacked macros compendium from ${sourcePackDir} -> ${outputDir}`);
