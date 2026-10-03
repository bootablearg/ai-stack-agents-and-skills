#!/usr/bin/env bash
# sync-opencode-plugin.sh — propaga el plugin canónico de OpenCode a los 4 usuarios.
#
# El plugin vive en .ai-stack (fuente única) y se COPIA a cada usuario, porque
# OpenCode carga los plugins desde ~/.config/opencode/plugin/ y no se verificó que
# siga symlinks. Correlo cada vez que toques el canónico.
#
#   sudo $AISTACK_HOME/scripts/sync-opencode-plugin.sh
#
# El canónico resuelve el home de cada usuario en runtime: no hay nada que editar
# por usuario. Ver: .ai-stack/AGENTS.md § Protocolo de arranque
set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AISTACK_HOME="${AISTACK_HOME:-$(dirname "$SCRIPT_DIR")}"
SRC="$AISTACK_HOME/scripts/plugins/protocol-enforce.js"
USUARIOS="${AISTACK_USERS:-user1 user2 user3 user4}"

[ -f "$SRC" ] || { echo "no existe el canónico: $SRC" >&2; exit 1; }
node --check "$SRC" || { echo "el canónico no compila, no propago" >&2; exit 1; }

for u in $USUARIOS; do
  home=$(getent passwd "$u" | cut -d: -f6)
  [ -n "$home" ] && [ -d "$home" ] || { printf '%-8s (sin home)\n' "$u"; continue; }
  dst="$home/.config/opencode/plugin"
  if [ ! -d "$dst" ]; then printf '%-8s (sin OpenCode)\n' "$u"; continue; fi

  install -o "$u" -g "$(id -gn "$u")" -m 644 "$SRC" "$dst/protocol-enforce.js"
  printf '%-8s ✅ %s\n' "$u" "$dst/protocol-enforce.js"
done
