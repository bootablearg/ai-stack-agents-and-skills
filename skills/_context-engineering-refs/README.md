# Familia context engineering — 17 skills

Incorporada al cerebro compartido el **2026-08-11**.
Origen: <https://github.com/muratcankoylan/agent-skills-for-context-engineering> — MIT,
commit `6dbe1a1` (repo activo, 17.7k stars al momento de copiar).

## Qué se copió y qué no

**Sí:** los 17 `skills/*/` completos (SKILL.md + references + 13 scripts Python de
stdlib pura, sin red ni API keys) y `researcher/claims/` para trazabilidad de cifras.

**No:** `examples/` (8,4 MB de screenshots y datasets de fine-tuning), `researcher/`
completo (3 MB de benchmarking), `docs/`, el `CLAUDE.md`/`AGENTS.md` del upstream (que
pisarían las reglas de este host) y `.claude-plugin/` (los plugins de Claude no son
portables a Codex/Gemini/Copilot; como skills sí lo son).

## Los 17

**Fundacionales** — `context-fundamentals` · `context-degradation` · `context-compression`

**Arquitectura** — `multi-agent-patterns` · `long-horizon-prompting` · `memory-systems` ·
`tool-design` · `filesystem-context` · `hosted-agents`

**Operación** — `context-optimization` · `latent-briefing` · `evaluation` ·
`advanced-evaluation` · `harness-engineering` · `self-improvement-loops`

**Metodología** — `project-development` · `bdi-mental-states`

## Por qué están top-level y sin prefijo

Los 17 **se referencian entre sí por nombre**, densamente (`evaluation` lo citan 14 de
ellos, `multi-agent-patterns` otros 14, `context-optimization` 13). Renombrarlos con un
prefijo de familia habría roto alrededor de cien punteros cruzados.

Y van top-level porque Claude Code sólo descubre `skills/<nombre>/SKILL.md` a un nivel:
metidos en una subcarpeta-colección dejarían de ser invocables con `/skill`.

## Consumo desde los otros asistentes

Claude Code: `/skill <nombre>`. Codex, Gemini CLI, Copilot CLI y OpenCode los leen como
markdown desde este mismo path (cerebro compartido) — los scripts `.py` que acompañan a
diez de ellos son ejemplos de referencia, no dependencias de ejecución.

## Desambiguación

- `memory-systems` (teoría de memoria para agentes) ≠ `/skill memory` (el Memory Vault
  operativo de este host).
- `evaluation` / `advanced-evaluation` evalúan **agentes y contexto**, no código —
  para código está `/skill code-review-and-quality`.
- `project-development` es metodología de **sistemas de agentes**; para planificar
  trabajo en este host manda el AGENTS.md más `/skill planning-and-task-breakdown`.
- El `context-engineering` que ya existía en el stack **se mantiene**: cubre otra cosa
  (armado de rules files y packing de contexto de un proyecto concreto).

## Caveat

Los umbrales de degradación y los benchmarks por modelo **envejecen con cada release**.
El upstream lo advierte y conviene repetirlo: son orden de magnitud, no verdad fija.
Medí con tu propia carga antes de tomar una decisión de arquitectura.

`claims/index.jsonl` resuelve los IDs `claim-*` citados en los skills.
