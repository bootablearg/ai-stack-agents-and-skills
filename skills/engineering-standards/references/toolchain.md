# Toolchain — formato, tipos y modernización forzados por herramienta

Una regla que depende de que alguien la recuerde no se cumple. Cada stack tiene tres
herramientas que la hacen cumplir sola, en el pipeline y antes del commit:

| Función | Qué garantiza |
|---|---|
| **Formateador** | Nadie discute estilo: el diff de formato es siempre cero. |
| **Analizador estático / tipos** | Errores de tipos, nulos, errores ignorados y código muerto frenan el pipeline. |
| **Modernizador** | El código usa la forma vigente del lenguaje y la actualización del framework sale mecánica. |

## Tabla por stack

| Stack | Formateador | Estático / tipos | Modernizador | Extra obligatorio |
|---|---|---|---|---|
| PHP / Laravel | Pint | Larastan (nivel máximo alcanzable, con baseline) + `declare(strict_types=1);` en todo archivo nuevo | Rector | deptrac para capas |
| WordPress | PHP-CS-Fixer o Pint | PHPStan + `szepeviktor/phpstan-wordpress` | Rector | — |
| Go | `gofumpt` + `goimports` (como formatters de golangci-lint v2) | `golangci-lint` v2 (ver `stacks/go.md`) + `go vet` | `go fix ./...` (modernizadores) | `govulncheck`, `depguard` |
| Python / Django | `ruff format` | `ruff check` + `mypy --strict` (Django: `django-stubs`) | `ruff` con reglas `UP` (pyupgrade) | import-linter para capas |
| JS / TS | Prettier (o `biome format`) | ESLint 9 + `typescript-eslint` `strictTypeChecked` (o `biome lint`); `tsc --noEmit` con `"strict": true` | `npx @next/codemod` al subir de versión mayor de Next | `dependency-cruiser` para capas, `npm audit --audit-level=high` (ver `stacks/nextjs.md`) |
| Bash | `shfmt` | `shellcheck` | — | `set -euo pipefail` |
| SQL | `sqlfluff fix` **sólo en migraciones nuevas** | `sqlfluff lint` | — | ver la trampa de abajo y `stacks/postgres.md` |

🪤 **Las migraciones ya aplicadas no se reformatean.** Si el runner de migraciones verifica
un hash (sha256, checksum de Flyway, etc.), reformatear una migración vieja rompe el
despliegue. El formateador de SQL se limita a los archivos nuevos.

## Cómo se introduce en código existente

1. **Versión fija y verificada.** La herramienta se instala con versión exacta y hash
   comprobado, nunca con `@latest`. Un linter que cambia solo cambia el veredicto del
   pipeline sin que nadie haya tocado código.
2. **Primero informe, después puerta.** Se mide la línea de base sin frenar nada.
3. **Puerta sólo para lo nuevo.** Larastan con baseline; golangci-lint con
   `--new-from-merge-base`; mypy por módulo. Ningún hallazgo nuevo entra desde el día uno.
4. **Formato en un único commit mecánico**, separado de cualquier otro cambio, para que
   `git blame --ignore-rev` lo pueda saltear.
5. **Bajar la deuda por módulo** hasta cero; recién ahí la puerta pasa a cubrir todo.
6. **Nunca bajar un nivel ni ampliar un baseline para que pase un cambio.** Un hallazgo se
   corrige o se excluye con un comentario que diga por qué (`//nolint:<linter> // <motivo>`).

## Instalación

Una sola copia global por máquina (`/usr/local/bin`), nunca por usuario. En el pipeline, el
script que la usa fija versión y hash y falla si no coinciden.
