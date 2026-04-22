export async function fetchTokens(): Promise<Record<string, any>> {
  const res = await fetch("/api/tokens");
  if (!res.ok) throw new Error(`Failed to fetch tokens: ${res.status}`);
  return res.json();
}

export async function saveTokens(tokens: Record<string, any>): Promise<void> {
  const res = await fetch("/api/tokens", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) throw new Error(`Failed to save tokens: ${res.status}`);
}

export async function fetchPresets(): Promise<{ name: string; file: string }[]> {
  const res = await fetch("/api/presets");
  if (!res.ok) throw new Error(`Failed to fetch presets: ${res.status}`);
  return res.json();
}

export async function loadPreset(name: string): Promise<Record<string, any>> {
  const res = await fetch(`/api/presets/${name}`);
  if (!res.ok) throw new Error(`Failed to load preset: ${res.status}`);
  return res.json();
}

export async function saveAsPreset(name: string, tokens: Record<string, any>): Promise<void> {
  const res = await fetch(`/api/presets/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) throw new Error(`Failed to save preset: ${res.status}`);
}

export async function fetchComponents(): Promise<any[]> {
  const res = await fetch("/api/components");
  if (!res.ok) throw new Error(`Failed to fetch components: ${res.status}`);
  return res.json();
}
