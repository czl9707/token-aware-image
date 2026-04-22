import React, { useState, useEffect, useCallback } from "react";
import { TokenProvider, useTokens } from "./context";
import TokenEditor from "./components/TokenEditor";
import ThemeSwitcher from "./components/ThemeSwitcher";
import Preview from "./components/Preview";
import ComponentList from "./components/ComponentList";

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`toast ${visible ? "toast-visible" : ""}`}>
      {message}
    </div>
  );
}

function Header() {
  const { save, discard, isDirty } = useTokens();
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

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1>token-image</h1>
          {isDirty && <span className="dirty-indicator">*</span>}
        </div>
        <div className="header-actions">
          <button onClick={discard} disabled={!isDirty}>Discard</button>
          <button className="primary" onClick={handleSave} disabled={!isDirty}>Save</button>
        </div>
      </header>
      <Toast message="Tokens saved — re-render in your coding agent to update images." visible={showToast} />
    </>
  );
}

function AppInner() {
  return (
    <div className="app">
      <Header />
      <div className="preview-panel">
        <ComponentList />
        <Preview />
      </div>
      <div className="editor-panel">
        <ThemeSwitcher />
        <TokenEditor />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TokenProvider>
      <AppInner />
    </TokenProvider>
  );
}
