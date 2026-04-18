// token-image Playwright render script
// Usage: npm run render [-- <name>] [-- --scale <n>]
//
// Run from .token-image/ directory.
// Starts a Vite dev server, launches Playwright, screenshots each component.
//
// Approach: reads tokens at build time, generates per-component HTML + entry TS
// files with tokens baked in, serves via Vite from the workspace root.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, type Browser } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, "src");

const argv = process.argv.slice(2);
let target: string | undefined;
let scale = 1;

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--scale" && argv[i + 1]) {
    scale = parseFloat(argv[i + 1]);
    if (isNaN(scale) || scale <= 0) {
      console.error("Error: --scale must be a positive number.");
      process.exit(1);
    }
    i++;
  } else if (!argv[i].startsWith("--")) {
    target = argv[i];
  }
}

if (target && !target.includes("/") && !target.endsWith(".tsx")) {
  const resolved = path.join(srcDir, `${target}.tsx`);
  if (!fs.existsSync(resolved)) {
    const available = fs
      .readdirSync(srcDir)
      .filter(
        (f) =>
          f.endsWith(".tsx") &&
          f !== "render.tsx" &&
          f !== "render.ts" &&
          f !== "render-playwright.ts" &&
          f !== "viewport.tsx" &&
          f !== "components.tsx" &&
          f !== "markdown.tsx"
      )
      .map((f) => f.replace(".tsx", ""));
    console.error(
      `Error: Component "${target}" not found.\nAvailable: ${available.join(", ")}`
    );
    process.exit(1);
  }
}

const EXCLUDE_FILES = new Set([
  "render.tsx", "render.ts", "render-playwright.ts",
  "viewport.tsx", "components.tsx", "styles.css", "styles.tsx", "styles.ts", "markdown.tsx",
]);

const files = target
  ? [target.endsWith(".tsx") ? target : `${target}.tsx`]
  : fs.readdirSync(srcDir).filter(
      (f) => f.endsWith(".tsx") && !EXCLUDE_FILES.has(f)
    );

if (files.length === 0) {
  console.error("No components found to render.");
  process.exit(1);
}

function camelToKebab(str: string) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

const TOKEN_UNITS: Record<string, string> = {
  fontSize: "px", spacing: "px", radius: "px", letterSpacing: "em",
};

function flattenToCSSVars(obj: Record<string, any>, prefix = "", topLevel = ""): string {
  let css = "";
  for (const [key, value] of Object.entries(obj)) {
    const tl = topLevel || key;
    const ck = prefix ? `${prefix}-${camelToKebab(key)}` : camelToKebab(key);
    if (typeof value === "object" && value !== null) {
      css += flattenToCSSVars(value, ck, tl);
    } else {
      const unit = typeof value === "number" ? (TOKEN_UNITS[tl] || "") : "";
      css += `--${ck}: ${value}${unit};\n`;
    }
  }
  return css;
}

function toCSSVarRefs(obj: Record<string, any>, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const ck = prefix ? `${prefix}-${camelToKebab(key)}` : camelToKebab(key);
    result[key] = typeof value === "object" && value !== null
      ? toCSSVarRefs(value, ck)
      : `var(--${ck})`;
  }
  return result;
}

const tokenRaw = JSON.parse(
  fs.readFileSync(path.join(srcDir, "token.active.json"), "utf8")
);
const cssVars = flattenToCSSVars(tokenRaw);
const tokensJSON = JSON.stringify(toCSSVarRefs(tokenRaw));

const families = tokenRaw.fontFamily || {};
const weights = tokenRaw.fontWeight || {};
const uniqueFamilies = [...new Set(Object.values(families))];
const weightValues = Object.values(weights);
const weightStr = weightValues.join(";");
const fontParams = uniqueFamilies
  .map((f: string) => `family=${f.replace(/ /g, "+")}:wght@${weightStr}`)
  .join("&");
const fontHref = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;

const tmpFiles: string[] = [];

function writeTmp(filePath: string, content: string) {
  fs.writeFileSync(filePath, content);
  tmpFiles.push(filePath);
}

function cleanupTmp() {
  for (const f of tmpFiles) {
    try { fs.unlinkSync(f); } catch {}
  }
}

let vite: ViteDevServer | undefined;
let browser: Browser | undefined;

async function cleanup() {
  const timeout = (ms: number) => new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("cleanup timeout")), ms)
  );
  if (browser) {
    await Promise.race([browser.close(), timeout(5000)]).catch(() => {});
    browser = undefined;
  }
  if (vite) {
    await Promise.race([vite.close(), timeout(5000)]).catch(() => {});
    vite = undefined;
  }
  cleanupTmp();
}

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(130);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(143);
});

try {
  vite = await createServer({
    root: projectRoot,
    server: {
      port: 0,
      fs: { allow: [projectRoot, packageRoot] },
    },
    plugins: [react()],
    logLevel: "silent",
  });
  await vite.listen();
  const base = vite.resolvedUrls!.local![0].replace(/\/$/, "");
  console.log(`Vite dev server running on ${base}`);

  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ deviceScaleFactor: scale });

  for (const file of files) {
    const name = file.replace(".tsx", "");
    const source = fs.readFileSync(path.join(srcDir, file), "utf8");
    const dm = source.match(/\/\/ @(?:size|viewport) (\d+)x(\d+)/);
    const w = dm ? parseInt(dm[1]) : 1200;
    const h = dm ? parseInt(dm[2]) : 630;

    const entryCode = `const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "${fontHref}";
document.head.appendChild(link);

import React from "react";
import { createRoot } from "react-dom/client";
import Comp from "./src/${name}.tsx";
const root = document.getElementById("root");
try {
  createRoot(root).render(React.createElement(Comp, { tokens: ${tokensJSON} }));
  await document.fonts.ready;
  root.dataset.ready = "true";
} catch(e) {
  root.dataset.ready = "error";
  root.textContent = e.message || String(e);
}`;

    const entryPath = path.join(projectRoot, `_entry_${name}.ts`);
    writeTmp(entryPath, entryCode);

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
<style>:root{${cssVars}}</style>
</head><body>
<div id="root" style="width:${w}px;height:${h}px;overflow:hidden;"></div>
<script type="module" src="/_entry_${name}.ts"></script>
</body></html>`;

    const htmlPath = path.join(projectRoot, `_${name}.html`);
    writeTmp(htmlPath, html);

    const page = await ctx.newPage();
    page.on("pageerror", (err) => console.error(`  [${name}] PAGE ERROR:`, err.message));
    page.on("requestfailed", (req) => {
      const url = req.url();
      if (!url.includes("googleapis")) console.error(`  [${name}] REQ FAIL: ${url.substring(0, 80)}`);
    });

    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${base}/_${name}.html`, { waitUntil: "load" });

    try {
      await page.waitForSelector('[data-ready]', { timeout: 20000 });
    } catch {
      const rootContent = await page.$eval('#root', (el: Element) => ({
        ready: (el as HTMLElement).dataset.ready,
        text: el.textContent?.substring(0, 200),
      })).catch(() => "no root");
      console.error(`FAIL: ${name} |`, JSON.stringify(rootContent));
      await page.close();
      continue;
    }

    const ready = await page.$eval('#root', (el: Element) => (el as HTMLElement).dataset.ready).catch(() => "timeout");

    if (ready === "error") {
      const err = await page.$eval('#root', (el: Element) => el.textContent).catch(() => "unknown");
      console.error(`ERROR: ${name}: ${err}`);
    } else if (ready === "true") {
      const out = path.join(srcDir, `${name}.png`);
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });

      const actualW = Math.round(w * scale);
      const actualH = Math.round(h * scale);
      const label = scale !== 1
        ? `Rendered: ${out} (${actualW}x${actualH}, ${scale}x scale)`
        : `Rendered: ${out}`;
      console.log(label);
    }

    await page.close().catch(() => {});
  }
} finally {
  await cleanup();
  process.exit(0);
}
