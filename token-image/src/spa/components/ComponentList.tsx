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
  const { components, selectedComponent, setSelectedComponent, save, discard, isDirty, undo, redo, canUndo, canRedo } = useTokens();
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
      <div className="component-toolbar">
        <div className="component-tabs">
          {components.map((c) => (
            <button
              key={c.name}
              className={`component-tab ${c.name === selectedComponent ? "active" : ""}`}
              onClick={() => setSelectedComponent(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">←</button>
          <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">→</button>
          <span className="toolbar-separator" />
          {isDirty && <span className="dirty-indicator">*</span>}
          <button className="action-btn" onClick={discard} disabled={!isDirty}>Discard</button>
          <button className="action-btn primary" onClick={handleSave} disabled={!isDirty}>Save</button>
        </div>
      </div>
      <Toast message="Tokens saved — re-render in your coding agent to update images." visible={showToast} />
    </>
  );
}
