# Execution Modes — Parallel (Agent Teams) vs Sequential

The translation pipeline, the contracts (glossary, review feedback, workspace paths)
and the anti-fabrication gates are **identical** in both modes. Only concurrency
changes. Never downgrade the quality gates because you are in sequential mode.

## Mode A — Parallel (Agent Teams)

Available only in Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
Follow SKILL.md as written: `TeamCreate`, spawn teammates, tasks with dependencies.

Roles and models: translator (Sonnet), term-researcher / -fast / -deep (Sonnet),
reviewer (Opus). If the host cannot pin models per agent, run every role on the best
model available and say so — the reviewer is the role that most benefits from the
stronger model.

## Mode B — Sequential (default fallback)

Use whenever `TeamCreate` is not available: Codex, Gemini CLI, Copilot CLI, OpenCode,
or Claude Code without the flag. Do NOT abort, and do NOT ask the user to install or
enable anything. Run the whole pipeline in one session:

1. Play each role yourself, one at a time, in dependency order:
   translator → term-researcher (both halves if split mode) → reviewer → revision →
   typesetting.
2. Each "Spawn Prompt" in SKILL.md becomes your own instruction set for that step.
   Read it and follow it literally before moving on.
3. **Re-read every artifact from disk between roles.** Do not rely on what you just
   wrote from memory. The workspace files ARE the handoff — this is what preserves
   reviewer independence, and the anti-fabrication value of the skill depends on it.
4. As reviewer, work adversarially: the job is to find fabrication, omission and
   terminology drift in the first pass, not to defend it. Run both passes
   (translation→source and source→translation) as specified.
5. Parallelism-only optimizations (chunking >10 pages, splitting term research at
   >50 terms) still apply as *sequential* steps — they change the work order, not
   whether the work happens.

**Partial parallelism.** If the assistant has a generic subagent/Task tool but no
Agent Teams, run at least the **reviewer** as an independent subagent with no access
to your reasoning — only to the workspace files. That recovers most of the
independence benefit at low cost. Claude Code without Agent Teams is exactly this case.

**Cost/latency note.** Sequential mode is slower and uses more context in a single
session. For documents over ~10 pages, chunk aggressively and checkpoint each chunk
to disk so a context compaction cannot lose work in progress.

## Host tooling (this stack)

Available and verified end-to-end (2026-08-11): `libreoffice`/`soffice` 7.4,
`pandoc` 2.17.1, `python-docx`.
NOT installed: `textutil` (macOS-only), `reportlab`.

Gotcha: `soffice --convert-to docx` **from an HTML source needs the explicit filter**
`'docx:MS Word 2007 XML'`, otherwise it writes no file and reports nothing. See
`typesetting-rules.md`.
Workspace lives in `~/workspace/temp/translation-workspace` (per-user, never `/tmp`).
If two translations run at once, suffix the directory (`...-<slug>`) to avoid collisions.
