# ecc-harness-audit — vendorizado, NO promovido a skill

**Origen:** `affaan-m/ECC` → `scripts/harness-audit.js` (MIT). Traído el 2026-07-27.

## Qué es
Scorecard determinista y offline (cero red, cero LLM, cero dependencias) que puntúa un
repo sobre 12 categorías: Tool Coverage, Context Efficiency, Quality Gates, Memory
Persistence, Eval Coverage, Security Guardrails, Cost Efficiency y las integraciones de
deploy (GitHub/Vercel/Netlify/Cloudflare/Fly).

```bash
node /home/.ai-stack/vendor/ecc-harness-audit/harness-audit.js --root <dir>
```

## Por qué NO se convirtió en skill

**El score mide "cuánto ECC tenés instalado", no la calidad de tu harness.** Verificado:
7 de sus checks buscan literalmente `~/.claude/plugins/ecc/` o rutas de
`everything-claude-code`, y el resto son `fs.existsSync` sobre la estructura de
directorios propia de ECC.

Resultados reales del 2026-07-27:

| Root | Score | Lectura |
|---|---|---|
| `.ai-stack` | 7/39 | La acción #1 sugerida es "instalá el plugin ECC". Inútil. |
| `proyecto-a` | 8/39 | Context Efficiency 10/10; el resto en 0 por falta de artefactos de ECC. |
| `monitoring` | 0/39 | 16/16 checks fallando. |

Promoverlo a skill hubiera metido ruido en el catálogo y un número engañoso en el
inventario, en contra del criterio de que las herramientas tienen que **sumar**.

## Para qué sí puede servir
Como **checklist de ideas**, leyendo las categorías (no el puntaje): las dimensiones que
marca en 0 para todos los proyectos —*Memory Persistence*, *Eval Coverage*, *Security
Guardrails*— son huecos reales del stack. El de memoria ya quedó cubierto con
`/skill memory`.

Se conserva acá por si en el futuro se quiere reescribir la rúbrica con checks propios
del nodo (sería un fork, no un uso directo).
