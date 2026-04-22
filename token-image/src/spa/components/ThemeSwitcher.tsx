import React, { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { useTokens } from "../context";

export default function ThemeSwitcher() {
  const { presets, loadPreset, saveAsPreset } = useTokens();
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  return (
    <div className="theme-switcher">
      <label>Switch Preset</label>
      <Select.Root value={selectedPreset} onValueChange={(v) => { if (v) { loadPreset(v); setSelectedPreset(""); } }}>
        <Select.Trigger className="select-trigger">
          <Select.Value placeholder="Select a preset..." />
          <Select.Icon className="select-icon">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content">
            <Select.Viewport>
              {presets.map((p) => (
                <Select.Item key={p.name} value={p.name} className="select-item">
                  <Select.ItemText>{p.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <label>Save as Preset</label>
      <div className="preset-actions">
        <input type="text" placeholder="preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
        <button onClick={() => { if (presetName.trim()) { saveAsPreset(presetName.trim()); setPresetName(""); } }} disabled={!presetName.trim()}>Save</button>
      </div>
    </div>
  );
}
