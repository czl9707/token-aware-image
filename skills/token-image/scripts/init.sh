#!/usr/bin/env bash
# token-image init script
# Bootstraps a .token-image/ workspace for generating and editing themed images.
#
# Usage: bash <skill_base_dir>/scripts/init.sh --preset <name>
#
# Run this once per project before using the token-image skill.
# --preset is required. Available presets match subdirectories in assets/.

set -e

PRESET=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --preset) PRESET="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$PRESET" ]; then
  echo "Error: --preset is required."
  echo "Usage: bash <skill_base_dir>/scripts/init.sh --preset <name>"
  echo ""
  echo "Available presets:"
  SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  ls "$SKILL_DIR/assets/" | sed 's/^/  /'
  exit 1
fi

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE=".token-image"

if [ ! -d "$SKILL_DIR/assets/$PRESET" ]; then
  echo "Error: Preset '$PRESET' not found in $SKILL_DIR/assets/"
  ls "$SKILL_DIR/assets/" | sed 's/^/  /'
  exit 1
fi

echo "Setting up token-image workspace (preset: $PRESET)..."

# 1. Create workspace directories
mkdir -p "$WORKSPACE/src"

# 2. Copy all presets to tokens/ (each as tokens/<name>/)
for preset_dir in "$SKILL_DIR"/assets/*/; do
  name=$(basename "$preset_dir")
  mkdir -p "$WORKSPACE/tokens/$name"
  for file in "$preset_dir"*; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    target="$WORKSPACE/tokens/$name/$filename"
    if [ -f "$target" ]; then
      echo "  ✓ $target already exists, skipping"
    else
      cp "$file" "$target"
      echo "  ✓ Copied to $target"
    fi
  done
done

# 3. Set src/token.active.json from chosen preset if not present
if [ -f "$WORKSPACE/src/token.active.json" ]; then
  echo "  ✓ $WORKSPACE/src/token.active.json already exists, skipping"
else
  cp "$SKILL_DIR/assets/$PRESET/tokens.json" "$WORKSPACE/src/token.active.json"
  echo "  ✓ Created $WORKSPACE/src/token.active.json from $PRESET preset"
fi

# 4. package.json
if [ ! -f "$WORKSPACE/package.json" ]; then
  cat > "$WORKSPACE/package.json" <<'PKGJSON'
{
  "name": "token-image-workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "render": "token-image render",
    "render:2x": "token-image render --scale 2",
    "editor": "token-image editor"
  },
  "dependencies": {
    "@zane-chen/token-image": "^0.1.0",
    "react": "^18.3.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0"
  }
}
PKGJSON
  echo "  ✓ Created $WORKSPACE/package.json"
else
  echo "  ✓ $WORKSPACE/package.json already exists, skipping"
fi

# 5. tsconfig.json
if [ -f "$WORKSPACE/tsconfig.json" ]; then
  echo "  ✓ $WORKSPACE/tsconfig.json already exists, skipping"
else
  cat > "$WORKSPACE/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": false,
    "jsx": "react-jsx"
  }
}
EOF
  echo "  ✓ Created $WORKSPACE/tsconfig.json"
fi

# 6. Install dependencies
echo "  Installing dependencies..."
(cd "$WORKSPACE" && npm install --quiet)
echo "  ✓ Dependencies installed"

echo ""
echo "Done. Next steps:"
echo "  1. Run the token-image skill in your coding agent to generate components"
echo "  2. cd $WORKSPACE"
echo "  3. npm run render              # render all .tsx → .png"
echo "     npm run render -- square-1  # render one component"
echo "     npm run render:2x           # render all at 2x DPI"
echo "  4. npm run editor              # launch visual token editor"
echo "  5. Switch presets: copy any tokens/<preset>/tokens.json over src/token.active.json (currently: $PRESET)"
