import React, { useEffect, useState, useRef } from "react";
import { useTokens } from "../context";
import { toCSSVarRefs } from "../utils/tokens";

export default function Preview() {
  const { tokens, components, selectedComponent, previewScopeId } = useTokens();
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const comp = components.find((c) => c.name === selectedComponent) || components[0];

  // Convert real token values to CSS var references for browser context
  const cssVarTokens = toCSSVarRefs(tokens);

  useEffect(() => {
    if (!comp) { setComp(null); return; }
    setError(null);
    import(/* @vite-ignore */ `/@fs/${comp.path}`)
      .then((mod) => { setComp(() => mod.default); })
      .catch((err: Error) => { setError(err.message); setComp(null); });
  }, [comp?.path, comp?.name]);

  useEffect(() => {
    if (!containerRef.current || !comp) return;
    const el = containerRef.current;
    const calc = () => {
      const { width, height } = el.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ed-space-8")) || 32;
      return Math.min((width - pad) / comp.width, (height - pad) / comp.height, 1);
    };
    const observer = new ResizeObserver(() => {
      setScale(calc());
    });
    setScale(calc());
    observer.observe(el);
    return () => observer.disconnect();
  }, [comp]);

  const inner = components.length === 0 ? (
    <div className="empty-state">No components found in src/</div>
  ) : error ? (
    <div className="empty-state" style={{ color: "var(--color-accent)" }}>Error: {error}</div>
  ) : !Comp || !comp ? (
    <div className="empty-state">Loading...</div>
  ) : (
    <div className="preview-frame" style={{ width: comp.width, height: comp.height, transform: `scale(${scale})` }}>
      <Comp tokens={cssVarTokens} />
    </div>
  );

  return (
    <div className={`preview-container ${previewScopeId}`} ref={containerRef}>
      {inner}
    </div>
  );
}
