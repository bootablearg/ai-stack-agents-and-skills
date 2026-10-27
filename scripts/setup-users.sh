#!/usr/bin/env bash
# setup-users.sh — cablea cada cuenta del grupo aistack al cerebro compartido.
#
# Crea (idempotente) los symlinks documentados en SETUP.md para que Claude Code,
# Codex, Gemini CLI, Copilot/DSH, OpenCode y Hermes lean las MISMAS reglas, skills
# y agentes desde $AISTACK_HOME. No copia nada: son symlinks, así que mantener un
# solo lugar alcanza.
#
#   bash $AISTACK_HOME/scripts/setup-users.sh --dry-run
#   sudo bash $AISTACK_HOME/scripts/setup-users.sh
#
# Necesita root porque escribe en homes ajenos, pero crea todo COMO EL USUARIO
# (sudo -u), para no dejar archivos root:root que su dueño no pueda leer.
# Ver: AGENTS.md § Cerebro compartido.
#
# Usuarios: $AISTACK_USERS si está definida; si no, los miembros del grupo
# $AISTACK_GROUP (default: aistack) menos root.
#
# OJO: no toca ~/.config/opencode/opencode.json ni ~/.claude/settings.json.
# opencode.json guarda la apiKey del proveedor y settings.json la política de
# permisos de cada persona: son config por usuario, no del stack. El campo
# "instructions" de opencode.json se revisa a mano.
set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AISTACK_HOME="${AISTACK_HOME:-$(dirname "$SCRIPT_DIR")}"
AISTACK_GROUP="${AISTACK_GROUP:-aistack}"
WORKSPACE_REL="${AISTACK_WORKSPACE_REL:-workspace}"

DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

# Sin root el resultado es ENGAÑOSO: no se puede atravesar el home de las otras cuentas,
# así que sus symlinks parecen ausentes y el script intentaría recrearlos. Correlo con sudo.
if [ "$(id -u)" -ne 0 ]; then
  echo "necesita root: escribe en homes ajenos y sin root los lee mal. Usá: sudo bash $0 [--dry-run]" >&2
  exit 1
fi

[ -f "$AISTACK_HOME/AGENTS.md" ] || { echo "no encuentro $AISTACK_HOME/AGENTS.md" >&2; exit 1; }

if [ -n "${AISTACK_USERS:-}" ]; then
  USUARIOS="$AISTACK_USERS"
else
  USUARIOS="$(getent group "$AISTACK_GROUP" | cut -d: -f4 | tr ',' '\n' | grep -vx root | tr '\n' ' ')"
fi
[ -n "${USUARIOS// /}" ] || { echo "no hay usuarios que cablear (grupo $AISTACK_GROUP vacío)" >&2; exit 1; }

ok=0; new=0; fail=0

# home_de <usuario> — el home real de la cuenta, según passwd.
home_de() { getent passwd "$1" | cut -d: -f6; }

# link <usuario> <ruta relativa al home> <destino>
link() {
  local u="$1" rel="$2" tgt="$3" home p dir
  home="$(home_de "$u")"
  p="$home/$rel"

  if [ -L "$p" ] && [ "$(readlink "$p")" = "$tgt" ]; then
    printf '  = %-8s %-24s ya ok\n' "$u" "$rel"; ok=$((ok+1)); return 0
  fi
  if [ -e "$p" ] && [ ! -L "$p" ]; then
    printf '  ! %-8s %-24s existe y NO es symlink: no lo toco\n' "$u" "$rel"; fail=$((fail+1)); return 1
  fi
  if [ "$DRY" = 1 ]; then
    printf '  + %-8s %-24s -> %s\n' "$u" "$rel" "$tgt"; new=$((new+1)); return 0
  fi

  dir="$(dirname "$rel")"
  if [ "$dir" != "." ]; then
    sudo -u "$u" -H mkdir -p "$home/$dir" || {
      printf '  ! %-8s %-24s no pude crear %s\n' "$u" "$rel" "$dir"; fail=$((fail+1)); return 1; }
  fi
  if sudo -u "$u" -H ln -sfn "$tgt" "$p"; then
    printf '  + %-8s %-24s -> %s\n' "$u" "$rel" "$tgt"; new=$((new+1))
  else
    printf '  ! %-8s %-24s no pude crear el symlink\n' "$u" "$rel"; fail=$((fail+1)); return 1
  fi
}

echo "cableando cuentas al cerebro compartido ($AISTACK_HOME)"
[ "$DRY" = 1 ] && echo "MODO DRY-RUN: no se escribe nada"

for u in $USUARIOS; do
  if ! getent passwd "$u" >/dev/null; then
    printf '  ! %-8s no existe esa cuenta\n' "$u"; fail=$((fail+1)); continue
  fi
  echo
  echo "$u:"
  link "$u" .claude/CLAUDE.md      "$AISTACK_HOME/AGENTS.md"
  link "$u" .claude/skills         "$AISTACK_HOME/skills"
  link "$u" .claude/agents         "$AISTACK_HOME/agents"
  link "$u" .codex/AGENTS.md       "$AISTACK_HOME/AGENTS.md"
  link "$u" .gemini/GEMINI.md      "$AISTACK_HOME/AGENTS.md"
  link "$u" .config/opencode/skill "$AISTACK_HOME/skills-opencode"
  link "$u" .hermes/AGENTS.md      "$AISTACK_HOME/AGENTS.md"
  # DSH lee $DSH_HOME/AGENTS.md como instrucciones globales. Sólo si la cuenta ya usa DSH:
  # crear ~/.dsh a mano le dejaría un home a medio inicializar.
  if [ -d "$(home_de "$u")/.dsh" ]; then
    link "$u" .dsh/AGENTS.md         "$AISTACK_HOME/AGENTS.md"
  fi
  link "$u" "$WORKSPACE_REL/AGENTS.md" "$AISTACK_HOME/AGENTS.md"
done

echo
printf 'resultado: %d ya ok, %d nuevos, %d con problema\n' "$ok" "$new" "$fail"
[ "$fail" -eq 0 ]
