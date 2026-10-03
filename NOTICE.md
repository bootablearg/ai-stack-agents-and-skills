# NOTICE — Third-party components

This repository is licensed under the MIT License (see `LICENSE`).

The `vendor/` directory bundles third-party skills that are **not** covered by
this repository's copyright. Each retains its own license and copyright, kept
intact inside its folder. All rights belong to their respective authors and are
redistributed here in accordance with their permissive licenses.

| Path | License | Author | Upstream |
|------|---------|--------|----------|
| `vendor/claude-db/` | MIT | Enrique Rocha | https://github.com/Hainrixz/claude-db |
| `vendor/cybersecurity-skills/` | Apache-2.0 | mukul975 | https://github.com/mukul975/anthropic-cybersecurity-skills |
| `vendor/awesome-design-md/` | MIT | VoltAgent | https://github.com/voltagent/awesome-design-md |
| `vendor/design-md/` | Apache-2.0 | Google Labs | https://github.com/google-labs-code/design.md |
| `vendor/design-md-cli/` | Apache-2.0 | Google Labs | npm `@google/design.md@0.4.0` |
| `vendor/ecc-harness-audit/` | MIT | ECC | — |
| `vendor/ecc-instincts/` | MIT | ECC | — |
| `vendor/ecc-memory-vault/` | MIT | ECC | — |
| `vendor/ecc-skills/` | MIT | Affaan Mustafa (ECC) | https://github.com/affaan-m/ecc (v2.2.2, modified — see its README) |
| `vendor/huashu-design/` | MIT | alchaincyf (花叔 · 花生) | https://github.com/alchaincyf/huashu-design |
| `vendor/impeccable/` | Apache-2.0 | pbakaus | https://github.com/pbakaus/impeccable |
| `vendor/taste-skill/` | MIT | Leonxlnx | https://github.com/Leonxlnx/taste-skill |
| `vendor/trailofbits-skills/` | **CC BY-SA 4.0** | Trail of Bits | https://github.com/trailofbits/claude-code-config |
| `vendor/ui-ux-pro-max-skill/` | MIT | Next Level Builder | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |

Additional skills bundled outside `vendor/`, under their own upstream licenses:

| Path | License | Author | Upstream |
|------|---------|--------|----------|
| `skills/remotion-*/` | see upstream | Remotion | https://github.com/remotion-dev/skills |
| `skills/stop-slop-{en,es}/` | MIT | Hardik Pandya | https://github.com/hardikpandya/stop-slop |
| `skills/translation-quality/` | MIT | senshinji | https://github.com/senshinji/claude-translation-skill |
| `skills/watch/` | MIT | Bradley Bonanno | https://github.com/bradautomates/claude-video (commit `03ceb42`) |
| `skills/marketingskills/` | see upstream | marketing-skills.com | https://marketing-skills.com/skills |
| context-engineering skills | MIT | Muratcan Koylan | https://github.com/muratcankoylan/agent-skills-for-context-engineering |

Notes:
- For MIT-licensed components, the original `LICENSE` file and copyright notice
  are preserved inside each vendor folder.
- `vendor/impeccable/` is licensed under Apache-2.0; its `LICENSE` is preserved.
  No functional modifications were made to bundled Apache-2.0 content.
- `vendor/design-md/` and `vendor/design-md-cli/` are licensed under Apache-2.0;
  their `LICENSE` files are preserved. No functional modifications were made.
  `vendor/design-md-cli/` holds only a pinned npm install of the upstream CLI.
- If you are an author listed above and prefer a different attribution or removal,
  please open an issue.

The `agents-lib/` directory adapts and reorganizes a broad library of agent
definitions for cross-tool use. If any specific file derives from an external
source with its own license, that license governs that file.
