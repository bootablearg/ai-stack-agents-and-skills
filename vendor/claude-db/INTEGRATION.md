# Integración de Claude DB — Multi-AI

**Archivo:** `$AISTACK_HOME/vendor/claude-db/INTEGRATION.md`  
**Versión:** 0.1.0 (julio 2026)  
**Audiencia:** Desarrolladores, DevOps, Arquitectos de datos en Claude Code, Codex CLI, Gemini, Copilot CLI  

---

## Resumen Rápido

Claude DB está **instalado globalmente** en `$AISTACK_HOME/vendor/claude-db/` y es accesible desde cuatro asistentes de IA:

| Asistente | Cómo invocar | Modo |
|-----------|--------------|------|
| **Claude Code** | `/claude-db:<comando>` | Plugin auto-descubierto; skill invocable |
| **Codex CLI** | `/skill claude-db` o agentes vía `agent claude-db-migration-writer` | Markdown portable; CLI heredado de skills/agents |
| **Gemini CLI** | `/skill claude-db` (idem) | Heredado vía `~/.gemini/GEMINI.md` → `$AISTACK_HOME/AGENTS.md` |
| **Copilot CLI** | `/skill claude-db` (idem) | Heredado vía `/workspace/AGENTS.md` → `$AISTACK_HOME/AGENTS.md` |

---

## Claude Code — Plugin Autodescubierto

Claude DB funciona como **plugin nativo** de Claude Code. No requiere instalación manual — la estructura `.claude-plugin/` en `vendor/claude-db/` es detectada automáticamente al iniciar.

### Invocación

```
/claude-db:start       ← Menú interactivo (elige tarea y paradigma)
/claude-db:audit       ← Audita la DB (diseño + performance)
/claude-db:design      ← Wizard de diseño desde cero
/claude-db:fix         ← Aplica migraciones (solo db-migration-writer)
/claude-db:migrate     ← Propone migraciones seguras
/claude-db:explain     ← Explica conceptos en español
/claude-db:score       ← Rescoring de dos ejes
/claude-db:seed        ← Genera fixtures de datos
/claude-db:checklist   ← Readiness pre-producción
/claude-db:next        ← Próximos pasos recomendados
```

### Dentro de Claude Code

1. **Directa en la CLI:** escribe `/claude-db:audit` como comando
2. **Discover:** escribe `claude-db` en la barra de búsqueda de comandos (⌘K / Ctrl+K)
3. **Como skill:** si existe `SKILL.md` en `skills/` → usa `/skill <nombre>`

### Output

- **Hallazgos:** JSON Schema validado (`schema/finding.schema.json`)
- **Reportes:** Markdown con diagramas Mermaid (ER, timeline)
- **Propuestas de fix:** Con risk assessment y rollback plan

### Restricciones (Hooks)

- **Read-only por defecto:** Hooks `PreToolUse` en `hooks/hooks.json` bloquean Write/Edit
- **Solo `db-migration-writer` puede escribir:** vía `/claude-db:fix` después de aprobación
- **SQL-safe:** Script `guard-sql.mjs` previene mutaciones en Bash

---

## Codex CLI — Acceso via Skills Portables

Codex **no tiene plugins nativos**, pero accede a claude-db vía markdown portable.

### Setup

El `~/.codex/skills` es un symlink que apunta a `$AISTACK_HOME/skills`:
```bash
~/.codex/skills -> $AISTACK_HOME/skills
~/.codex/AGENTS.md -> $AISTACK_HOME/AGENTS.md
```

Codex lee los `.md` del brain compartido (mismo que Claude Code).

### Invocación

**Como skill en el prompt:**
```bash
codex exec "usá la skill claude-db para auditar el schema"
```

**Como agente subcontratado:**
```bash
codex exec "Activate db-migration-writer mode y genera una migración reversible"
```

### Diferencia vs Claude Code

- Codex **no ejecuta hooks** — los guardias read-only no aplican
- **Usar solo para lectura:** propuestas de auditoría, no para Write/Edit
- Si necesitas aplicar fixes: pasa a Claude Code y ejecuta `/claude-db:fix`

### Flujo Recomendado

1. **Codex propone:** `Activate schema-integrity-auditor mode` → Analiza DDL
2. **Claude revisa:** `/claude-db:audit` → Valida hallazgos
3. **Codex ejecuta:** si está aprobado, `Activate db-migration-writer mode` para generar SQL
4. **Claude aplica:** `/claude-db:fix` → Maneja los hooks y permisos

---

## Gemini CLI — Acceso Heredado

Gemini accede a claude-db igual que Codex.

### Setup

```bash
~/.gemini/GEMINI.md -> $AISTACK_HOME/AGENTS.md
```

### Invocación

```bash
gemini -p "analiza el schema de Postgres con claude-db"
```

### Uso Típico

- **Diagnóstico rápido:** Gemini lee DDL e identifica antipatterns
- **Segunda opinión:** compara auditoría de Claude vs Gemini
- **Offline research:** consulta referencias en `vendor/claude-db/references/`

---

## GitHub Copilot CLI — Acceso Heredado

Copilot también tiene acceso vía el brain compartido.

### Setup

```bash
$WORKSPACE/AGENTS.md -> $AISTACK_HOME/AGENTS.md
```

### Invocación

```bash
copilot -p "los 6 agentes de claude-db, ¿cuál debo invocar para auditar integridad?"
```

---

## Datos de Entrada — Formatos Soportados

Claude DB acepta esquemas en múltiples formatos:

| Formato | Paradigma | Ejemplo |
|---------|-----------|---------|
| **DDL Postgres** | Relational | `CREATE TABLE...;` |
| **Prisma** | Relational | `model User { ... }` |
| **Drizzle** | Relational | `pgTable("users", { ... })` |
| **Rails migrations** | Relational | `create_table :users do` |
| **Mongoose** | Document | `new Schema({ ... })` |
| **DynamoDB CDK** | Key-value | `new Table(scope, ...)` |
| **Java ORM** | Relational | JPA/Hibernate `@Entity` |
| **SQL Server T-SQL** | Relational | T-SQL DDL |
| **.sql files** | Any | Migración raw |

Copiar/pegar el archivo o la URL del repo → claude-db lo detecta automáticamente.

---

## Tier de Acceso a Datos

Claude DB escala según lo que necesites:

### Tier 0: Offline (default)
- **Conexión:** Ninguna
- **Datos:** Archivos de esquema (DDL, ORM, migrations)
- **Comandos:** Todos (audit, design, fix, migrate)
- **Latencia:** Instantáneo
- **Requisitos:** Cero

### Tier 1: Read-only Introspection (opcional)
- **Conexión:** `$DATABASE_URL_READONLY` (Postgres)
- **Setup:** Configurar en `.mcp.json`:
  ```json
  {
    "mcpServers": {
      "postgres-mcp": {
        "command": "postgres-mcp",
        "args": ["--access-mode=restricted"]
      }
    }
  }
  ```
- **Beneficio:** Introspect catálogos vivos sin confiar en DDL anticuado
- **Seguridad:** Rol DB con CONNECT + SELECT solamente

### Tier 2: Live Statistics (opcional)
- **Conexión:** Misma que Tier 1 + acceso a `pg_stat_*` vistas
- **Beneficio:** Diagnóstico de runtime (query patterns, table bloat, missing indexes)
- **Requisito:** Rol DB con acceso a estadísticas

Cada comando indica si necesita Tier 1/2 automáticamente.

---

## Configuración por Asistente

### Claude Code (`~/.claude/settings.json`)

```json
{
  "enabledPlugins": {
    "claude-db": true
  },
  "permissions": {
    "allow": ["read", "grep", "bash"]
  }
}
```

Claude DB está **siempre habilitado** — no hay switch. Si quisieras desactivarlo:
```json
{
  "enabledPlugins": {
    "claude-db": false
  }
}
```

### Codex (`~/.codex/config.toml`)

No requiere configuración especial. Accede al symlink de skills.

### Gemini / Copilot

Heredan de `AGENTS.md` symlink — sin config necesaria.

---

## Flujos Multi-AI Recomendados

### Flujo 1: Auditoría Independiente (Verificación Cruzada)

```
1. Claude Code:  /claude-db:audit (Tier 0)
2. Gemini:       "usá schema-integrity-auditor" (verifica hallazgos)
3. Codex:        "detecta antipatterns con nosql-paradigm-auditor" (si es MongoDB)
→ Consenso entre 3 modelos antes de proponer fix
```

### Flujo 2: Migración Controlada

```
1. Claude Code:  /claude-db:design (preguntas guiadas)
2. Codex:        "Activate db-migration-writer, genera migración" (SQL raw)
3. Claude Code:  /claude-db:migrate (valida reversibilidad)
4. Claude Code:  /claude-db:fix (aplica con manejo de locks)
```

### Flujo 3: Onboarding de DB Nueva

```
1. Codex:        "usá /skill claude-db para generar schema Tier 0"
2. Claude:       /claude-db:design (wizard)
3. Gemini:       "¿es escalable este design para 10M rows?" (segunda opinión)
4. Claude:       /claude-db:checklist (producción-ready?)
```

---

## Soporte de Idioma

Todos los comandos y agentes están **agnósticos de idioma** — responden en la lengua del prompt.

- **Español:** Claude DB explica en castellano argentino (por defecto del nodo)
- **Inglés:** Misma funcionalidad, prompts en inglés
- **Docs:** `docs/es/` y `docs/en/` con parity completa

---

## Troubleshooting

### "Plugin no aparece en Claude Code"

1. Verificar estructura: `ls vendor/claude-db/.claude-plugin/`
2. Recargar plugins: comando `/reload-plugins` en Claude Code
3. Revisar `~/.claude/settings.json` → `enabledPlugins` no debe tener `false`

### "No puedo escribir archivos (Write/Edit bloqueados)"

Esto es **intencional**. Solo `db-migration-writer` puede escribir vía `/claude-db:fix` después de aprobación. Si necesitas bypass:
- Usar Codex vía `codex exec --raw` (peligroso, sin guardrails)
- O agregar tu script a la allowlist en hooks (requiere editar `hooks/hooks.json`)

### "¿Cómo introspectear mi DB viva?"

Tier 1: Configura `$DATABASE_URL_READONLY` y `.mcp.json` con `postgres-mcp`. Luego `/claude-db:audit` automatiza la conexión.

### "¿Puedo usar con MongoDB/DynamoDB/Neo4j?"

Sí. Claude DB detecta el paradigma automáticamente. Invoca `nosql-paradigm-auditor` para Document/KV/Graph.

---

## Links y Referencias

| Recurso | Ubicación |
|---------|-----------|
| **CLAUDE.md** (reglas de dev) | `vendor/claude-db/CLAUDE.md` |
| **Scoring model** | `vendor/claude-db/references/scoring-model.md` |
| **Best practices** | `vendor/claude-db/references/relational-best-practices.md` (+ nosql-*) |
| **Antipatterns** | `vendor/claude-db/references/antipattern-catalog.md` |
| **Engine selection tree** | `vendor/claude-db/references/engine-selection-tree.md` |
| **Docs completas (ES)** | `vendor/claude-db/docs/es/` |
| **Memory bank** | `~/.claude/projects/-home-<usuario>-workspace/memory/claude-db.md` |

---

**Mantenido por:** Claude Code  
**Última actualización:** 2026-07-10  
