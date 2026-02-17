import { cp, readFile, writeFile } from "node:fs/promises";
import { defineConfig, type Plugin } from "vite";

const moduleId = "sf2e-utils";
const devServerOrigin = "http://localhost:30001";
const basePath = `/modules/${moduleId}/`;

async function writeManifest(useDevEntry: boolean): Promise<void> {
  const manifest = JSON.parse(
    await readFile("src/module.json", "utf-8"),
  ) as Record<string, unknown>;

  if (process.env.MODULE_VERSION) {
    manifest.version = process.env.MODULE_VERSION;
  }

  // Foundry reads module.json from dist. In dev we point at Vite's served entry.
  manifest.esmodules = useDevEntry
    ? [`${devServerOrigin}${basePath}scripts/module.js`]
    : ["scripts/module.js"];
  manifest.styles = useDevEntry ? [] : ["style.css"];

  if (process.env.MODULE_URL) {
    manifest.url = process.env.MODULE_URL;
  }

  if (process.env.MODULE_MANIFEST_URL) {
    manifest.manifest = process.env.MODULE_MANIFEST_URL;
  }

  if (process.env.MODULE_DOWNLOAD_URL) {
    manifest.download = process.env.MODULE_DOWNLOAD_URL;
  }

  await writeFile("dist/module.json", `${JSON.stringify(manifest, null, 2)}\n`);
}

function copyFoundryFiles(): Plugin {
  return {
    name: "copy-foundry-files",
    async configureServer() {
      await cp("src/languages", "dist/languages", { recursive: true });
      await cp("src/templates", "dist/templates", { recursive: true });
      await writeManifest(true);
    },
    async closeBundle() {
      await cp("src/languages", "dist/languages", { recursive: true });
      await cp("src/templates", "dist/templates", { recursive: true });
      await writeManifest(false);
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: "src",
  base: basePath,
  server: {
    host: true,
    port: 30001,
    strictPort: true,
    cors: true,
    hmr: {
      host: "localhost",
      port: 30001,
      clientPort: 30001,
    },
  },
  build: {
    outDir: "../dist",
    // Default: preserve dist/packs between builds. Use `npm run build:clean`
    // to force a clean outDir build.
    emptyOutDir: mode === "clean",
    sourcemap: true,
    lib: {
      entry: "ts/module.ts",
      formats: ["es"],
      fileName: () => "scripts/module.js",
      cssFileName: "style",
    },
  },
  plugins: [copyFoundryFiles()],
}));
