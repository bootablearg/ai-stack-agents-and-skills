#!/usr/bin/env bash
# shot.sh — screenshot real desktop + mobile para auditar estética (anti-ai-design)
# Uso: shot.sh "<url>" <slug>
# Salida: $WORKSPACE/temp/<slug>_desktop.png y <slug>_mobile.png
set -euo pipefail

URL="${1:?Falta la URL. Uso: shot.sh \"<url>\" <slug>}"
SLUG="${2:-shot}"
OUT="$WORKSPACE/temp"
mkdir -p "$OUT"

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [ -z "$CHROME" ]; then
  echo "ERROR: no encontré google-chrome/chromium en el PATH." >&2
  exit 1
fi

COMMON=(--headless --disable-gpu --no-sandbox --hide-scrollbars --ignore-certificate-errors)

echo "→ Desktop (1440x900): $OUT/${SLUG}_desktop.png"
"$CHROME" "${COMMON[@]}" --window-size=1440,900 \
  --screenshot="$OUT/${SLUG}_desktop.png" "$URL"

echo "→ Mobile (390x844): $OUT/${SLUG}_mobile.png"
"$CHROME" "${COMMON[@]}" --window-size=390,844 \
  --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" \
  --screenshot="$OUT/${SLUG}_mobile.png" "$URL"

echo "OK. Abrí los PNG con Read para auditar lo renderizado (no el HTML)."
