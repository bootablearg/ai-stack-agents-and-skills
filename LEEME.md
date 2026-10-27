# ai-stack — un cerebro compartido para asistentes de IA

Un solo juego de reglas, skills y agentes que **Claude Code, Codex, Gemini CLI, GitHub
Copilot CLI y OpenCode** leen del mismo lugar, para todas las cuentas de la máquina.

📖 **[Instalación y uso](SETUP.es.md)** · 🇬🇧 **[English version](README.md)**

## Por qué

Lo normal es configurar cada asistente por separado: un `CLAUDE.md` acá, un `AGENTS.md`
allá, los skills duplicados en tres lugares. Cambiás una regla y la tenés que cambiar
cuatro veces — o te olvidás de tres.

Esto pone las reglas, los skills y los agentes en **un solo directorio**, symlinkeado a
cada asistente y legible por todos los usuarios de la máquina. Lo actualizás una vez y
le llega a todos.

## Qué hay adentro

| | |
|---|---|
| **447 skills** | Playbooks invocables: auditoría de seguridad, SEO, marketing, frontend, context engineering, documentación, traducción… |
| **233 agentes** | Subagentes especialistas en formato Claude subagent, con adaptadores para otros asistentes |
| **2 protocolos** | `@protocol-enforce` abre una tarea; `@protocol-end` la cierra y la documenta |
| **3 hooks** | Inyección de memoria compartida · enforcement anti-adulación · deuda de documentación |

Catálogos: [`skills/SKILLS_CATALOG.md`](skills/SKILLS_CATALOG.md) ·
[`agents/AGENTS_CATALOG.md`](agents/AGENTS_CATALOG.md)

## Las partes que vale la pena robarse

Aunque no adoptes todo el stack:

- **`scripts/hooks/anti-sycophancy.js`** — detecta elogios, acuerdos sin evidencia y
  cierres de relleno. En Claude Code se engancha al hook `Stop` y **rechaza la
  respuesta**, obligando a reescribirla. Distingue *"tenés razón porque el log muestra
  X"* (válido) de *"tenés razón"* a secas (no). Sin dependencias, con `--self-test`.
- **`scripts/hooks/doc-debt.js`** — responde "¿qué toqué y nunca documenté?" comparando
  la marca de último cierre de cada proyecto contra el mtime de sus archivos. Se calcula
  del estado en disco y no de un evento de sesión, así que **todos** los asistentes ven
  la misma deuda, incluso los que no tienen hooks.
- **`skills/protocol-end/`** — un protocolo de cierre que **edita** los archivos en vez
  de reescribirlos, y verifica lo que escribió antes de reportar que terminó.

## Requisitos

Node.js 18+ (sólo librería estándar, sin `npm install`) y Bash. Nada más.

## Instalación

```bash
git clone https://github.com/bootablearg/ai-stack-agents-and-skills.git /opt/ai-stack
ln -s /opt/ai-stack/AGENTS.md ~/.claude/CLAUDE.md
ln -s /opt/ai-stack/skills ~/.claude/skills
ln -s /opt/ai-stack/agents ~/.claude/agents
```

Instrucciones completas — multiusuario, hooks, los otros cuatro asistentes — en
**[SETUP.es.md](SETUP.es.md)**.

## Reglas de diseño

1. **Sólo conocimiento.** Nada de estado de ejecución, bitácoras ni credenciales. Si
   describe *qué pasó*, va en tu proyecto, no acá.
2. **Sin rutas absolutas ni usuarios hardcodeados.** Los scripts resuelven su propia
   ubicación; el resto usa `$AISTACK_HOME`, `$WORKSPACE`, `$HOME`.
3. **Todo portable.** Los skills son markdown plano: cualquier asistente los lee como
   contexto aunque no tenga soporte nativo de skills.

## Licencia

MIT — ver [LICENSE](LICENSE). Los skills de terceros conservan su licencia y sus avisos
de copyright; atribución en [NOTICE.md](NOTICE.md). Ojo con
`vendor/trailofbits-skills/`, que es **CC BY-SA 4.0**: si construís sobre esa carpeta en
particular, el share-alike te alcanza.
