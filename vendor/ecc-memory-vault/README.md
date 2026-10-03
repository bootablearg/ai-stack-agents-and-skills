# ecc-memory-vault — Memory Vault (`ecc.memory.v1`)

**Origen:** `affaan-m/ECC` (MIT, © 2026 Affaan Mustafa). Vendorizado el 2026-07-27.
**Skill que lo envuelve:** `/skill memory`

## Qué se trajo (y qué no)

| Archivo | Origen en ECC |
|---|---|
| `lib/memory-vault.js` | `scripts/lib/memory-vault.js` |
| `lib/memory-vault-format.js` | `scripts/lib/memory-vault-format.js` |
| `lib/path-safety.js` | `scripts/lib/path-safety.js` |
| `memory.js` (CLI) | `scripts/memory.js` |
| `schemas/memory.schema.json` | `schemas/memory.schema.json` |

**Sin modificaciones respecto del original.** Cero dependencias externas: sólo
`fs`/`path`/`os`/`crypto`/`util` de Node.

**NO se trajo** `scripts/memory-mcp.mjs` (servidor MCP stdio) porque requiere `ajv`, y
meter `node_modules` dentro de `.ai-stack` rompería su portabilidad (§10 del
`TOOLS_INVENTORY.md`). Si algún día se quiere, se instala aparte.

## Verificación al vendorizar (2026-07-27)

Probado end-to-end en sandbox (`workspace/temp/mv-sandbox`), no sólo sintaxis:

- `init` → crea los scopes y el `.gitignore` fail-closed del scope project ✅
- `save --kind runbook` → escribe markdown con frontmatter `ecc.memory.v1` válido ✅
- `handoff --from claude --target codex` → ✅
- `search --target-harness codex` → recupera y rankea ambas memorias ✅
- `doctor` → PASS (0 inválidos, 0 duplicados, 0 links rotos) ✅

## Actualizar

No hay upstream automático. Para traer una versión nueva: clonar ECC, copiar esos 5
archivos, correr el smoke test de arriba y anotar la fecha acá.
