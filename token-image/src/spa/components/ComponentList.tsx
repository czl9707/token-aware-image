import React, { useState, useEffect, useCallback } from "react";
import { useTokens } from "../context";

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`toast ${visible ? "toast-visible" : ""}`}>
      {message}
    </div>
  );
}

export default function ComponentList() {
  const { components, selectedComponent, setSelectedComponent, save, discard, isDirty } = useTokens();
  const [showToast, setShowToast] = useState(false);

  const handleSave = useCallback(() => {
    save();
    setShowToast(true);
  }, [save]);

  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(id);
  }, [showToast]);

  if (components.length === 0) return null;
  return (
    <>
      <div className="component-tabs">
        <div className="component-tabs-list">
          {components.map((c, i) => (
            <button key={c.name} className={i === selectedComponent ? "active" : ""} onClick={() => setSelectedComponent(i)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="component-tabs-actions">
          {isDirty && <span className="dirty-indicator">*</span>}
          <button onClick={discard} disabled={!isDirty}>Discard</button>
          <button className="primary" onClick={handleSave} disabled={!isDirty}>Save</button>
        </div>
      </div>
      <Toast message="Tokens saved — re-render in your coding agent to update images." visible={showToast} />
    </>
  );
}
