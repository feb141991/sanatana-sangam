#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE="$SCRIPT_DIR/og-card-template.html"
OUTPUT="$REPO_DIR/public/og-image.png"

CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME_BIN" ]; then
  CHROME_BIN="$(which google-chrome || which chromium || true)"
fi

if [ -z "$CHROME_BIN" ] || [ ! -f "$CHROME_BIN" ]; then
  echo "Error: Google Chrome not found for headless OG image generation."
  exit 1
fi

echo "Generating OG image from $TEMPLATE using $CHROME_BIN..."
"$CHROME_BIN" \
  --headless \
  --disable-gpu \
  --allow-file-access-from-files \
  --window-size=1200,630 \
  --screenshot="$OUTPUT" \
  "file://$TEMPLATE"

echo "OG image generated successfully at $OUTPUT ($(wc -c < "$OUTPUT" | tr -d ' ') bytes)"
