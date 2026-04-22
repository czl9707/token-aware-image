import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("API module", () => {
  it("exports all API functions", async () => {
    const api = await import("../../src/spa/token-api.ts");
    assert.equal(typeof api.fetchTokens, "function");
    assert.equal(typeof api.saveTokens, "function");
    assert.equal(typeof api.fetchPresets, "function");
    assert.equal(typeof api.loadPreset, "function");
    assert.equal(typeof api.saveAsPreset, "function");
    assert.equal(typeof api.fetchComponents, "function");
  });
});
