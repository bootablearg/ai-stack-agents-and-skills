# ai-stack — a shared brain for AI coding assistants

One set of rules, skills and agents that **Claude Code, Codex, Gemini CLI, GitHub
Copilot CLI and OpenCode** read from the same place, for every account on a machine.

📖 **[Setup & usage](SETUP.md)** · 🇪🇸 **[Léeme en castellano](LEEME.md)**

## Why

Most people configure each assistant separately: one `CLAUDE.md` here, an `AGENTS.md`
there, skills duplicated in three places. Change a rule and you change it four times —
or forget three.

This puts the rules, the skills and the agents in **one directory**, symlinked into every
assistant and readable by every user on the machine. Update it once; everyone gets it.

## What's inside

| | |
|---|---|
| **447 skills** | Invocable playbooks: security auditing, SEO, marketing, frontend, context engineering, documentation, translation… |
| **233 agents** | Specialist subagents in Claude subagent format, with adapters for other assistants |
| **2 protocols** | `@protocol-enforce` opens a task; `@protocol-end` closes and documents it |
| **3 hooks** | Shared memory injection · anti-sycophancy enforcement · documentation-debt tracking |

Catalogs: [`skills/SKILLS_CATALOG.md`](skills/SKILLS_CATALOG.md) ·
[`agents/AGENTS_CATALOG.md`](agents/AGENTS_CATALOG.md)

## The parts worth stealing

Even if you don't adopt the whole thing:

- **`scripts/hooks/anti-sycophancy.js`** — detects praise, agreement without evidence and
  filler sign-offs. On Claude Code it hooks into `Stop` and **rejects the reply**, forcing
  a rewrite. It distinguishes *"you're right because the log shows X"* (fine) from
  *"you're right"* alone (not fine). No dependencies, `--self-test` included.
- **`scripts/hooks/doc-debt.js`** — answers "what did I touch and never document?" by
  comparing each project's last-close mark against file mtimes. Computed from disk state
  rather than a session event, so every assistant sees the same debt — even the ones
  without hooks.
- **`skills/protocol-end/`** — a close-out protocol that edits existing files instead of
  rewriting them, and verifies what it wrote before reporting success.

## Requirements

Node.js 18+ (standard library only, no `npm install`) and Bash. That's it.

## Install

```bash
git clone https://github.com/bootablearg/ai-stack-agents-and-skills.git /opt/ai-stack
ln -s /opt/ai-stack/AGENTS.md ~/.claude/CLAUDE.md
ln -s /opt/ai-stack/skills ~/.claude/skills
ln -s /opt/ai-stack/agents ~/.claude/agents
```

Full instructions — multi-user setup, hooks, the other four assistants — in
**[SETUP.md](SETUP.md)** ([castellano](SETUP.es.md)).

## Design rules

1. **Knowledge only.** No execution state, no session logs, no credentials. If it
   describes *what happened*, it belongs in your project, not here.
2. **No absolute paths, no hardcoded users.** Scripts resolve their own location; the
   rest uses `$AISTACK_HOME`, `$WORKSPACE`, `$HOME`.
3. **Everything portable.** Skills are plain markdown; any assistant can read them as
   context even without native skill support.

## License

MIT — see [LICENSE](LICENSE). Bundled third-party skills keep their own licenses and
copyright notices; attribution in [NOTICE.md](NOTICE.md). Note that
`vendor/trailofbits-skills/` is **CC BY-SA 4.0**: if you build on that folder
specifically, share-alike applies to your derivative.
