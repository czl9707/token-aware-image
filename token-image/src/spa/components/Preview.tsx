import React, { useEffect, useState, useRef } from "react";
import { useTokens } from "../context";
import { toCSSVarRefs } from "../utils/tokens";

export default function Preview() {
  const { tokens, components, selectedComponent } = useTokens();
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const comp = components[selectedComponent];

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
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (comp) {
        const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ed-space-8")) || 32;
        const s = Math.min((width - pad) / comp.width, (height - pad) / comp.height, 1);
        setScale(s);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [comp]);

  if (components.length === 0) {
    return (
      <div className="preview-container">
        <div className="empty-state">No components found in src/</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="preview-container">
        <div className="empty-state" style={{ color: "var(--accent)" }}>Error: {error}</div>
      </div>
    );
  }
  if (!Comp || !comp) {
    return (
      <div className="preview-container">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }
  return (
    <div className="preview-container" ref={containerRef}>
      <div className="preview-frame" style={{ width: comp.width, height: comp.height, transform: `scale(${scale})` }}>
        <Comp tokens={cssVarTokens} />
      </div>
    </div>
  );
}
