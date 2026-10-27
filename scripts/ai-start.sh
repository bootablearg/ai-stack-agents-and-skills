#!/usr/bin/env bash
# ai-start.sh — arranca Codex / Gemini / Copilot con el Memory Vault ya cargado.
#
# Claude Code levanta la memoria solo (hook SessionStart en ~/.claude/settings.json).
# Los otros tres no tienen hooks de sesión, así que este wrapper les antepone al prompt
# los handoffs dirigidos a ellos + la memoria del proyecto y la global.
#
#   ai-start.sh codex   "revisá el diff de dev antes del rsync"
#   ai-start.sh gemini  "analizá este esquema"
#   ai-start.sh copilot "revisá esta función"
#   ai-start.sh codex --rw "aplicá la migración"   # Codex con permiso de escritura
#
# Por defecto Codex arranca en SOLO LECTURA (-s read-only). Con --rw escribe en el directorio
# de trabajo (-s workspace-write): pararse en la carpeta que corresponda antes de llamarlo.
# Ver: /skill memory · .ai-stack/AGENTS.md § Memoria compartida
set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AISTACK_HOME="${AISTACK_HOME:-$(dirname "$SCRIPT_DIR")}"
HOOK="$AISTACK_HOME/scripts/hooks/memory-session-start.js"

usage() {
  echo "uso: ai-start.sh <codex|gemini|copilot> [--rw] \"<prompt>\"" >&2
  exit 2
}

[ $# -lt 2 ] && usage
HARNESS="$1"; shift

RW=0
if [ "${1:-}" = "--rw" ]; then RW=1; shift; fi
[ $# -lt 1 ] && usage
PROMPT="$*"

case "$HARNESS" in
  codex|gemini|copilot) ;;
  *) echo "asistente desconocido: $HARNESS" >&2; usage ;;
esac

# Contexto del vault (si falla o está vacío, seguimos igual: nunca bloquear el arranque)
CONTEXT="$(node "$HOOK" --harness "$HARNESS" --plain --cwd "$PWD" 2>/dev/null || true)"

# Codex, Gemini y Copilot no tienen hooks de salida: para ellos el anti-adulación
# sólo puede viajar en el prompt. Claude Code y OpenCode además lo verifican con
# scripts/hooks/anti-sycophancy.js. Desactivable con AISTACK_ANTISYC=0.
if [ "${AISTACK_ANTISYC:-1}" = "0" ]; then
  ANTISYC_BLOCK=""
else
  ANTISYC_BLOCK='---

## ⚠️ Anti-adulación (obligatorio)

- Nada de elogios: ni "excelente pregunta", ni "buen ojo", ni "tenés razón" como apertura.
- No coincidas por defecto. Acordá sólo si lo verificaste, y mostrando el dato.
- Si el usuario se equivoca, decíselo derecho y con la evidencia, sin envolverlo en amabilidad.
- Aportá el contrapunto: dónde falla su enfoque, qué alternativa es mejor, qué costo no está viendo.
- No cambies de posición por presión; sólo ante un dato nuevo.
- Los fracasos y lo que quedó sin verificar van primero en la respuesta, no escondidos al final.
- Sin cierres de relleno ("espero que sirva", "cualquier cosa avisame").
'
fi

if [ -n "$CONTEXT" ]; then
  FULL_PROMPT="${CONTEXT}

${ANTISYC_BLOCK}
---

## Tarea

${PROMPT}"
  echo "🧠 Memory Vault cargado para ${HARNESS} ($(printf '%s' "$CONTEXT" | wc -c) chars)" >&2
else
  FULL_PROMPT="${ANTISYC_BLOCK}
## Tarea

${PROMPT}"
  echo "🧠 Vault vacío o no disponible — arranco sin memoria" >&2
fi

case "$HARNESS" in
  codex)
    if [ "$RW" -eq 1 ]; then
      # 🔴 El modo va explícito: sin `-s`, `codex exec` arranca en sólo lectura y `--rw` no
      #    escribía nada, aunque el comando salía con 0 (2026-10-13). `workspace-write`
      #    deja escribir en el directorio de trabajo, no en todo el disco.
      exec codex exec -s workspace-write --skip-git-repo-check "$FULL_PROMPT"
    else
      exec codex exec -s read-only --skip-git-repo-check "$FULL_PROMPT"
    fi
    ;;
  gemini)  exec gemini -p "$FULL_PROMPT" ;;
  copilot) exec copilot -p "$FULL_PROMPT" ;;
esac
