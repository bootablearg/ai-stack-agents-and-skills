## 🏛️ Estándar de código — vigente para todo código que escribas (skill `engineering-standards`)

- **Antes de escribir, editar o delegar código:** cargá el skill y su `stacks/<stack>.md`.
- **Nivel** (ante la duda, el más bajo): N1 script → Clean Code · N2 módulo → + SOLID, núcleo puro, dependencias inyectadas, tests · N3 app → + Clean Architecture, casos de uso, puertos, entrada delgada.
- **Plan que toca código = 5 líneas:** Nivel · Ubicación · Responsabilidad · Patrón (con su fuerza, o "ninguno") · Dependencias nuevas.
- **Puerta de calidad por commit:** formateador limpio · analizador/tipos sin hallazgos nuevos · tests en verde · refactor sin cambio de comportamiento (si no hay tests, caracterización primero) · N2/N3 pasa por `standards-reviewer`.
- **Herramientas por stack** (`references/toolchain.md`): Go gofumpt+golangci-lint v2+`go fix` · PHP Pint+Larastan+Rector+`strict_types` · Python ruff+`mypy --strict` · TS/Next Prettier+ESLint `strictTypeChecked`+`tsc`+dependency-cruiser · SQL sqlfluff (PostgreSQL: `stacks/postgres.md`) · Bash shfmt+shellcheck.
- **Roles** (`references/roles-agentes.md`): Codex implementa lotes, DSH los revisa en forma adversarial (o al revés), Claude diseña y audita. Quien implementa no se revisa.
- **App nueva** (`references/app-nueva.md`): nace con lint, tipos estrictos, tests, CI/CD y `vX.Y.Z`; si su stack no tiene `stacks/<x>.md`, se crea antes de la primera línea.
- **Código existente:** se mejora sólo lo que la tarea toca; la normalización integral sigue `references/plan-de-calidad.md`.
