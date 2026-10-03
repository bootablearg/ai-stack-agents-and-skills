---
name: second-opinion
description: Consultar a Codex, Gemini o Copilot como par para una segunda opinión, revisión o enfoque alternativo. Usar en decisiones de arquitectura no triviales, revisión de cambios riesgosos, o cuando el usuario pide que "opine otro modelo".
---

# Second Opinion — consultar a otro modelo

Este nodo tiene 3 asistentes pares instalados además de Claude. Todos comparten el mismo
cerebro (`$AISTACK_HOME/`) y las mismas reglas (`AGENTS.md`).

## Cuándo usarlo
- Decisión de arquitectura/diseño con trade-offs no obvios.
- Antes de un cambio riesgoso (migración, borrado, algo en prod): pedir que lo refute.
- El usuario pide explícitamente otra opinión.
- Querés contrastar un diagnóstico antes de proponerlo.

## Cómo invocar (no-interactivo, preferí solo-lectura)

```bash
# Codex (OpenAI, gpt-5.x) — fuerte en ejecución y análisis técnico
# Desde Claude Code usá el plugin, no el CLI: corre en segundo plano y no bloquea la sesión.
#   /codex:review --base <rama>      → revisión del diff
#   /codex:adversarial-review <foco> → busca activamente cómo romperlo
#   /codex:rescue --background       → delegarle el diagnóstico entero
#
# Desde los otros asistentes, o desde Claude cuando necesitás a Codex fuera de la sesión:
# (--skip-git-repo-check: necesario fuera de un repo git)
codex exec -s read-only --skip-git-repo-check "Revisá este diagnóstico y decime si se te escapa algo: <...>"

# Gemini (Google) — contexto largo, buena segunda mirada
gemini -p "<consulta>"        # headless: no escribe sin -y/--yolo

# Copilot (GitHub) — segunda opinión orientada a código
copilot -p "<consulta>"
```

## Buenas prácticas
1. **Dales contexto suficiente** en el prompt (no asumas que ven tu conversación con el usuario).
2. Pediles que **refuten o señalen riesgos**, no que confirmen (evita el sesgo de acuerdo).
3. Para tareas mecánicas multi-archivo o batch, **delegá la ejecución a Codex y correlo
   fuera de Claude Code** — `$AISTACK_HOME/scripts/ai-start.sh codex --rw "<procedimiento>"`.
   Dentro de una sesión de Claude, incluso vía plugin, el límite semanal se sigue gastando.
   Antes de delegar, revisá si no lo resuelve una herramienta determinista (`pdf2md-local`,
   `markitdown-local`, ImageMagick): eso cuesta cero. Ver el presupuesto de tokens en
   `AGENTS.md` § Delegación, y el handoff completo en `$AISTACK_HOME/codex/`.
4. Resumí al usuario lo que dijo cada modelo y **tu** conclusión; no copies y pegues crudo.
5. Respetá la Regla #1: una segunda opinión informa el plan, pero **no autoriza** a ejecutar.
