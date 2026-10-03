# Skills — cerebro compartido

Skills reutilizables para los cuatro asistentes (Claude · Codex · Gemini · Copilot).
Una sola copia global; Claude las ve vía `~/.claude/skills` (symlink a esta carpeta).
Invocación en Claude: `/skill <nombre>` o `Activate <Nombre> mode`.

## Fuente de verdad (no dupliques catálogos acá)

- **[SKILLS_CATALOG.md](./SKILLS_CATALOG.md)** — tabla skill-por-skill: nombre · invocación · función. Catálogo completo.
- **[../TOOLS_INVENTORY.md](../TOOLS_INVENTORY.md)** — inventario maestro: skills agrupadas por familia, colecciones, hooks automáticos y agentes. Es el que manda el tools-check del `CLAUDE.md`/`AGENTS.md`.

## Panorama rápido

- **53 skills top-level** + **3 colecciones** (93 skills) + `cyber-neo`.
- Colecciones (subcarpetas propias con su índice):
  - `claude-seo/` (25) — auditoría SEO, schema, clustering, geo/local. Maestra: `/skill seo`.
  - `claude-blog/` (28) — redacción, estrategia editorial, multilingüe. Maestra: `/skill blog`.
  - `marketingskills/` (40) — copywriting, CRO, ads, analytics, pricing, churn.
  - `cyber-neo/` — pre-push security scan (OWASP, CWE, secrets).
- **Skills en git hooks** (corren solas): pre-commit → `zoom-out`/`diagnose` · pre-push → `git-guardrails-claude-code`/`triage`/`grill-me` · commit-msg → `to-prd`. Detalle en `TOOLS_INVENTORY.md`.

## `_deprecated/`

Catálogos viejos (snapshots "21 skills") conservados por referencia histórica. No usar como catálogo vigente — ver `_deprecated/README.md`.
