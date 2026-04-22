import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { flattenToCSSVars, setNestedValue } from "./utils/tokens";
import { useGoogleFonts } from "./hooks/useGoogleFonts";
import * as api from "./token-api";

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
  selectedComponent: string;
  setSelectedComponent: (name: string) => void;
  previewScopeId: string;
  error: string | null;
}

const TokenContext = createContext<TokenContextType | null>(null);

const PREVIEW_SCOPE_ID = "token-preview-scope";
const PREVIEW_SELECTOR = `.${PREVIEW_SCOPE_ID}`;

export function useTokens() {
  return useContext(TokenContext)!;
}

export function TokenStyleSheet({ tokens, selector }: { tokens: Record<string, any>; selector: string }) {
  const styleRef = useRef<HTMLStyleElement>(null);
  const css = useMemo(() => flattenToCSSVars(tokens), [tokens]);
  useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = `${selector} { ${css} }`;
    }
  }, [css, selector]);
  return <style ref={styleRef} />;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Record<string, any>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [presets, setPresets] = useState<{ name: string; file: string }[]>([]);
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const isDirty = useMemo(
    () => JSON.stringify(tokens) !== savedSnapshot,
    [tokens, savedSnapshot]
  );

  useGoogleFonts(tokens);

  useEffect(() => {
    Promise.all([
      api.fetchTokens().then((data) => {
        setTokens(data);
        setSavedSnapshot(JSON.stringify(data));
      }),
      api.fetchPresets().then(setPresets),
      api.fetchComponents().then(setComponents),
    ]).catch((err) => setError(err.message));
  }, []);

  const updateToken = useCallback((path: string, value: any) => {
    setTokens((prev) => setNestedValue(prev, path, value));
  }, []);

  const save = useCallback(() => {
    api.saveTokens(tokens).catch((err) => setError(err.message));
    setSavedSnapshot(JSON.stringify(tokens));
  }, [tokens]);

  const discard = useCallback(() => {
    const prev = JSON.parse(savedSnapshot);
    setTokens(prev);
    api.saveTokens(prev).catch((err) => setError(err.message));
  }, [savedSnapshot]);

  const loadPreset = useCallback(async (name: string) => {
    try {
      const data = await api.loadPreset(name);
      setTokens(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const saveAsPreset = useCallback(async (name: string) => {
    try {
      await api.saveAsPreset(name, tokens);
      setPresets(await api.fetchPresets());
    } catch (err: any) {
      setError(err.message);
    }
  }, [tokens]);

  return (
    <TokenContext.Provider
      value={{
        tokens, updateToken, save, discard, isDirty,
        presets, loadPreset, saveAsPreset,
        components, selectedComponent, setSelectedComponent,
        previewScopeId: PREVIEW_SCOPE_ID,
        error,
      }}
    >
      <TokenStyleSheet tokens={tokens} selector={PREVIEW_SELECTOR} />
      {children}
    </TokenContext.Provider>
  );
}
