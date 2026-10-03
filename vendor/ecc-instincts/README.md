# ecc-instincts — continuous-learning-v2

**Origen:** `affaan-m/ECC` → `skills/continuous-learning-v2/` (MIT). Vendorizado el 2026-07-27.
**Skill que lo envuelve:** `/skill instincts`

## Configuración propia de este nodo

`config.json` tiene **`observer.enabled: false`** (ya venía así de fábrica en ECC, y se
dejó explícito con una nota). Eso apaga el observador en background, que en ECC lanza
`claude --model haiku --print` cada 5 minutos contra el transcript de la sesión —
**tokens facturados sin autorización**. Acá no corre nada solo.

**Tampoco se instalaron los hooks.** `hooks/observe.sh` y `agents/*.sh` están presentes
pero **inertes**: no hay nada en `~/.claude/settings.json` que los invoque. Si algún día
se quiere activar la captura automática, es una decisión aparte que hay que autorizar.

## Qué es cada cosa

| Path | Qué hace | ¿Corre hoy? |
|---|---|---|
| `scripts/instinct-cli.py` | El CLI. **stdlib-only**, 1965 líneas. Es lo único que se usa. | Sí, a mano |
| `scripts/detect-project.sh` | Deriva el `project_id` del git remote (sin credenciales) | Sí, lo llama el CLI |
| `hooks/observe.sh` | Captura de tool-calls a JSONL | **No** (inerte) |
| `agents/observer-loop.sh` | El que gasta tokens de Haiku | **No** (apagado) |
| `agents/start-observer.sh`, `session-guardian.sh` | Arranque del daemon | **No** |

## Dónde guarda

`$CLV2_HOMUNCULUS_DIR` → si no, `$XDG_DATA_HOME/ecc-homunculus` → si no,
`~/.local/share/ecc-homunculus/`.

## Verificación al vendorizar (2026-07-27)

Probado en sandbox (`workspace/temp/instincts-sandbox`):
- `status` sobre vault vacío ✅
- Creación manual de 2 instintos globales en markdown → `status` los lee, agrupa por
  dominio y dibuja la confianza ✅
- `evolve` → responde correctamente que necesita ≥3 instintos ✅

## Límites verificados en el código

- **El decay de confianza no está implementado.** `observer.md` documenta `-0.02/semana` y
  `±0.05/-0.1` por confirmación/contradicción: no hay ninguna función que lo calcule. El
  número del frontmatter queda congelado como lo escribiste.
- `evolve` agrupa por `str.replace` sobre el trigger (sin embeddings ni LLM).
- Sí son código real: `PROMOTE_CONFIDENCE_THRESHOLD = 0.8`, `PROMOTE_MIN_PROJECTS = 2`,
  `PENDING_TTL_DAYS = 30`.
- `import` desde URL valida contra SSRF (bloquea IPs privadas vía `ipaddress`).
