import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
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
  const sourceRoot = path.resolve("src");
  const templatesRoot = path.join(sourceRoot, "templates");
  const isTemplateFile = (absolutePath: string): boolean =>
    absolutePath.startsWith(templatesRoot) && absolutePath.endsWith(".hbs");

  const syncTemplateFile = async (absolutePath: string): Promise<void> => {
    const relativeToTemplates = path.relative(templatesRoot, absolutePath);
    if (relativeToTemplates.startsWith("..")) return;

    const outputPath = path.resolve("dist", "templates", relativeToTemplates);

    try {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await cp(absolutePath, outputPath);
    } catch {
      // If source file no longer exists (delete/rename), remove copied output.
      await rm(outputPath, { force: true });
    }
  };

  return {
    name: "copy-foundry-files",
    async configureServer() {
      await cp("src/languages", "dist/languages", { recursive: true });
      await cp("src/templates", "dist/templates", { recursive: true });
      await writeManifest(true);
    },
    async handleHotUpdate(context) {
      const absolutePath = path.resolve(context.file);
      if (!absolutePath.startsWith(sourceRoot)) return;

      if (!isTemplateFile(absolutePath)) return;

      await syncTemplateFile(absolutePath);
      // Foundry caches templates aggressively; force page reload so updated
      // template files are fetched again during development.
      context.server.ws.send({ type: "full-reload" });
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
