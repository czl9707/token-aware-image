import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createAPI } from "../src/server/api.js";

const TMP = path.join(process.cwd(), "tests", ".tmp-project");

function setupProject() {
  fs.mkdirSync(path.join(TMP, "tokens"), { recursive: true });
  fs.mkdirSync(path.join(TMP, "src"), { recursive: true });
  const tokens = { color: { bg: "#000000" } };
  // Active tokens live in src/
  fs.writeFileSync(
    path.join(TMP, "src", "token.active.json"),
    JSON.stringify(tokens, null, 2)
  );
}

function teardownProject() {
  fs.rmSync(TMP, { recursive: true, force: true });
}

describe("API", () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    setupProject();
    app = createAPI({ projectRoot: TMP });
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    server.close();
    teardownProject();
  });

  it("GET /api/tokens returns token.active.json", async () => {
    const res = await fetch(`${baseUrl}/api/tokens`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.color.bg, "#000000");
  });

  it("PUT /api/tokens writes token.active.json to src/", async () => {
    const updated = { color: { bg: "#FFFFFF" } };
    const res = await fetch(`${baseUrl}/api/tokens`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    assert.equal(res.status, 200);
    const written = JSON.parse(
      fs.readFileSync(path.join(TMP, "src", "token.active.json"), "utf8")
    );
    assert.equal(written.color.bg, "#FFFFFF");
  });

  it("GET /api/presets lists token presets from tokens/", async () => {
    fs.mkdirSync(path.join(TMP, "tokens", "light"), { recursive: true });
    fs.writeFileSync(
      path.join(TMP, "tokens", "light", "tokens.json"),
      JSON.stringify({ color: { bg: "#FFF" } })
    );
    const res = await fetch(`${baseUrl}/api/presets`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length >= 1);
    assert.ok(data.some((p) => p.name === "light"));
  });

  it("GET /api/presets/:name returns preset content", async () => {
    const res = await fetch(`${baseUrl}/api/presets/light`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.color.bg, "#FFF");
  });

  it("POST /api/presets/:name creates a new preset in tokens/", async () => {
    const tokens = { color: { bg: "#F00" } };
    const res = await fetch(`${baseUrl}/api/presets/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });
    assert.equal(res.status, 200);
    const exists = fs.existsSync(path.join(TMP, "tokens", "custom", "tokens.json"));
    assert.ok(exists);
  });

  it("GET /api/components lists tsx files with dimensions", async () => {
    fs.writeFileSync(
      path.join(TMP, "src", "blog-banner-1.tsx"),
      "// @size 1200x630\nexport default () => null"
    );
    const res = await fetch(`${baseUrl}/api/components`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 1);
    assert.equal(data[0].name, "blog-banner-1");
    assert.equal(data[0].width, 1200);
    assert.equal(data[0].height, 630);
  });
});
