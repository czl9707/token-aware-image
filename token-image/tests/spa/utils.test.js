import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("setNestedValue", () => {
  it("updates a leaf value without mutating the original", async () => {
    const { setNestedValue } = await import("../../src/spa/utils/tokens.ts");
    const obj = { color: { bg: "#000", text: "#FFF" }, spacing: { md: 16 } };
    const updated = setNestedValue(obj, "color.bg", "#333");
    assert.equal(updated.color.bg, "#333");
    assert.equal(obj.color.bg, "#000");
    assert.equal(updated.color.text, "#FFF");
    assert.equal(updated.spacing.md, 16);
  });

  it("creates intermediate keys if missing", async () => {
    const { setNestedValue } = await import("../../src/spa/utils/tokens.ts");
    const obj = { color: {} };
    const updated = setNestedValue(obj, "color.accent", "#F00");
    assert.equal(updated.color.accent, "#F00");
  });

  it("preserves keys with undefined values", async () => {
    const { setNestedValue } = await import("../../src/spa/utils/tokens.ts");
    const obj = { a: { b: 1, c: undefined } };
    const updated = setNestedValue(obj, "a.b", 2);
    assert.equal("c" in updated.a, true);
  });
});
