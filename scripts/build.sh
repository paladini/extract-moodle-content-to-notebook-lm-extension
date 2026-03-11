#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build.sh  –  Package the Chrome extension as a distributable .zip
#
# Usage:
#   ./scripts/build.sh                   # uses version from manifest.json
#   ./scripts/build.sh 1.2.3             # override version
#   VERSION=1.2.3 ./scripts/build.sh     # same via env var
#
# Output: dist/moodle-extractor-<version>.zip
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"

# ── Resolve version ──────────────────────────────────────────────────────────
if [[ -n "${1:-}" ]]; then
  VERSION="$1"
elif [[ -n "${VERSION:-}" ]]; then
  : # already set via environment
else
  # Read version from manifest.json (requires python3 or jq)
  if command -v jq &>/dev/null; then
    VERSION="$(jq -r '.version' "$REPO_ROOT/manifest.json")"
  elif command -v python3 &>/dev/null; then
    VERSION="$(python3 -c "import json,sys; print(json.load(open('$REPO_ROOT/manifest.json'))['version'])")"
  else
    echo "❌  Could not determine version. Install jq or python3, or pass the version as an argument." >&2
    exit 1
  fi
fi

ARCHIVE_NAME="moodle-extractor-${VERSION}.zip"
ARCHIVE_PATH="$DIST_DIR/$ARCHIVE_NAME"

echo "📦  Building Moodle Extractor v${VERSION}…"

# ── Create dist dir ──────────────────────────────────────────────────────────
mkdir -p "$DIST_DIR"

# ── Build zip ───────────────────────────────────────────────────────────────
# Extension files – everything at the root except dev/CI artifacts
cd "$REPO_ROOT"
zip -r "$ARCHIVE_PATH" \
  manifest.json \
  background.js \
  content.js \
  popup.html \
  popup.js \
  icons/ \
  -x "*.DS_Store" "*.swp"

echo "✅  Package ready: $ARCHIVE_PATH"
echo "    Size: $(du -sh "$ARCHIVE_PATH" | cut -f1)"
