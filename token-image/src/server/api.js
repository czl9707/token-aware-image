import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

export function createAPI({ projectRoot }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const tokensDir = path.join(projectRoot, "tokens");
  const srcDir = path.join(projectRoot, "src");
  const activePath = path.join(srcDir, "token.active.json");

  app.get("/api/tokens", (req, res) => {
    const tokens = JSON.parse(fs.readFileSync(activePath, "utf8"));
    res.json(tokens);
  });

  app.put("/api/tokens", (req, res) => {
    const json = JSON.stringify(req.body, null, 2) + "\n";
    fs.writeFileSync(activePath, json);
    res.json({ ok: true });
  });

  app.get("/api/presets", (req, res) => {
    const entries = fs.readdirSync(tokensDir, { withFileTypes: true });
    const presets = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          fs.existsSync(path.join(tokensDir, e.name, "tokens.json"))
      )
      .map((e) => ({
        name: e.name,
        file: `${e.name}/tokens.json`,
      }));
    res.json(presets);
  });

  app.get("/api/presets/:name", (req, res) => {
    const filePath = path.join(tokensDir, req.params.name, "tokens.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Preset not found" });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(data);
  });

  app.post("/api/presets/:name", (req, res) => {
    const dirPath = path.join(tokensDir, req.params.name);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, "tokens.json");
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2) + "\n");
    res.json({ ok: true });
  });

  app.get("/api/components", (req, res) => {
    if (!fs.existsSync(srcDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(srcDir).filter(
      (f) => f.endsWith(".tsx") && f !== "render.tsx" && f !== "render.ts" && f !== "viewport.tsx"
    );
    const components = files.map((file) => {
      const content = fs.readFileSync(path.join(srcDir, file), "utf8");
      const match = content.match(/\/\/ @size (\d+)x(\d+)/);
      return {
        name: file.replace(".tsx", ""),
        file,
        width: match ? parseInt(match[1]) : 1200,
        height: match ? parseInt(match[2]) : 630,
        path: path.resolve(srcDir, file),
      };
    });
    res.json(components);
  });

  return app;
}
