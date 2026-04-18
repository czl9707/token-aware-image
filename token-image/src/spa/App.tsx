import React from "react";
import { TokenProvider, useTokens } from "./context";
import TokenEditor from "./components/TokenEditor";
import ThemeSwitcher from "./components/ThemeSwitcher";
import Preview from "./components/Preview";
import ComponentList from "./components/ComponentList";

function Header() {
  const { save, discard, isDirty } = useTokens();
  return (
    <header className="header">
      <div className="header-left">
        <h1>token-image</h1>
        {isDirty && <span className="dirty-indicator">*</span>}
      </div>
      <div className="header-actions">
        <button onClick={discard} disabled={!isDirty}>Discard</button>
        <button className="primary" onClick={save} disabled={!isDirty}>Save</button>
      </div>
    </header>
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
