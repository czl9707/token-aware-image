# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Overview

This repository has two parts:

- **`skills/token-image/`** — A coding agent skill that orchestrates AI agents to write themed image React components
- **`token-image/`** — npm CLI package (`v0.1.0`, ESM, `bin: token-image`) with `render` and `editor` subcommands

Components live in `.token-image/src/` and render to PNG via Playwright browser screenshot. The workspace is bootstrapped by `init.sh --preset <name>` or `init.sh --tokens <path/to/tokens.json>`.

## Commands

Run from inside `.token-image/`:

| Command | Description |
|---------|-------------|
| `npm run render` | Render all `.tsx` → `.png` |
| `npm run render -- <name>` | Render one component by bare name |
| `npm run render:2x` | Render all at 2x DPI |
| `npm run editor` | Launch visual token editor (Express API on :3456 + Vite SPA on :5173) |



## Architecture

### Rendering Pipeline

```
Component.tsx → Vite dev server → Playwright screenshot → PNG
```

1. `render.ts` reads `src/token.active.json`, flattens tokens to CSS vars, builds Google Fonts URL
2. For each `.tsx` component, generates temp HTML shell (with `:root` CSS vars) + entry TS (imports component, renders with tokens prop)
3. Vite dev server serves files, Playwright opens Chromium, waits for `data-ready="true"` on root element
4. Screenshots at the component's `// @size WxH` dimensions × scale factor

Components must:
- Start with `// @size WxH` (or `// @viewport WxH`)
- Export default `function Component({ tokens }: { tokens: Record<string, any> })`
- Import `"./styles.css"` and `"./viewport"`
- Wrap content in `<Viewport tokens={tokens} variant="standard|hero">`

### Skill Workflow (4 phases)

**Phase 0: Pre-flight** — Check for `.token-image/` workspace, read active tokens.

**Phase 1: Intake** — Ask user for theme (13 presets or custom token file), images, format, and per-image layout. Run `init.sh --preset <name>` or `init.sh --tokens <path>` if workspace missing.

**Phase 2: Generate**
- Step 1: Orchestrator writes content briefs with creative direction per image
- Step 2: Shared-files agent creates `viewport.tsx` + `styles.css` from design guide + references
- Step 3: Parallel Writer+Reviewer agent pairs (max 3 rounds per image). Writers use CSS classes from stylesheet + `tokens` prop. Reviewers render PNG and check code compliance + visual quality.

**Phase 3: Output** — Save all files to `.token-image/src/`, summarize results.

### Token System

Tokens are stored in `assets/<preset>/tokens.json`. Init copies all presets to `.token-image/tokens/<preset>/` and the chosen preset's tokens (or a custom token file via `--tokens`) to `.token-image/src/token.active.json`.

**Unit handling** (`token-image/src/spa/utils/tokens.ts`):
- `TOKEN_UNITS`: fontSize/spacing/radius → px, letterSpacing → em
- `flattenToCSSVars()`: emits `:root { --key: valueunit; }` CSS
- `toCSSVarRefs()`: creates `{ key: "var(--key)" }` for component props
- Numeric values stored unitless in JSON

### Visual Editor

Express API (`src/server/api.js`) provides CRUD for tokens, presets, and component listing. React SPA (`src/spa/`) with:
- `context.tsx` — TokenProvider + TokenStyleSheet (injects CSS vars into `:root`, auto-loads Google Fonts)
- `Preview.tsx` — Live preview via Vite `/@fs/` dynamic import, ResizeObserver auto-scaling
- `TokenEditor.tsx` — Accordion per token category, native color inputs + Radix UI sliders
- `ThemeSwitcher.tsx` — Preset dropdown + save-as-preset
- `ComponentList.tsx` — Tab bar for switching components

`App.css` uses `@property` declarations for all token CSS custom properties to enable transitions.

## Key Files

### Skill (`skills/token-image/`)

| File | Purpose |
|------|---------|
| `SKILL.md` | Skill definition (4 phases, intake questions, agent dispatch workflow) |
| `scripts/init.sh` | Bootstraps `.token-image/` workspace (`--preset <name>` or `--tokens <path>`) |
| `prompts/writer.md` | Writer agent prompt |
| `prompts/reviewer.md` | Reviewer agent prompt |
| `prompts/shared.md` | Shared files agent prompt (Viewport + Stylesheet) |
| `assets/<preset>/tokens.json` | Token values for a preset |
| `assets/<preset>/design-guide.md` | Design principles + stylesheet overrides + decoration palette |
| `references/default-styles.css` | Base CSS stylesheet (typography, cards, grids, layout) |
| `references/viewports.md` | Viewport component examples |
| `references/components.md` | Layout pattern reference (paired CSS+TSX) |
| `references/styles.csv` | 34+ visual styles with token specs |
| `references/colors.csv` | 161 color palettes by product type |
| `references/typography.csv` | 73+ Google Font pairings |
| `references/design.csv` | Detailed design system specs |

### CLI Package (`token-image/`)

| File | Purpose |
|------|---------|
| `cli.js` | CLI entry point (render + editor subcommands) |
| `src/types.ts` | Tokens TypeScript interface |
| `src/render.ts` | Playwright render pipeline |
| `src/server/api.js` | Express REST API (tokens, presets, components) |
| `src/spa/context.tsx` | TokenProvider context + TokenStyleSheet |
| `src/spa/utils/tokens.ts` | camelToKebab, TOKEN_UNITS, flattenToCSSVars, toCSSVarRefs |
| `src/spa/components/Preview.tsx` | Live component preview |
| `src/spa/components/TokenEditor.tsx` | Visual token editor |
| `src/spa/components/ThemeSwitcher.tsx` | Preset switcher + save-as-preset |
| `src/spa/components/ComponentList.tsx` | Component tab selector |
| `tests/api.test.js` | API endpoint tests (Node.js built-in test runner) |

## Available Presets

| Preset | Style | Colors | Fonts |
|--------|-------|--------|-------|
| `nothing` | Monochrome, typographic | Black/white + red accent | Doto, Space Grotesk, Space Mono |
| `brutalism` | Raw, stark | White/black + red | Space Mono |
| `neo-brutalism` | Cream bg, thick borders | Cream + black + hot red | Space Grotesk |
| `glassmorphism` | Frosted glass | Dark blue + translucent white | Inter, JetBrains Mono |
| `aurora-ui` | Northern Lights gradients | Dark + purple/cyan | Outfit, Work Sans, JetBrains Mono |
| `retro-futurism` | 80s cyberpunk neon | Deep purple + cyan/pink | Orbitron, Exo 2, JetBrains Mono |
| `bauhaus` | Geometric constructivist | Off-white + primary colors | Outfit, Space Mono |
| `terminal` | CLI green-on-black | Black + green/amber | JetBrains Mono |
| `claymorphism` | Soft 3D, playful | Lavender + violet | Nunito, DM Sans, DM Mono |
| `liquid-glass` | Iridescent glass | Dark + cyan/rainbow | Syne, Manrope, Geist Mono |
| `neumorphism` | Soft extruded UI | Clay gray + violet | Plus Jakarta Sans, JetBrains Mono |
| `modern-dark` | Cinematic dark blobs | Near-black + indigo | Inter, JetBrains Mono |
| `sketch` | Hand-drawn notebook | Warm paper + pencil + red marker | Kalam, Patrick Hand, Caveat |

## Development

### Testing

```bash
cd token-image
node --test tests/api.test.js
```

### Modifying the Skill

**Adding a format:**
1. Update `skills/token-image/SKILL.md` Phase 1 format options

**Adding a preset:**
1. Create `skills/token-image/assets/<name>/tokens.json`
2. Create `skills/token-image/assets/<name>/design-guide.md`
3. `init.sh` auto-discovers new presets

**Changing a preset:**
1. Edit `skills/token-image/assets/<preset>/tokens.json` for values
2. Edit `skills/token-image/assets/<preset>/design-guide.md` for overrides

**Adding CSS classes:**
1. Edit `skills/token-image/references/default-styles.css`
2. Document in `skills/token-image/references/components.md`

**Adjusting agent prompts:**
1. `prompts/writer.md` — Writer guidance
2. `prompts/reviewer.md` — Reviewer validation rules
3. `prompts/shared.md` — Shared files agent instructions

### Testing in a Real Project

```bash
cd /path/to/test-project
bash /path/to/skills/token-image/scripts/init.sh --preset nothing
# or with a custom token file:
bash /path/to/skills/token-image/scripts/init.sh --tokens /path/to/my-tokens.json

# Run the skill in your coding agent to generate components

cd .token-image
npm run render                    # render all
npm run render -- square-1        # render one
npm run render:2x                 # render all at 2x
npm run editor                    # visual editor
```
