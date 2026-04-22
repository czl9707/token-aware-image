import React, { useState, useEffect, useMemo } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import { useTokens } from "../context";

function useTokenValue(path: string) {
  const { tokens, updateToken, previewToken } = useTokens();
  const keys = path.split(".");
  let value: any = tokens;
  for (const k of keys) value = value?.[k];
  return { value, updateToken, previewToken };
}

const ColorInput = React.memo(function ColorInput({ path, label }: { path: string; label: string }) {
  const { value: raw, updateToken } = useTokenValue(path);
  const value = typeof raw === "string" ? raw : "#000000";
  return (
    <div className="token-row">
      <label>{label}</label>
      <div className="color-input-container">
        <input type="color" value={value} onChange={(e) => updateToken(path, e.target.value)} />
      </div>
      <span className="color-hex">{value}</span>
    </div>
  );
});

const TextInput = React.memo(function TextInput({ path, label }: { path: string; label: string }) {
  const { value: raw, updateToken } = useTokenValue(path);
  const value = typeof raw === "string" ? raw : "";
  return (
    <div className="token-row">
      <label>{label}</label>
      <input type="text" className="text-input" value={value} onChange={(e) => updateToken(path, e.target.value)} />
    </div>
  );
});

const SliderInput = React.memo(function SliderInput({ path, label, min = 0, max = 1, step = 0.1, integer }: { path: string; label: string; min?: number; max?: number; step?: number; integer?: boolean }) {
  const { value: raw, previewToken, updateToken } = useTokenValue(path);
  const value = typeof raw === "number" ? raw : 0;
  const display = integer ? Math.round(value) : value;
  const resolved = integer ? (v: number) => Math.round(v) : (v: number) => v;
  return (
    <div className="token-row">
      <label>{label}</label>
      <Slider.Root
        className="slider-root"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => previewToken(path, resolved(v))}
        onValueCommit={([v]) => updateToken(path, resolved(v))}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
      <span className="slider-value">{display}</span>
    </div>
  );
});

const CATEGORY_CONFIG: Record<string, {
  label: string;
  widget: "color" | "text" | "slider";
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
}> = {
  color:         { label: "Color",         widget: "color" },
  fontFamily:    { label: "Font Family",   widget: "text" },
  fontSize:      { label: "Font Size",     widget: "slider", min: 8, max: 120, step: 1, integer: true },
  fontWeight:    { label: "Font Weight",   widget: "slider", min: 100, max: 900, step: 100, integer: true },
  lineHeight:    { label: "Line Height",   widget: "slider", min: 0.8, max: 2, step: 0.1 },
  letterSpacing: { label: "Letter Spacing",widget: "slider", min: -0.1, max: 0.2, step: 0.01 },
  spacing:       { label: "Spacing",       widget: "slider", min: 0, max: 96, step: 1, integer: true },
  radius:        { label: "Radius",        widget: "slider", min: 0, max: 32, step: 1, integer: true },
  opacity:       { label: "Opacity",       widget: "slider" },
};

const CATEGORY_ORDER = [
  "color", "fontFamily", "fontSize", "fontWeight",
  "lineHeight", "letterSpacing", "spacing", "radius", "opacity",
];

function formatLabel(key: string): string {
  if (/^\d/.test(key)) return key.toUpperCase();
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

function TokenField({ category, childKey, config }: { category: string; childKey: string; config: typeof CATEGORY_CONFIG[string] }) {
  const path = `${category}.${childKey}`;
  const label = formatLabel(childKey);
  switch (config.widget) {
    case "color":
      return <ColorInput path={path} label={label} />;
    case "text":
      return <TextInput path={path} label={label} />;
    case "slider":
      return <SliderInput path={path} label={label} min={config.min} max={config.max} step={config.step} integer={config.integer} />;
  }
}

export default function TokenEditor() {
  const { tokens } = useTokens();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const initialized = React.useRef(false);

  const sections = useMemo(() => {
    const result: { key: string; label: string; children: string[] }[] = [];
    for (const key of CATEGORY_ORDER) {
      const config = CATEGORY_CONFIG[key];
      const group = tokens[key];
      if (config && group && typeof group === "object") {
        result.push({ key, label: config.label, children: Object.keys(group) });
      }
    }
    for (const key of Object.keys(tokens)) {
      if (CATEGORY_CONFIG[key] || result.some((s) => s.key === key)) continue;
      const group = tokens[key];
      if (group && typeof group === "object" && !Array.isArray(group)) {
        result.push({ key, label: formatLabel(key), children: Object.keys(group) });
      }
    }
    return result;
  }, [tokens]);

  useEffect(() => {
    if (sections.length > 0 && !initialized.current) {
      initialized.current = true;
      setOpenSections(sections.slice(0, 3).map((s) => s.label));
    }
  }, [sections.length]);

  return (
    <Accordion.Root className="token-accordion" type="multiple" value={openSections} onValueChange={setOpenSections}>
      {sections.map((section) => {
        const config = CATEGORY_CONFIG[section.key];
        return (
          <Accordion.Item key={section.key} className="token-section" value={section.label}>
            <Accordion.Trigger className="token-section-header">
              <span>{section.label}</span>
              <span className="accordion-chevron">▾</span>
            </Accordion.Trigger>
            <Accordion.Content className="token-section-body">
              {section.children.map((childKey) => (
                <TokenField
                  key={childKey}
                  category={section.key}
                  childKey={childKey}
                  config={config || { label: section.label, widget: "text" as const }}
                />
              ))}
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
