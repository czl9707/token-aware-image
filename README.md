# Token-Aware-Image

One pain point in AI image generation is the last mile of pixel adjustment. Token-Image is a skill trying to bridge that gap.

Instead of generating a flat image, Token-Image writes React components backed by a design token system. Every color, font, spacing value, and radius is a token — tweak one number and every image in the set updates. The visual editor gives you a live browser preview to dial things in before rendering to PNG.

```
Prompt → AI agents write React components → Token-controlled design → PNG via Playwright
```
