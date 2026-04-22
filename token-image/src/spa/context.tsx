import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { flattenToCSSVars } from "./utils/tokens";

interface ComponentInfo {
  name: string;
  file: string;
  width: number;
  height: number;
  path: string;
}

interface TokenContextType {
  tokens: Record<string, any>;
  updateToken: (path: string, value: any) => void;
  save: () => void;
  discard: () => void;
  isDirty: boolean;
  presets: { name: string; file: string }[];
  loadPreset: (name: string) => void;
  saveAsPreset: (name: string) => void;
  components: ComponentInfo[];
  selectedComponent: number;
  setSelectedComponent: (i: number) => void;
}

const TokenContext = createContext<TokenContextType | null>(null);

export function useTokens() {
  return useContext(TokenContext)!;
}

function setNestedValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split(".");
  const copy = JSON.parse(JSON.stringify(obj));
  let current = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return copy;
}

export function TokenStyleSheet({ tokens }: { tokens: Record<string, any> }) {
  const styleRef = useRef<HTMLStyleElement>(null);
  const css = useMemo(() => flattenToCSSVars(tokens), [tokens]);
  useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = `:root { ${css} }`;
    }
  }, [css]);
  return <style ref={styleRef} />;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Record<string, any>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [presets, setPresets] = useState<{ name: string; file: string }[]>([]);
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [selectedComponent, setSelectedComponent] = useState(0);
  const isDirty = JSON.stringify(tokens) !== savedSnapshot;

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((data) => {
        setTokens(data);
        setSavedSnapshot(JSON.stringify(data));
      });
    fetch("/api/presets").then((r) => r.json()).then(setPresets);
    fetch("/api/components").then((r) => r.json()).then(setComponents);
  }, []);

  const fontFamilyKey = JSON.stringify(tokens.fontFamily);
  const fontWeightKey = JSON.stringify(tokens.fontWeight);

  useEffect(() => {
    const families = tokens.fontFamily;
    const weights = tokens.fontWeight;
    if (!families || !weights) return;
    const familyValues = [...new Set(Object.values(families) as string[])];
    const weightValues = Object.values(weights) as number[];
    if (familyValues.length === 0 || weightValues.length === 0) return;
    const weightStr = weightValues.join(";");
    const familyParams = familyValues
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@${weightStr}`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
    let link = document.getElementById("google-fonts") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "google-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }, [fontFamilyKey, fontWeightKey]);

  const updateToken = useCallback((path: string, value: any) => {
    setTokens((prev) => setNestedValue(prev, path, value));
  }, []);

  const save = useCallback(() => {
    fetch("/api/tokens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });
    setSavedSnapshot(JSON.stringify(tokens));
  }, [tokens]);

  const discard = useCallback(() => {
    const prev = JSON.parse(savedSnapshot);
    setTokens(prev);
    fetch("/api/tokens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prev),
    });
  }, [savedSnapshot]);

  const loadPreset = useCallback(async (name: string) => {
    const res = await fetch(`/api/presets/${name}`);
    const data = await res.json();
    setTokens(data);
  }, []);

  const saveAsPreset = useCallback(async (name: string) => {
    await fetch(`/api/presets/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });
    const res = await fetch("/api/presets");
    setPresets(await res.json());
  }, [tokens]);

  return (
    <TokenContext.Provider
      value={{
        tokens, updateToken, save, discard, isDirty,
        presets, loadPreset, saveAsPreset,
        components, selectedComponent, setSelectedComponent,
      }}
    >
      <TokenStyleSheet tokens={tokens} />
      {children}
    </TokenContext.Provider>
  );
}
