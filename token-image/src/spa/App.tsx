import React from "react";
import { TokenProvider } from "./context";
import TokenEditor from "./components/TokenEditor";
import ThemeSwitcher from "./components/ThemeSwitcher";
import Preview from "./components/Preview";
import ComponentList from "./components/ComponentList";

function AppInner() {
  return (
    <div className="app">
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
