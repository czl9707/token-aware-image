#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import open from "open";
import { createAPI } from "./src/server/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();
const activeTokenPath = join(projectRoot, "src", "token.active.json");
const srcDir = join(projectRoot, "src");

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  console.log(`token-image — image generation toolchain

Usage: token-image <command>

Commands:
  render [component] [--scale <n>]   Render .tsx components to .png
  editor                             Launch visual token editor

Options:
  component   Bare name (e.g. square-1) or filename. Omit to render all.
  --scale <n> Resolution multiplier (default: 1). --scale 2 outputs 2x dimensions.

Run from a .token-image/ workspace directory.`);
  process.exit(0);
}

if (command === "render") {
  const renderPath = join(__dirname, "src", "render.ts");
  const rest = process.argv.slice(3);

  const { execFileSync } = await import("child_process");
  const tsxPath = join(__dirname, "node_modules", ".bin", "tsx");

  try {
    execFileSync(tsxPath, [renderPath, ...rest], { cwd: projectRoot, stdio: "inherit" });
  } catch (err) {
    process.exit(err.status ?? 1);
  }
  process.exit(0);
}

if (command === "editor") {
  if (!existsSync(activeTokenPath)) {
    console.error(
      "Error: src/token.active.json not found.\nMake sure you're running from a .token-image/ directory.\nRun init.sh first to set up the workspace."
    );
    process.exit(1);
  }

  const API_PORT = 3456;

  async function main() {
    // 1. Start Express API
    const api = createAPI({ projectRoot });
    await new Promise((resolve) => api.listen(API_PORT, resolve));
    console.log(`API server running on http://localhost:${API_PORT}`);

    // 2. Start Vite dev server
    const vite = await createServer({
      root: join(__dirname, "src", "spa"),
      publicDir: join(__dirname, "public"),
      server: {
        port: 5173,
        proxy: {
          "/api": `http://localhost:${API_PORT}`,
        },
        fs: {
          allow: [projectRoot, __dirname],
        },
      },
      resolve: {
        dedupe: ["react", "react-dom"],
      },
      optimizeDeps: {
        include: ["react-dom/client"],
      },
      plugins: [
        react(),
      ],
    });

    await vite.listen();
    const address = vite.resolvedUrls?.local?.[0] ?? "http://localhost:5173";
    console.log(`SPA running on ${address}`);

    // 3. Open browser
    await open(address);
    console.log("Browser opened. Press Ctrl+C to stop.");
  }

  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}\nRun 'token-image --help' for usage.`);
  process.exit(1);
}
