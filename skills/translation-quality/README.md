# Claude Translation Skill — Multi-Agent Professional Translation

A [Claude Code](https://claude.com/claude-code) skill that orchestrates a complete professional translation pipeline using Agent Teams.

## What It Does

This skill coordinates multiple specialized AI agents working in parallel:

- **Translator** (Sonnet) — First-pass translation with strict structure preservation
- **Term Researcher** (Sonnet) — Web-verified terminology glossary with confidence scoring
- **Reviewer** (Opus) — Independent quality review catching fabrication, omission, and errors
- **Revision** — Applies all fixes and glossary corrections for the final output

```
User: "翻译这个文档"
         │
   Team Lead orchestrates:
   translator + term-researcher(s) [parallel]
         → reviewer [waits for both]
         → revision → typesetting → .docx + .pdf
```

## Key Features

- **Anti-fabrication pipeline**: Paragraph-by-paragraph verification, no invented content
- **Structure preservation**: Tables stay tables, lists stay lists, cell content stays in cells
- **Smart scaling**: >50 terms → auto-splits into 2 parallel researchers (fast + deep)
- **Web search fallback**: Graceful degradation when search is unavailable
- **Professional typesetting**: Outputs both .docx and .pdf with formal formatting

---

## ⚠️ Fork adaptado — `.ai-stack` (no es el upstream tal cual)

Origen: <https://github.com/senshinji/claude-translation-skill> (MIT, commit `42d6c8a`,
2026-03-12). Instalado en `$AISTACK_HOME/skills/translation-quality/` el 2026-08-11,
alcanzable por los 4 usuarios (`user1`, `user2`, `user3`, `user4`) y por Claude Code,
Codex, Gemini CLI, Copilot CLI y OpenCode.

Cambios respecto del upstream:

1. **Modo secuencial (Mode B)** documentado en `references/execution-modes.md`. El
   upstream exige Agent Teams (`TeamCreate`), que sólo existe en Claude Code. Ahora el
   skill corre en cualquier asistente, sin paralelismo pero con las mismas compuertas
   de calidad.
2. **Workspace** movido de `/tmp/translation-workspace` a
   `~/workspace/temp/translation-workspace` — convención del host y sin colisiones
   entre usuarios.
3. **`textutil` → `soffice`** para convertir .doc/.docx a HTML (`textutil` es de macOS).
4. **Fase 4** ya no invoca skills `docx`/`pdf` inexistentes: cadena real documentada en
   `references/typesetting-rules.md` (python-docx primero; LibreOffice para PDF).

Estado del host al 2026-08-11: `soffice` 7.4 ✅ (reparado ese día: el caché de
extensiones en `/var/spool/libreoffice/uno_packages/cache/` estaba corrupto y hacía
abortar toda conversión con `DeploymentException`) · `pandoc` 2.17.1 ✅ ·
`python-docx` ✅ · `reportlab` ✗.

Cadena de salida verificada end-to-end: md → HTML → `.docx`/`.pdf`, con tablas y UTF-8
(acentos + chino) intactos. Ojo con el filtro explícito de `docx` — ver
`references/typesetting-rules.md`.

**Instalación upstream** (referencia): clonar y `ln -s <repo> ~/.claude/skills/translation-quality`,
más `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` en `~/.claude/settings.json` bajo `"env"`
para habilitar el modo paralelo.

---

## Usage

Just ask Claude Code to translate a document:

```
翻译这个文档
专业翻译 meeting-guide.doc
translate with quality check
```

The skill auto-triggers on translation tasks involving professional documents.

## Project Structure

```
SKILL.md                              # Main skill definition (≤500 lines)
references/
├── glossary-schema.md                # Terminology glossary JSON schema
├── review-feedback-schema.md         # Review feedback format
├── scaling-guidelines.md             # Chunking + parallel scaling rules
├── typesetting-rules.md              # Professional document formatting
├── anti-fabrication-checklist.md      # Fabrication prevention methodology
├── test-translation-structure.sh     # Structure verification test
└── test-skill-integrity.sh           # Skill integrity test (32 checks)
```

## Testing

```bash
# Run skill integrity tests (no external dependencies)
bash references/test-skill-integrity.sh

# Run structure tests (requires source + translation files)
bash references/test-translation-structure.sh source.html translation.md
```

## Scaling

| Document Size | Translators | Term Researchers | Reviewers |
|--------------|-------------|-----------------|-----------|
| ≤5 pages     | 1           | 1               | 1         |
| 6-10 pages   | 1           | 1-2 (if >50 terms) | 1      |
| 11-20 pages  | 2 (parallel)| 2 (fast+deep)   | 1         |
| 21-50 pages  | 3-5         | 2 (fast+deep)   | 1         |

## License

MIT
