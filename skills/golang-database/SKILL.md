---
name: golang-database
description: "[Go] Comprehensive guide for Go database access — parameterized queries, struct scanning, NULLable columns, transactions, isolation levels, SELECT FOR UPDATE, connection pool, batch processing, context propagation, and migration tooling. Use when writing, reviewing, or debugging Golang code that interacts with PostgreSQL, MariaDB, MySQL, or SQLite; for database testing; or for questions about database/sql, sqlx, or pgx. Does NOT generate database schemas or migration SQL."
user-invocable: true
license: MIT
compatibility: Designed for Claude Code, Codex or similar harness, and for projects using Golang.
metadata:
  author: samber
  version: "1.3.2"
  openclaw:
    emoji: "🗄"
    homepage: https://github.com/samber/cc-skills-golang
    requires:
      bins:
        - go
    install: []
allowed-tools: Read Edit Write Glob Grep Bash(go:*) Bash(golangci-lint:*) Bash(git:*) Agent AskUserQuestion

---

> ## 🇦🇷 Skill podado e instalado en este host — leer antes de usar
>
> **Qué es.** acceso a base de datos en Go: consultas parametrizadas, columnas NULL, transacciones, niveles de aislamiento, pool de conexiones.
>
> **Para qué está acá.** Para el proyecto **de referencia** (`$WORKSPACE/<proyecto>`):
> Go 1.27, 17.539 líneas, 78 archivos, cuatro dependencias directas, MariaDB. el proyecto tiene 94 usos de `sql.Null*` y habla con MariaDB por `database/sql`.
>
> **De dónde salió.** [`samber/cc-skills-golang`](https://github.com/samber/cc-skills-golang),
> licencia MIT, clonado el 2026-09-10. Del catálogo original de **46 skills se instalaron 4**:
> `golang-security`, `golang-safety`, `golang-testing`, `golang-database`. Los otros 42 se
> descartaron por ser para librerías que el proyecto no usa (gRPC, GraphQL, cobra, viper,
> testify, cuatro frameworks de inyección de dependencias y siete de las librerías del
> propio autor), o porque chocan: el de CI es sólo GitHub Actions y acá el pipeline es
> GitLab, y los de estilo y nombres empujan identificadores en inglés cuando el proyecto está
> escrito en castellano.
>
>
> **🪤 No le devuelvas la clave `paths:` al frontmatter.** El original de `samber` traía
> `paths: ["**/*.go"]`, y **Claude Code descarta el skill entero** cuando esa clave está
> presente: los cuatro fueron invisibles para `/skill` desde que se instalaron, el
> 2026-09-10, hasta que se sacó la clave el 2026-09-11. Probado con cinco sondas idénticas
> que sólo diferían en una clave: cargaron todas menos la de `paths:`. Si algún día se
> actualizan desde el repo de origen, **la clave vuelve y los rompe de nuevo** — sacarla es
> parte de la actualización, no un detalle. Los otros asistentes no la leen: Codex, Gemini y
> Copilot abren el cuerpo del archivo, y el catálogo sólo toma `name` y `description`.
> **🪤 Referencias rotas — con dos excepciones desde el 2026-09-11.** El texto cita otros
> skills con la forma `samber/cc-skills-golang@golang-<algo>`. Casi todos apuntan a algo que
> no está instalado: ignorá esas remisiones, este archivo se basta solo, y no las persigas ni
> las instales sin preguntar. **Las dos que sí existen acá** —armadas en este host, sin el
> prefijo `samber/`— son **`golang-concurrency`** y **`golang-observability`**: cuando el
> texto remita a concurrencia (goroutines, channels, `sync`, leaks) o a observabilidad
> (logging, métricas, trazas), ese skill sí se puede cargar.
>
> **✂️ Poda aplicada a este skill.** El original prohibía escribir SQL de migración a mano
> y exigía golang-migrate, Flyway o Atlas (reglas 12 y 14, y las secciones *Migrations* y
> *Schema Creation*). **el proyecto hace exactamente lo contrario, y es una decisión tomada:** las
> migraciones son archivos versionados a mano en `app/sql/0NN_*.sql`, revisados por el usuario y
> aplicados por el pipeline. Esos pasajes fueron reemplazados por la política real del
> proyecto para que el skill no discuta cada migración.


**Persona:** You are a Go backend engineer who writes safe, explicit, and observable database code. You treat SQL as a first-class language — no ORMs, no magic — and you catch data integrity issues at the boundary, not deep in the application.

**Modes:**

- **Write mode** — generating new repository functions, query helpers, or transaction wrappers: follow the skill's sequential instructions; launch a background agent to grep for existing query patterns and naming conventions in the codebase before generating new code.
- **Review/debug mode** — auditing or debugging existing database code: use a sub-agent to scan for missing `rows.Close()`, un-parameterized queries, missing context propagation, and absent error checks in parallel with reading the business logic.

> **Community default.** A company skill that explicitly supersedes `samber/cc-skills-golang@golang-database` skill takes precedence.

# Go Database Best Practices

Go's `database/sql` provides a solid foundation for database access. Use `sqlx` or `pgx` on top of it for ergonomics — never an ORM.

When using sqlx or pgx, refer to the library's official documentation and code examples for current API signatures.

## Best Practices Summary

1. **Use sqlx or pgx, not ORMs** — ORMs hide SQL, generate unpredictable queries, and make debugging harder
2. Queries MUST use parameterized placeholders — NEVER concatenate user input into SQL strings
3. Context MUST be passed to all database operations — use `*Context` method variants (`QueryContext`, `ExecContext`, `GetContext`)
4. `sql.ErrNoRows` MUST be handled explicitly — distinguish "not found" from real errors using `errors.Is`
5. Rows MUST be closed after iteration — `defer rows.Close()` immediately after `QueryContext` calls
6. NEVER use `db.Query` for statements that don't return rows — `Query` returns `*Rows` which must be closed; if you forget, the connection leaks back to the pool. Use `db.Exec` instead
7. **Use transactions for multi-statement operations** — wrap related writes in `BeginTxx`/`Commit`
8. **Use `SELECT ... FOR UPDATE`** when reading data you intend to modify — prevents race conditions
9. **Set custom isolation levels** when default READ COMMITTED is insufficient (e.g., serializable for financial operations)
10. **Handle NULLable columns** with pointer fields (`*string`, `*int`) or `sql.NullXxx` types
11. Connection pool MUST be configured — `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`, `SetConnMaxIdleTime`
12. **Migrations are hand-written, versioned SQL files** — in the reference project they live in `app/sql/0NN_<tema>.sql`, are reviewed by the user and applied by the pipeline. Do NOT propose golang-migrate, Flyway or Atlas: the decision is already taken and recorded in `decisions.md`
12b. **A migration that creates a table MUST grant its own privilege, in the same file.** In this database `SELECT` and `INSERT` are global but `UPDATE` and `DELETE` are granted table by table on purpose — the app can delete in 2 tables out of 85, and can never touch the audit log. A new table is therefore unusable until someone grants it, and that does *not* surface when the migration runs (it runs as the admin user): it surfaces later as `Error 1142` in the user's face. Grant only the verb that table needs; never `UPDATE`/`DELETE` on `auditoria_eventos`. Decision D-2026-09-12c.
13. **Batch operations in reasonable sizes** — not row-by-row (too many round trips), not millions at once (locks and memory)
14. **A schema change is a proposal, never a fait accompli** — write the DDL as a new numbered file, explain what it changes and why, and wait for the explicit "sí" (project Rule #1). What the original skill forbade outright is allowed here, under review: a schema that looks correct on toy data can still create hotspots, lock contention or missing indexes under real load, so the human review is the control
15. **Avoid hidden SQL features** — do not rely on triggers, views, materialized views, stored procedures, or row-level security in application code

## Library Choice

| Library | Best for | Struct scanning | PostgreSQL-specific |
| --- | --- | --- | --- |
| `database/sql` | Portability, minimal deps | Manual `Scan` | No |
| `sqlx` | Multi-database projects | `StructScan` | No |
| `pgx` | PostgreSQL (30-50% faster) | `pgx.RowToStructByName` | Yes (COPY, LISTEN, arrays) |
| GORM/ent | **Avoid** | Magic | Abstracted away |

**Why NOT ORMs:**

- Unpredictable query generation — N+1 problems you cannot see in code
- Magic hooks and callbacks (BeforeCreate, AfterUpdate) make debugging harder
- Schema migrations coupled to application code
- Learning the ORM API is harder than learning SQL, and the abstraction leaks

## Parameterized Queries

```go
// ✗ VERY BAD — SQL injection vulnerability
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)

// ✓ Good — parameterized (PostgreSQL)
var user User
err := db.GetContext(ctx, &user, "SELECT id, name, email FROM users WHERE email = $1", email)

// ✓ Good — parameterized (MySQL)
err := db.GetContext(ctx, &user, "SELECT id, name, email FROM users WHERE email = ?", email)
```

### Dynamic IN clauses

```go
query, args, err := sqlx.In("SELECT * FROM users WHERE id IN (?)", ids)
if err != nil {
    return fmt.Errorf("building IN clause: %w", err)
}
query = db.Rebind(query) // adjust placeholders for your driver
err = db.SelectContext(ctx, &users, query, args...)
```

### Dynamic column names

Never interpolate column names from user input. Use an allowlist:

```go
allowed := map[string]bool{"name": true, "email": true, "created_at": true}
if !allowed[sortCol] {
    return fmt.Errorf("invalid sort column: %s", sortCol)
}
query := fmt.Sprintf("SELECT id, name, email FROM users ORDER BY %s", sortCol)
```

For more injection prevention patterns, see the `samber/cc-skills-golang@golang-security` skill.

## Struct Scanning and NULLable Columns

Use `db:"column_name"` tags for sqlx, `pgx.CollectRows` with `pgx.RowToStructByName` for pgx. Handle NULLable columns with pointer fields (`*string`, `*time.Time`) — they work cleanly with both scanning and JSON marshaling. See [Scanning Reference](./references/scanning.md) for examples of all approaches.

## Error Handling

```go
func GetUser(id string) (*User, error) {
    var user User

    err := db.GetContext(ctx, &user, "SELECT id, name FROM users WHERE id = $1", id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound // translate to domain error
        }
        return nil, fmt.Errorf("querying user %s: %w", id, err)
    }

    return &user, nil
}
```

or:

```go
func GetUser(id string) (u *User, exists bool, err error) {
    var user User

    err := db.GetContext(ctx, &user, "SELECT id, name FROM users WHERE id = $1", id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, false, nil // "no user" is not a technical error, but a domain error
        }
        return nil, false, fmt.Errorf("querying user %s: %w", id, err)
    }

    return &user, true, nil
}
```

### Always close rows

```go
rows, err := db.QueryContext(ctx, "SELECT id, name FROM users")
if err != nil {
    return fmt.Errorf("querying users: %w", err)
}
defer rows.Close() // prevents connection leaks

for rows.Next() {
    // ...
}
if err := rows.Err(); err != nil { // always check after iteration
    return fmt.Errorf("iterating users: %w", err)
}
```

### Common database error patterns

| Error | How to detect | Action |
| --- | --- | --- |
| Row not found | `errors.Is(err, sql.ErrNoRows)` | Return domain error |
| Unique constraint | Check driver-specific error code | Return conflict error |
| Connection refused | `err != nil` on `db.PingContext` | Fail fast, log, retry with backoff |
| Serialization failure | PostgreSQL error code `40001` | Retry the entire transaction |
| Context canceled | `errors.Is(err, context.Canceled)` | Stop processing, propagate |

## Context Propagation

Always use the `*Context` method variants to propagate deadlines and cancellation:

```go
// ✗ Bad — no context, query runs until completion even if client disconnects
db.Query("SELECT ...")

// ✓ Good — respects context cancellation and timeouts
db.QueryContext(ctx, "SELECT ...")
```

For context patterns in depth, see the `samber/cc-skills-golang@golang-context` skill.

## Transactions, Isolation Levels, and Locking

For transaction patterns, isolation levels, `SELECT FOR UPDATE`, and locking variants, see [Transactions](./references/transactions.md).

## Connection Pool

```go
db.SetMaxOpenConns(25)              // limit total connections
db.SetMaxIdleConns(10)              // keep warm connections ready
db.SetConnMaxLifetime(5 * time.Minute)  // recycle stale connections
db.SetConnMaxIdleTime(1 * time.Minute)  // close idle connections faster
```

For sizing guidance and formulas, see [Database Performance](./references/performance.md).

## Migrations — how the reference project actually does it

✂️ *Section rewritten during install. The original mandated golang-migrate / Flyway / Atlas;
this project deliberately does not use them.*

Migrations are **hand-written, numbered SQL files** under `app/sql/`:

```
app/sql/018_identificador_fiscal.sql
app/sql/019_verificaciones_identidad.sql
```

Rules that DO apply here:

- One file per change, numbered in sequence, never edited once applied — a correction is a new file.
- Written and reviewed by a human, versioned in git, applied through the pipeline.
- Never inline SQL over SSH: upload the `.sql` file and execute it. An inline statement with a
  bad scope already modified the wrong grants once on this project.
- Verify the **resulting state** (`\d`, `information_schema`), not the exit code. A command that
  returns 0 has not proven it did what it said.

Do not propose replacing this with a migration framework unless the user asks.

## Avoid Hidden SQL Features

Do not rely on triggers, views, materialized views, stored procedures, or row-level security in application code — they create invisible side effects and make debugging impossible. Keep SQL explicit and visible in Go where it can be tested and version-controlled.

## Schema Creation

✂️ *Section rewritten during install.* The original refused to cover schema creation at all.
In this project schema work IS in scope — under the project's Rule #1: diagnose, propose,
plan which files and environments are touched, and wait for the explicit "sí".

The original warning still holds as a reason to be careful, not as a prohibition: an
AI-drafted schema is often subtly wrong — missing indexes, wrong column types, bad
normalization, missing constraints. So state the data volumes and access patterns you are
assuming, and make them checkable.

## Deep Dives

- **[Transactions](./references/transactions.md)** — Transaction boundaries, isolation levels, deadlock prevention, `SELECT FOR UPDATE`
- **[Testing Database Code](./references/testing.md)** — Mock connections, integration tests with containers, fixtures, schema setup/teardown
- **[Database Performance](./references/performance.md)** — Connection pool sizing, batch processing, indexing strategy, query optimization
- **[Struct Scanning](./references/scanning.md)** — Struct tags, NULLable column handling, JSON marshaling patterns

## Cross-References

- → See `samber/cc-skills-golang@golang-security` skill for SQL injection prevention patterns
- → See `samber/cc-skills-golang@golang-context` skill for context propagation to database operations
- → See `samber/cc-skills-golang@golang-error-handling` skill for database error wrapping patterns
- → See `samber/cc-skills-golang@golang-testing` skill for database integration test patterns

## References

- [database/sql tutorial](https://go.dev/doc/database/)
- [sqlx](https://github.com/jmoiron/sqlx)
- [pgx](https://github.com/jackc/pgx)
