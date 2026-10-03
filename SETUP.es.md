# Instalación y uso

> 🇬🇧 [English version](SETUP.md)

Un cerebro compartido para asistentes de IA. Un solo juego de reglas, skills y agentes
que **Claude Code, Codex, Gemini CLI, GitHub Copilot CLI y OpenCode** leen del mismo
lugar, para todas las cuentas de la máquina.

## Qué es esto

| Directorio | Qué vive ahí |
|---|---|
| `skills/` | Skills — playbooks invocables (`SKILLS_CATALOG.md` se genera solo) |
| `agents/` | Subagentes especialistas en formato Claude subagent |
| `agents-lib/` | Librería extendida de agentes, categorizada, con adaptadores para otros asistentes |
| `gstack/` | Herramientas de orquestación |
| `codex/` | Manuales de handoff Claude ↔ Codex |
| `scripts/` | Hooks y scripts de mantenimiento |
| `vendor/` | Skills de terceros, sin modificar, cada uno con su LICENSE |
| `AGENTS.md` | **Las reglas.** Las lee cada asistente en cada sesión |

**Sólo conocimiento.** Nada de estado de ejecución, bitácoras ni credenciales — ver
[Qué nunca va acá](#qué-nunca-va-acá).

## Requisitos

- **Node.js 18+** — los hooks usan sólo la librería estándar, sin `npm install`
- **Bash** — para los scripts de mantenimiento
- Uno o más de: Claude Code · Codex · Gemini CLI · Copilot CLI · OpenCode

## Instalación

### 1. Ubicar el stack

En cualquier lugar legible por todas las cuentas que lo vayan a usar. Conviene fuera del
home de cualquier usuario, para que no sea de uno solo:

```bash
sudo git clone <url-del-repo> /opt/ai-stack     # o /srv/ai-stack, /usr/local/share/ai-stack…
export AISTACK_HOME=/opt/ai-stack               # agregalo al perfil del shell
```

Los scripts resuelven su propia ubicación, así que `AISTACK_HOME` es **opcional**:
definila sólo si los llamás desde algún lugar raro.

### 2. Acceso multiusuario (opcional)

```bash
sudo groupadd aistack
sudo usermod -aG aistack <usuario>                     # por cada cuenta
sudo chgrp -R aistack "$AISTACK_HOME"
sudo chmod -R g+rwX "$AISTACK_HOME"
sudo find "$AISTACK_HOME" -type d -exec chmod g+s {} + # lo nuevo hereda el grupo

# Recomendado: lo nuevo nace con escritura de grupo sin importar el umask de cada uno
sudo setfacl -R -m g:aistack:rwX -m d:g:aistack:rwX "$AISTACK_HOME"
```

> Sin la ACL, los archivos creados con umask `022` nacen `644` y el resto del grupo no
> los puede editar. Con ella, no volvés a necesitar un `chmod` a mano.

### 3. Conectar tu asistente

| Asistente | Comando |
|---|---|
| **Claude Code** | `ln -s "$AISTACK_HOME/AGENTS.md" ~/.claude/CLAUDE.md`<br>`ln -s "$AISTACK_HOME/skills" ~/.claude/skills`<br>`ln -s "$AISTACK_HOME/agents" ~/.claude/agents` |
| **Codex** | `ln -s "$AISTACK_HOME/AGENTS.md" ~/.codex/AGENTS.md` |
| **Gemini CLI** | `ln -s "$AISTACK_HOME/AGENTS.md" ~/.gemini/GEMINI.md` |
| **Copilot CLI** | `ln -s "$AISTACK_HOME/AGENTS.md" <tu-workspace>/AGENTS.md` |
| **OpenCode** | agregá `"instructions": ["<AISTACK_HOME>/AGENTS.md"]` en `~/.config/opencode/opencode.json` |

### 4. Opcional: hooks

**Claude Code** — en `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{ "matcher": "startup|resume|clear|compact|fork",
      "hooks": [{ "type": "command", "command": "node <AISTACK_HOME>/scripts/hooks/memory-session-start.js", "timeout": 15 }] }],
    "Stop": [{ "hooks": [{ "type": "command",
      "command": "node <AISTACK_HOME>/scripts/hooks/anti-sycophancy.js", "timeout": 10 }] }]
  }
}
```

**OpenCode** — copiá el plugin a todas las cuentas:

```bash
sudo "$AISTACK_HOME/scripts/sync-opencode-plugin.sh"   # respeta $AISTACK_USERS
```

**Codex, Gemini y Copilot** no tienen hooks de sesión. Arrancalos con el wrapper para que
reciban el mismo contexto:

```bash
"$AISTACK_HOME/scripts/ai-start.sh" codex "revisá el diff antes del deploy"
"$AISTACK_HOME/scripts/ai-start.sh" gemini "analizá este esquema"
```

## Uso

### Invocar un skill

```
/skill <nombre>        # Claude Code
```

Los skills se autodescubren desde `skills/<nombre>/SKILL.md`, **sólo a un nivel**. Lo que
esté anidado dentro de una carpeta-colección **no** se descubre: si querés que sea
invocable, exponelo con un symlink.

```bash
ln -s nombre-coleccion/nombre-skill "$AISTACK_HOME/skills/nombre-skill"
```

Los otros asistentes leen el mismo markdown como contexto; los `SKILL.md` son portables
por diseño.

Para ver qué hay: `skills/SKILLS_CATALOG.md` y `agents/AGENTS_CATALOG.md` (los genera
`scripts/gen-catalogs.sh` — no los edites a mano).

### Los dos protocolos

Definidos en `AGENTS.md`, se invocan por nombre en la conversación:

- **`@protocol-enforce`** — al empezar una tarea: leer las reglas del proyecto, su
  memoria, los handoffs pendientes, y hacer el tools check antes de proponer nada.
- **`@protocol-end`** — al terminar, **sólo cuando el usuario confirma que la tarea
  terminó**: escribe la bitácora, actualiza el memory bank, guarda el conocimiento
  reutilizable y registra el cierre. Ver `/skill protocol-end`.

### Deuda de documentación

```bash
node "$AISTACK_HOME/scripts/hooks/doc-debt.js" check          # qué falta documentar
node "$AISTACK_HOME/scripts/hooks/doc-debt.js" bootstrap      # línea base, sólo al instalar
node "$AISTACK_HOME/scripts/hooks/doc-debt.js" record-close <proyecto>
```

Compara la marca de último cierre de cada proyecto contra el mtime de sus archivos. Se
calcula del estado en disco y no de un evento de sesión: por eso los cinco asistentes ven
la misma deuda. La marca vive en `<proyecto>/.agent-zero/last-close.json`. Se apaga con
`AISTACK_DOCDEBT=0`.

### Anti-adulación

`scripts/hooks/anti-sycophancy.js` detecta elogios, acuerdos sin evidencia y cierres de
relleno. En Claude Code el hook `Stop` **rechaza la respuesta** y el modelo la reescribe;
en OpenCode se limpia la apertura aduladora; los otros tres sólo reciben la instrucción en
el prompt. Probalo con `--self-test`. Se apaga con `AISTACK_ANTISYC=0`.

## Herramientas opcionales

Dos scripts envuelven herramientas de terceros cuyas dependencias **no** se versionan acá
(son artefactos de instalación, cientos de MB). Instalalas una vez si las querés:

| Script | Qué hace | Instalación |
|---|---|---|
| `scripts/markitdown-local` | PDF, DOCX, XLSX, PPTX → markdown | `python3 -m venv vendor/markitdown/.venv && vendor/markitdown/.venv/bin/pip install markitdown` |
| `scripts/graphify-local` | Grafo local de código de un repo | ver el encabezado del script |

Los dos fallan con un mensaje claro indicando qué instalar, y `markitdown-local` usa un
`markitdown` del sistema si lo encuentra en el `PATH`.

## Variables de entorno

| Variable | Default | Para qué |
|---|---|---|
| `AISTACK_HOME` | se resuelve sola desde la ubicación del script | Raíz del stack |
| `WORKSPACE_ROOT` | `$HOME/workspace` | Raíz de los proyectos |
| `AISTACK_USERS` | `user1 user2 user3 user4` | Cuentas para el sync de OpenCode |
| `AISTACK_ANTISYC` | `1` | `0` desactiva el chequeo anti-adulación |
| `AISTACK_DOCDEBT` | `1` | `0` desactiva la deuda de documentación |

## Qué nunca va acá

Este árbol está pensado para copiarse, compartirse y publicarse. Queda afuera:

- **Credenciales** — se leen en runtime del credentials store del host
- **Rutas absolutas e IPs privadas** — usá las variables de arriba
- **Estado de ejecución** — va en el proyecto (`<proyecto>/.agent-zero/`)
- **Bitácoras y narrativa de sesión** — van en `<proyecto>/memorias/`
- **Logs, cachés, temporales**

Regla para decidir: si sirve *a cualquiera* como conocimiento reutilizable, va acá. Si
describe *qué pasó* en una sesión o proyecto, va afuera.

## Mantenimiento

```bash
bash "$AISTACK_HOME/scripts/gen-catalogs.sh"    # regenerar catálogos al sumar skills
```

Antes de compartir o publicar, corré el gate de seguridad:

```bash
grep -rnE "(PASS|PASSWORD|SECRET|TOKEN|API_KEY)\s*=\s*[\"'][^\"'\$<{]{6,}" . --exclude-dir=vendor
grep -rnE "192\.168\.|10\.[0-9]+\.|/home/[a-z]+/" . --exclude-dir=vendor
```

Los dos tienen que devolver vacío.

## Licencia

MIT — ver [LICENSE](LICENSE). Los skills de terceros conservan su licencia; atribución en
[NOTICE.md](NOTICE.md).
