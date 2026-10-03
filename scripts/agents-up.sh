#!/usr/bin/env bash
# agents-up.sh — habilita el agente Claude remote-control como servicio systemd de usuario.
#
# Esquema: UN solo host multi-sesion (nombre en $AISTACK_RC_NAME) que corre en la raiz del
# workspace ($WORKSPACE) en modo subcomando `claude remote-control` (capacidad 0/32).
# Desde claude.ai/code se cuelgan varios chats del mismo agente. Con linger ON sobrevive al
# logout y arranca al boot.
#
#   bash $AISTACK_HOME/scripts/agents-up.sh           # habilita + arranca el host (--now)
#   bash $AISTACK_HOME/scripts/agents-up.sh --boot    # solo habilita (arranca al proximo boot)
#
# Unit: ~/.config/systemd/user/$AISTACK_RC_UNIT (por defecto claude-rc.service)
# Variables: AISTACK_RC_UNIT (unit systemd) y AISTACK_RC_NAME (nombre del screen/log).
set -euo pipefail

UNIT="${AISTACK_RC_UNIT:-claude-rc.service}"
NAME="${AISTACK_RC_NAME:-$(hostname -s)}"
MODE="${1:-now}"

systemctl --user daemon-reload

if [ "$MODE" = "--boot" ]; then
  systemctl --user enable "$UNIT" >/dev/null 2>&1
  echo "✅ $NAME: habilitado (arranca al próximo boot)"
else
  systemctl --user enable --now "$UNIT"
  echo "✅ $NAME: habilitado + arrancado ya"
fi

echo
echo "Estado:           systemctl --user status $UNIT"
echo "Reiniciar:        systemctl --user restart $UNIT"
echo "Entrar al screen: screen -r $NAME        (salir sin matar: Ctrl-a d)"
echo "Logs (claude):    tail -f ${WORKSPACE:-$HOME/workspace}/temp/rc-$NAME.log"
echo "Logs (systemd):   journalctl --user -u $UNIT -f"
