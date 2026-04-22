export function camelToKebab(str: string) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export const TOKEN_UNITS: Record<string, string> = {
  fontSize: "px",
  spacing: "px",
  radius: "px",
  letterSpacing: "em",
}

export function flattenToCSSVars(obj: Record<string, any>, cssPrefix = "", topLevelKey = ""): string {
  let css = "";
  for (const [key, value] of Object.entries(obj)) {
    const currentTopLevel = topLevelKey || key;
    const cssKey = cssPrefix ? `${cssPrefix}-${camelToKebab(key)}` : camelToKebab(key);
    if (typeof value === "object" && value !== null) {
      css += flattenToCSSVars(value, cssKey, currentTopLevel);
    } else {
      const unit = typeof value === "number" ? (TOKEN_UNITS[currentTopLevel] || "") : "";
      css += `--${cssKey}: ${value}${unit};\n`;
    }
  }
  return css;
}

export function setNestedValue(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split(".");
  const result = { ...obj };
  let current: Record<string, any> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

export function toCSSVarRefs(obj: Record<string, any>, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = prefix ? `${prefix}-${camelToKebab(key)}` : camelToKebab(key);
    result[key] = (typeof value === "object" && value !== null)
      ? toCSSVarRefs(value, cssKey)
      : `var(--${cssKey})`;
  }
  return result;
}
