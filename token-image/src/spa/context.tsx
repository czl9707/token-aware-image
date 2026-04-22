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
  previewToken: (path: string, value: any) => void;
  save: () => void;
  discard: () => void;
  isDirty: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const skipHistoryRef = useRef(false);
  const transientRef = useRef(false);
  const MAX_HISTORY = 25;

  const isDirty = useMemo(
    () => JSON.stringify(tokens) !== savedSnapshot,
    [tokens, savedSnapshot]
  );

  useGoogleFonts(tokens);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    if (transientRef.current) return;
    const json = JSON.stringify(tokens);
    if (json === "{}") return;
    const h = historyRef.current;
    if (h.length > 0 && h[historyIdxRef.current] === json) return;
    h.splice(historyIdxRef.current + 1);
    h.push(json);
    if (h.length > MAX_HISTORY) {
      h.shift();
      historyIdxRef.current--;
    }
    historyIdxRef.current = h.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }, [tokens]);

  const undo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx <= 0) return;
    skipHistoryRef.current = true;
    historyIdxRef.current = idx - 1;
    setTokens(JSON.parse(historyRef.current[idx - 1]));
    setCanUndo(idx - 1 > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const idx = historyIdxRef.current;
    if (idx >= h.length - 1) return;
    skipHistoryRef.current = true;
    historyIdxRef.current = idx + 1;
    setTokens(JSON.parse(h[idx + 1]));
    setCanUndo(true);
    setCanRedo(idx + 1 < h.length - 1);
  }, []);

  useEffect(() => {
    Promise.all([
      api.fetchTokens().then((data) => {
        setTokens(data);
        setSavedSnapshot(JSON.stringify(data));
      }),
      api.fetchPresets().then(setPresets),
      api.fetchComponents().then((data) => {
        setComponents(data);
        if (data.length > 0) setSelectedComponent(data[0].name);
      }),
    ]).catch((err) => setError(err.message));
  }, []);

  const updateToken = useCallback((path: string, value: any) => {
    transientRef.current = false;
    setTokens((prev) => setNestedValue(prev, path, value));
  }, []);

  const previewToken = useCallback((path: string, value: any) => {
    transientRef.current = true;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <TokenContext.Provider
      value={{
        tokens, updateToken, previewToken, save, discard, isDirty,
        undo, redo, canUndo, canRedo,
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
