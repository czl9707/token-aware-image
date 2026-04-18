import React from "react";
import { useTokens } from "../context";

export default function ComponentList() {
  const { components, selectedComponent, setSelectedComponent } = useTokens();
  if (components.length === 0) return null;
  return (
    <div className="component-tabs">
      {components.map((c, i) => (
        <button key={c.name} className={i === selectedComponent ? "active" : ""} onClick={() => setSelectedComponent(i)}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
