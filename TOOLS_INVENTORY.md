---
name: Tools Inventory — Cerebro Compartido (.ai-stack)
description: Índice maestro y portable de TODA la capacidad instalada en este nodo (skills, agentes, vendors, scripts, hooks, gstack, codex). Fuente única para que cualquier asistente (Claude Code · OpenCode · Codex · Gemini · Copilot) en cualquier proyecto sepa qué herramienta existe, qué hace, dónde está y cómo invocarla.
type: reference
canonical_path: $AISTACK_HOME/TOOLS_INVENTORY.md
updated: 2026-09-28
---

# 🧠 Tools Inventory — Cerebro Compartido

> **Catálogo portable del brain.** Vive en `$AISTACK_HOME/` y lo lee CUALQUIER agente de
> CUALQUIER proyecto. Es el primer archivo del Tools Check (Paso 0.5 de `AGENTS.md`).

**Cómo está organizado:** este MAESTRO es curado y navegable. Los listados exhaustivos (cada
skill y cada agente con su descripción real) viven en catálogos **auto-generados** — ver [§8](#8-catálogos-exhaustivos-auto-generados).
El `tools-inventory.md` de cada proyecto lista sólo los scripts propios del proyecto y los
skills globales más relevantes para él; **no** repite este inventario.

---

## 1. Modelo mental — un solo cerebro, cinco bocas

TODO el conocimiento reutilizable vive en **un único lugar**: `$AISTACK_HOME/`. **El listado
de skills es el mismo para los cinco asistentes y todos los usuarios del grupo `aistack`**: todos apuntan al mismo directorio.

| Asistente | Cómo llega al cerebro | Invoca una skill con |
|-----------|----------------------|----------------------|
| **Claude Code** | `~/.claude/skills` → `.ai-stack/skills` · `~/.claude/agents` → `.ai-stack/agents` · `~/.claude/CLAUDE.md` → `.ai-stack/AGENTS.md` | `/skill <nombre>` o `"Activate <Agente> mode"` |
| **OpenCode** | `~/.config/opencode/skill` → `.ai-stack/skills` · `instructions` en `opencode.json` → `.ai-stack/AGENTS.md` | por nombre (lo descubre solo) |
| **Codex CLI** | `~/.codex/AGENTS.md` → `.ai-stack/AGENTS.md`; lee `.ai-stack/skills/` directo | "usá la skill `<nombre>` de .ai-stack" |
| **Gemini CLI** | `~/.gemini/GEMINI.md` → `.ai-stack/AGENTS.md` | idem (lee el markdown del skill) |
| **GitHub Copilot CLI** | `$WORKSPACE/AGENTS.md` → `.ai-stack/AGENTS.md` | idem |

> ⚠️ **Regla de oro:** todo lo nuevo (skill, agente, regla) se instala **en `.ai-stack/`**, no
> dentro de un proyecto. Los skills de terceros van a `vendor/<origen>/` con un symlink por
> skill en `skills/`. **Nunca** correr el instalador de un framework de terceros: los de ECC y
> similares copian cientos de archivos planos sobre `~/.claude/skills`, que acá es el cerebro.

**No portable:** los *plugins* de Claude Code (`~/.claude/plugins/`) son nativos de Claude.
Instalados hoy (9): `superpowers`, `codex` (openai-codex), `context7`, `code-review`,
`code-simplifier`, `frontend-design`, `security-guidance`, `claude-code-setup`, `mercadopago`.
Los *skills sincronizados desde claude.ai* (`skills/synced/`, 10: docx, pdf, pptx, xlsx,
skill-creator, etc.) sí son markdown legible por todos, pero los maneja la sincronización.

---

## 2. Mapa del cerebro (`$AISTACK_HOME/`)

```
.ai-stack/
├── AGENTS.md            ← reglas únicas para los 5 asistentes
├── TOOLS_INVENTORY.md   ← ESTE archivo
├── skills/              ← 444 skills top-level + colecciones (605 entradas en el catálogo)
│   ├── SKILLS_CATALOG.md   (auto)
│   ├── marketingskills/ (49) · claude-seo/ (25) · claude-blog/ (28) · claude-db/ (36)
│   ├── taste/ (13) · ui-ux-pro-max/ · cyber-neo/
│   ├── synced/ (10)        sincronizados desde claude.ai — no editar
│   └── _deprecated/ · _context-engineering-refs/
├── agents/ (233)        ← subagentes → ~/.claude/agents · AGENTS_CATALOG.md (auto)
├── agents-lib/ (27 cat) ← librería fuente categorizada (MANIFEST.md)
├── gstack/ (42 tools)   ← pipelines de orquestación · GSTACK_CATALOG.md (auto)
├── codex/               ← manuales de handoff Claude↔Codex (AGENTS.md, CODEX.md, HANDOFF_PROTOCOL.md)
├── vendor/              ← terceros; cada uno con su README de origen, versión y cambios
│   ├── cybersecurity-skills/ → 233 skills (Apache-2.0, 2026-09-22)
│   ├── ecc-skills/          → 37 skills + 4 agentes de ECC (MIT, 2026-09-28)
│   ├── trailofbits-skills/  → 13 skills + 7 agentes (CC BY-SA 4.0 — share-alike)
│   ├── ecc-memory-vault/ → /skill memory · ecc-instincts/ → /skill instincts
│   ├── ecc-harness-audit/   → evaluado, NO promovido
│   ├── claude-db/ · impeccable/ · taste-skill/ · ui-ux-pro-max-skill/ · huashu-design/
│   ├── design-md/ · design-md-cli/ · awesome-design-md/
│   └── markitdown/ · pymupdf4llm/ · graphify/   (venvs aislados)
└── scripts/
    ├── gen-catalogs.sh        ← regenera los 3 catálogos (correr al agregar/quitar)
    ├── gen-proyectos.py       ← índice de proyectos PROYECTOS.md (workspace + brain)
    ├── gen-opencode-skills.py ← vista plana skills-opencode/ (la llama gen-catalogs.sh)
    ├── ai-start.sh            ← arranca codex/gemini/copilot con memoria y reglas cargadas
    ├── agents-up.sh
    ├── markitdown-local · pdf2md-local · graphify-local · designmd-local
    ├── graphify-safe-sync.js
    ├── sync-opencode-plugin.sh + plugins/protocol-enforce.js (plugin único de OpenCode)
    ├── setup-users.sh         ← cablea las cuentas del grupo aistack al cerebro compartido
    └── hooks/
        ├── memory-session-start.js  ← SessionStart de Claude: inyecta la memoria
        ├── anti-sycophancy.js       ← Stop/SubagentStop: rechaza adulación y slop
        ├── doc-debt.js              ← deuda de documentación (check / record-close)
        └── session-scope.js         ← alcance de la sesión para @protocol-end
```

---

## 3. Skills — familias (catálogo completo: `skills/SKILLS_CATALOG.md`)

### 🧭 Protocolo, proceso y diagnóstico
`protocol-end` (cierre de tarea) · `route-specialist` (qué agentes y en qué orden) · `diagnose` ·
`zoom-out` · `debugging-and-error-recovery` · `doubt-driven-development` · `triage` · `handoff` ·
`second-opinion` (consultar a Codex/Gemini/Copilot)

### 📐 Planificación, specs e ideación
`spec-driven-development` · `planning-and-task-breakdown` · `to-prd` · `to-issues` · `idea-refine` ·
`interview-me` · `grill-me` · `grill-with-docs` · `prototype` · `llm-council` · `santa-method`
(dos revisores independientes deben aprobar)

### 💻 Desarrollo general, calidad y testing
**Estándar obligatorio:** `engineering-standards` (Clean Code · SOLID · patrones · Clean Architecture, niveles N1/N2/N3) + agente `standards-reviewer`. Se carga antes de escribir código; ver `AGENTS.md` § Estándar de código.
Desde el 2026-10-13 suma la **puerta de calidad** y cuatro referencias: `toolchain.md` (formateador,
analizador/tipos y modernizador por stack), `plan-de-calidad.md` (normalización integral en 8 etapas),
`app-nueva.md` (esqueleto obligatorio) y `roles-agentes.md` (Codex implementa, DSH revisa, Claude audita).
Su `BRIEF.md` se inyecta al arrancar los cinco asistentes, y 50 agentes que generan código traen el
bloque `<!-- engineering-standards:obligatorio -->`.

`test-driven-development` · `tdd` · `tdd-workflow` · `incremental-implementation` ·
`source-driven-development` · `code-review-and-quality` · `code-simplification` ·
`improve-codebase-architecture` · `api-and-interface-design` · `api-design` · `backend-patterns` ·
`performance-optimization` · `web-perf` · `verification-loop` · `click-path-audit` ·
`python-testing` · `e2e-testing` · `playwright-best-practices` · `webapp-testing` ·
`browser-testing-with-devtools` · `browser-qa` · `migrate-to-shoehorn`

### 🐘 Frameworks y lenguajes del workspace
- **Laravel:** `laravel-patterns` · `laravel-security` · `laravel-tdd` · `laravel-verification` · agente `php-reviewer`
- **Django + Celery:** `django-patterns` · `django-security` · `django-tdd` · `django-verification` · `django-celery` · agente `django-reviewer`
- **Go:** `golang-concurrency` · `golang-database` · `golang-observability` · `golang-safety` · `golang-security` · `golang-testing`
- **Vercel / React:** `vercel-optimize` · `vercel-cli-with-tokens` · `vercel-composition-patterns` · `vercel-react-best-practices` · `vercel-react-native-skills` · `vercel-react-view-transitions`

### 🗄️ Bases de datos
`mysql-patterns` (MariaDB) · `postgres-patterns` · `database-migrations` · `redis-patterns` ·
colección **`claude-db/`** (36: audita diseño/integridad y performance, migra seguro —
`/claude-db:start|audit|design|migrate|fix|explain|score|seed|checklist|next`)

### 🏥 Datos de salud y extracción de documentos
`healthcare-phi-compliance` (clasificación PHI/PII, RLS, auditoría) · agente `healthcare-reviewer` ·
`regex-vs-llm-structured-text` (regex primero, LLM sólo en casos dudosos) ·
**conversión determinista**: `markitdown-local`, `pdf2md-local` (ver §6)

### 🌐 Redes, homelab e infraestructura
`homelab-vlan-segmentation` (pfSense/OPNsense) · `homelab-network-setup` · `homelab-wireguard-vpn` ·
`homelab-pihole-dns` · `network-config-validation` · `network-interface-health` ·
`netmiko-ssh-automation` · `cisco-ios-patterns` · agente `network-config-reviewer` ·
`docker-patterns` · `deployment-patterns` · `ci-cd-and-automation` · `dashboard-builder` (Grafana) ·
`production-audit` · `canary-watch` · `cloudflare-one`

### 🚀 Entrega, git y documentación
`shipping-and-launch` · `deploy-to-vercel` · `git-workflow-and-versioning` ·
`git-guardrails-claude-code` · `setup-pre-commit` · `deprecation-and-migration` ·
`documentation-and-adrs`

### 🔒 Ciberseguridad
- **`cybersecurity-skills` (233, vendor mukul975, Apache-2.0):** pentest web/API/AD/red/wireless,
  respuesta a incidentes, forense, phishing, gestión de vulnerabilidades, criptografía, DevSecOps.
  Buscar por tema en el catálogo (`grep -i <tema> skills/SKILLS_CATALOG.md`).
- **Trail of Bits (13, CC BY-SA 4.0):** `semgrep` · `codeql` · `sarif-parsing` · `insecure-defaults` ·
  `differential-review` · `variant-analysis` · `fp-check` · `semgrep-rule-creator` ·
  `supply-chain-risk-auditor` · `audit-context-building` · `sharp-edges` · `open-sourcing` ·
  `property-based-testing` · agentes `semgrep-scanner`, `adversarial-modeler`, `function-analyzer`,
  `sharp-edges-analyzer`, `poc-builder`, `data-flow-analyzer`, `exploitability-verifier`
- `security-and-hardening` · `cyber-neo/` (escaneo previo al push: OWASP, CWE, secretos)
- **`security-scan-verified`** (propio, MIT): orquesta todo lo anterior como un escaneo por niveles
  (`rapido`/`estandar`/`profundo`) con tres trabajos —escanear cambios, escanear el repo, sugerir
  parches—; cada hallazgo pasa por `fp-check` y el conteo lo calcula `scripts/findings.py`. En
  Claude Code conviene el plugin oficial `claude-security`; este es para los otros asistentes y para
  delegar el escaneo a Codex.

### 🎨 Diseño y frontend
`frontend-design` · `frontend-ui-engineering` · `design-motion-principles` · `web-design-guidelines` ·
**`visual-proof`** (screenshot real obligatorio) · **`anti-ai-design`** · **`impeccable`** ·
**`design-md`** (contraste y tokens sin uso, sin LLM) · **`huashu-design`** ·
`taste/` (13) · `ui-ux-pro-max/` (`ui-ux-pro-max`, `design`, `ui-styling`, `banner-design`, `slides`, …)

### 📈 Marketing, SEO y contenido
`marketingskills/` (49: copy, CRO, ads, analytics, pricing, prospección, PR, churn, launch) ·
`claude-seo/` (25, maestra `/skill seo`) · `seo-audit` · `claude-blog/` (28, maestra `/skill blog`) ·
`translation-quality` · `stop-slop-es` · `stop-slop-en` · `writing-guidelines` ·
`remotion-*` (12, video programático; entrada `remotion-best-practices`)
· **`watch`** (mirar un video: URL o archivo → transcripción con tiempos y frames; motor local
  y sólo transcripción por defecto vía `WATCH_ENGINE`/`WATCH_DETAIL` en `/etc/profile.d/aistack.sh`;
  sin subtítulos transcribe con el WhisperX que indique `WATCH_WHISPERX_BIN`)

### 🧠 Memoria, contexto y agentes
**`memory`** (Memory Vault compartido, handoff entre asistentes) · **`instincts`** (reglas
aprendidas con confianza; observador apagado) · familia *context engineering*:
`context-engineering`, `context-fundamentals`, `context-optimization`, `context-compression`,
`context-degradation`, `filesystem-context`, `memory-systems`, `multi-agent-patterns`,
`tool-design`, `hosted-agents`, `harness-engineering`, `long-horizon-prompting`, `latent-briefing`,
`evaluation`, `advanced-evaluation`, `bdi-mental-states`, `self-improvement-loops`,
`project-development`

### 🧩 Meta (skills sobre skills)
`using-agent-skills` · `write-a-skill` · `scaffold-exercises` · `setup-matt-pocock-skills` · `graphify`

---

## 4. Hooks y carga automática

| Hook | Asistente | Qué hace |
|---|---|---|
| `memory-session-start.js` | Claude Code (`SessionStart`) | Inyecta deuda de documentación + resumen del estándar de código (`engineering-standards/BRIEF.md`, `AISTACK_STANDARDS=0` lo apaga) + handoffs + memoria del proyecto y global. Siempre `exit 0` |
| `anti-sycophancy.js` | Claude Code (`Stop`, `SubagentStop`) | Rechaza la respuesta con adulación o slop. `AISTACK_ANTISYC=0` / `AISTACK_STOPSLOP=0` |
| `plugins/protocol-enforce.js` | OpenCode (4 usuarios) | Mismo bloque de contexto + limpieza de adulación. Se propaga con `sudo scripts/sync-opencode-plugin.sh` |
| `ai-start.sh` | Codex · Gemini · Copilot | Antepone memoria y reglas al prompt (no tienen hooks propios) |
| `scripts/setup-users.sh` | Las 4 cuentas | Cablea cada cuenta del grupo `aistack` al cerebro compartido: symlinks de Claude Code, Codex, Gemini, OpenCode, Hermes, `.dsh/AGENTS.md` (sólo si la cuenta ya usa DSH) y `$WORKSPACE/AGENTS.md`. Idempotente, `--dry-run`, exige root y crea con `sudo -u` para no dejar `root:root`. Correr tras sumar una cuenta |

**No hay git hooks que corran skills.** (El inventario anterior decía que sí; se verificó el
2026-09-28: no existe `core.hooksPath` ni hooks en los repos.)

---

## 5. Agentes — 233 (catálogo: `agents/AGENTS_CATALOG.md`)

Invocación: `"Activate <Agente> mode"` · `"<Agente>, <tarea>"` · o como subagente vía la tool Agent.

| División | Más usados |
|----------|-----------|
| engineering | senior-developer, backend-architect, **security-engineer**, database-optimizer, devops-automator |
| testing | **evidence-collector**, **reality-checker**, api-tester |
| *privados de proyecto* | agentes hechos a medida para un proyecto; viven en `agents/` pero **no se publican** |
| **claude-db** (6) | schema-integrity / performance-scale / migration-safety / nosql-paradigm / specialized-platform auditors + db-migration-writer |
| **tob** (7) | auditores de Trail of Bits (§3 Ciberseguridad) |
| **ecc** (4) | network-config-reviewer, php-reviewer, django-reviewer, healthcare-reviewer |
| **estándar** (1) | standards-reviewer — revisa un diff N2/N3 contra `engineering-standards`, sólo lectura |
| marketing · seo · sales · paid-media | growth-hacker, content-creator, seo-technical, ppc-strategist, deal-strategist |
| design · product · project-mgmt | ui-designer, ux-architect, product-manager, senior-project-manager |
| specialized · finance · legal · healthcare | compliance-auditor, mcp-builder, financial-analyst, legal-*, healthcare-* |
| academic · game/engine · XR | historian, unreal-*, unity-*, godot-*, xr-* |

---

## 6. Scripts deterministas (cero tokens)

| Necesito… | Comando |
|---|---|
| PDF/DOCX/XLSX/PPTX/HTML → Markdown | `$AISTACK_HOME/scripts/markitdown-local "<archivo>" > salida.md` |
| PDF con columnas/tablas → Markdown fiel | `$AISTACK_HOME/scripts/pdf2md-local "<archivo.pdf>" > salida.md` |
| ¿El PDF tiene capa de texto? | `pdftotext <archivo> -` (vacío = escaneo) |
| Grafo de código local | `$AISTACK_HOME/scripts/graphify-local "<proyecto>"` |
| Contraste y tokens de un tema | `$AISTACK_HOME/scripts/designmd-local lint <archivo.DESIGN.md>` |
| Memoria compartida | `node $AISTACK_HOME/vendor/ecc-memory-vault/memory.js search|save|handoff` |
| Deuda de documentación | `node $AISTACK_HOME/scripts/hooks/doc-debt.js check|status|record-close <proyecto>` |
| Alcance de la sesión | `node $AISTACK_HOME/scripts/hooks/session-scope.js --since "<inicio>"` |
| Regenerar catálogos | `bash $AISTACK_HOME/scripts/gen-catalogs.sh` |
| Índice de proyectos (qué es, estado, límites) | `python3 $AISTACK_HOME/scripts/gen-proyectos.py` · `--check` sólo verifica |

**Imágenes** (paquetes de sistema del host): ImageMagick 6.9.11 (`convert`, `identify`,
`montage`) y Pillow 9.4.0. Si un proyecto necesita otra versión de Pillow, va en un venv propio.

---

## 7. GStack y Codex

**GStack** (42 tools, `gstack/GSTACK_CATALOG.md`): `ship` · `qa` / `qa-only` · `autoplan` ·
`review` / `codex` · `browse` / `benchmark` · `design-shotgun` / `design-review` /
`design-consultation` · `context-save` / `context-restore` · `careful`.

**Codex:** `/usr/bin/codex`, config `~/.codex/config.toml`, handoff en `.ai-stack/codex/`. Codex
produce y ejecuta; Claude audita (ciclo de 4 pasos en `AGENTS.md`).

**DSH (DeepSeek Harness):** `/usr/local/bin/dsh`, alternativa paralela a Codex desde el
2026-10-10. `dsh headless "<pedido>"` resuelve una tarea y termina; sin sandbox de sólo
lectura, así que la consigna va en el pedido y se corre sobre una copia con git. Detalle y
gotchas en `AGENTS.md` § DSH.

---

## 8. Catálogos exhaustivos (auto-generados)

| Catálogo | Qué tiene |
|----------|-----------|
| `skills/SKILLS_CATALOG.md` | Cada skill (top-level, colecciones y `synced/`) con invocación y descripción |
| `agents/AGENTS_CATALOG.md` | Los 233 agentes agrupados por división |
| `gstack/GSTACK_CATALOG.md` | Las 42 tools de gstack |

Se regeneran con `bash $AISTACK_HOME/scripts/gen-catalogs.sh`, leyendo el frontmatter real.

---

## 9. 🎯 Tarea → Herramienta (la chuleta)

| Necesito… | Uso |
|-----------|-----|
| Saber en qué proyecto va un tema | `$WORKSPACE/PROYECTOS.md`, sección «Límites» |
| Entender un área de código nueva | `/skill zoom-out` |
| Cazar un bug difícil | `/skill diagnose` |
| Validar un plan | `/skill grill-me` / `grill-with-docs` |
| Qué especialista usar | `/skill route-specialist` |
| Convertir charla en spec | `/skill to-prd` → `/skill to-issues` |
| Feature con tests | `/skill tdd` / `test-driven-development` / `tdd-workflow` |
| Escribir, editar o delegar código (cualquier stack) | `/skill engineering-standards` + agente `standards-reviewer` en N2/N3 |
| Normalizar una app existente sin cambiar comportamiento | `engineering-standards/references/plan-de-calidad.md` + `toolchain.md` |
| Arrancar una app nueva | `engineering-standards/references/app-nueva.md` |
| Lint de Go | `golangci-lint` v2.14.0 global en el servidor de CI (`/usr/local/bin`); plantilla en `stacks/go.md` |
| App Next.js / TypeScript / Node | `engineering-standards/stacks/nextjs.md` (capas, ESLint, dependency-cruiser); Node 22.22.2 global en el servidor de CI y en los servidores de app |
| Esquema, migraciones y RLS en PostgreSQL | `engineering-standards/stacks/postgres.md` |
| Revisar Laravel antes de mergear | `/skill laravel-verification` + `laravel-security` + agente `php-reviewer` |
| Revisar Django antes de mergear | `/skill django-verification` + `django-security` + agente `django-reviewer` |
| Tareas en segundo plano con Celery | `/skill django-celery` |
| Query lenta o índice en MariaDB / Postgres | `/skill mysql-patterns` / `postgres-patterns` |
| Migración de esquema segura | `/skill database-migrations` o `/claude-db:migrate` |
| Código que toca datos de pacientes | `/skill healthcare-phi-compliance` + agente `healthcare-reviewer` |
| Parsear documentos estructurados barato | `/skill regex-vs-llm-structured-text` |
| VLANs / reglas de pfSense | `/skill homelab-vlan-segmentation` + agente `network-config-reviewer` |
| Interfaz con errores o flapping | `/skill network-interface-health` |
| Dashboard de Grafana | `/skill dashboard-builder` |
| ¿Qué se rompe en prod? | `/skill production-audit` · gate final: agente `reality-checker` |
| Verificar un deploy | `/skill canary-watch` / `browser-qa` |
| Botones que "no hacen nada" | `/skill click-path-audit` |
| Seguridad del código | agente `security-engineer` + `compliance-auditor` |
| SAST | `/skill semgrep` / `codeql` → `sarif-parsing` · ¿es real? `fp-check` |
| Escaneo de seguridad completo y verificado | `/skill security-scan-verified` (en Claude Code: plugin `claude-security`) |
| Pentest / IR / forense | skill específico de `cybersecurity-skills` (buscar en el catálogo) |
| Auditoría SEO | `/skill seo-audit` o agente `seo-technical` |
| Copy de campaña | `/skill copywriting` + `/skill cro` |
| Cambio visual | `/skill visual-proof` (screenshot obligatorio) |
| 2ª opinión de otro modelo | `/skill second-opinion` |
| Guardar lo aprendido para los otros asistentes | `/skill memory` (`save` / `handoff`) |
| Recuperar lo ya sabido antes de arrancar | `/skill memory` (`search`) |
| Que una corrección del usuario persista | `/skill instincts` |
| Cerrar una tarea | `/skill protocol-end` |
| Prosa sin slop | `/skill stop-slop-es` / `stop-slop-en` |
| Saber qué dice o muestra un video | `/skill watch` (subir `--detail` sólo si la pregunta es visual) |

---

## 10. Portar el brain a un nodo nuevo

1. Copiar/clonar `$AISTACK_HOME/` (es self-contained).
2. Symlinks por usuario:
   ```bash
   ln -sfn $AISTACK_HOME/skills    ~/.claude/skills
   ln -sfn $AISTACK_HOME/agents    ~/.claude/agents
   ln -sfn $AISTACK_HOME/AGENTS.md ~/.claude/CLAUDE.md
   ln -sfn $AISTACK_HOME/AGENTS.md ~/.codex/AGENTS.md
   ln -sfn $AISTACK_HOME/AGENTS.md ~/.gemini/GEMINI.md
   ln -sfn $AISTACK_HOME/skills    ~/.config/opencode/skill
   ```
   y en `~/.config/opencode/opencode.json`: `"instructions": ["$AISTACK_HOME/AGENTS.md"]`.
3. `bash $AISTACK_HOME/scripts/gen-catalogs.sh`.
4. El asistente nuevo arranca leyendo `AGENTS.md` y este inventario.

---

**Infra del nodo** (nodos, VMs, IPs): en el credentials store del host, nunca en este árbol.
**Mantenimiento obligatorio:** cada alta, baja o cambio de skill, vendor, plugin, agente, hook o
script global exige actualizar este inventario y regenerar los catálogos con
`bash $AISTACK_HOME/scripts/gen-catalogs.sh`.

_Última actualización: 2026-09-28 por Claude Code — rehecho completo: ecc-skills (37 + 4 agentes),
cybersecurity-skills, Go, diseño, hooks, OpenCode y `skills/synced/`; eliminada la sección de git
hooks, que no existían._
