# Scripts

Bash y Python sueltos son N1 casi siempre.

## Bash

Obligatorio:

- `set -euo pipefail`
- funciones con una responsabilidad
- `main "$@"`
- variables en mayúsculas sólo para config
- `shellcheck`
- `shfmt -i 2 -ci`: formato
- errores explícitos

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly INPUT_FILE="${INPUT_FILE:-}"

main() {
  [[ -n "$INPUT_FILE" ]] || { echo "INPUT_FILE requerido" >&2; return 1; }
  process_file "$INPUT_FILE"
}

process_file() {
  local file="$1"
  wc -l "$file"
}

main "$@"
```

## Python

Obligatorio:

- `if __name__ == "__main__"`
- funciones puras con I/O en bordes
- `argparse`
- `ruff` (lint y formato)
- `mypy --strict` si el script pasa de un archivo
- errores explícitos

```python
import argparse


def count_lines(text: str) -> int:
    return len(text.splitlines())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()

    with open(args.path, encoding="utf-8") as file:
        print(count_lines(file.read()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

## Cuándo deja de ser N1

Sube a N2 si aparecen varios archivos, CLI reutilizable, tests del núcleo, configuración propia o integración estable con otros sistemas.
