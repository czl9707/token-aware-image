# Token-Aware-Image

One pain point in AI image generation is the last mile of pixel adjustment. Token-Image is a skill trying to bridge that gap.

Instead of generating a flat image, Token-Image writes React components backed by a design token system. Every color, font, spacing value, and radius is a token — tweak one number and every image in the set updates. The visual editor gives you a live browser preview to dial things in before rendering to PNG.

```
Prompt → AI agents write React components → Token-controlled design → PNG via Playwright
```

## Installation

### Coding agent skill (any agent)

```bash
npx skills install
```

Then point it at this repository. Works with Claude Code, opencode, and any agent that supports the skills format.

### Claude Code Marketplace

Install directly from the Claude Code marketplace — search for **token-aware-image**.

## Quick Start

1. Open your project in a coding agent that has this skill installed
2. Ask it to generate images — e.g. *"Build 4 blog banners for my React series"*
3. Pick a preset when prompted (nothing, brutalism, glassmorphism, etc.)
4. Get themed PNG images rendered via Playwright

## The Token System

Every visual property is a token — a named value in a JSON file. Change `color.accent` from red to blue and every image in the set updates instantly. No re-prompting, no re-generating.

A token file looks like this:

```json
{
  "color": {
    "bg": "#000000",
    "surface": "#111111",
    "border": "#333333",
    "text": "#E8E8E8",
    "accent": "#D71921"
  },
  "fontSize": {
    "hero": 72,
    "h1": 48,
    "h2": 36,
    "body": 16
  },
  "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
  "radius": { "sm": 4, "md": 8, "lg": 16 }
}
```

Tokens cover color, font families, sizes, weights, line heights, letter spacing, spacing, border radius, and opacity. There are 13 built-in presets, or you can create your own.

## Companion CLI — `@zane-chen/token-image`

A standalone CLI for rendering and visually editing your images outside the agent.

```bash
npm install -g @zane-chen/token-image
```

<!-- TODO: Add screenshot of the visual editor here -->
<!-- ![Visual Editor](docs/editor-screenshot.png) -->

| Command | Description |
|---------|-------------|
| `token-image render` | Render all `.tsx` → `.png` |
| `token-image render <name>` | Render one component |
| `token-image render --scale 2` | Render at 2x DPI |
| `token-image editor` | Launch visual editor (Express API + Vite SPA on localhost) |

The visual editor gives you a live preview with color pickers, sliders for spacing and radius, and a preset switcher — see your changes before committing to a render.

## Presets

13 built-in design systems:

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

## Architecture

```
Component.tsx → Vite dev server → Playwright screenshot → PNG
```

Components are React `.tsx` files that:
- Declare their size with `// @size WxH`
- Export a default function receiving `{ tokens }`
- Import a shared stylesheet and viewport wrapper
- Render HTML/CSS using token-driven CSS custom properties

The rendering pipeline flattens tokens to CSS variables, serves components through a temporary Vite dev server, and screenshots them with Playwright at the declared dimensions.

## Creating a Custom Preset

1. Create `assets/<your-preset>/tokens.json` with your token values
2. Create `assets/<your-preset>/design-guide.md` with design principles and stylesheet overrides
3. Run `init.sh --preset <your-preset>` — it auto-discovers new presets

## License

MIT
