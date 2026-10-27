# Go

## Layout

- `cmd/<app>`: entrada CLI o servidor.
- `internal/<context>`: código privado del producto.
- Paquetes chicos con nombres de dominio.
- Interfaces chicas definidas por el consumidor.

## Dependencias

El dominio no importa `database/sql`, `net/http`, SDKs ni frameworks. La inyección va por constructor.

```go
type Service struct {
    repo CustomerRepository
}

func NewService(repo CustomerRepository) *Service {
    return &Service{repo: repo}
}
```

## Errores

Envolvé errores con `%w` y usá sentinel o typed errors cuando el consumidor necesita decidir.

```go
if err != nil {
    return fmt.Errorf("load customer %s: %w", id, err)
}
```

## Context

`context.Context` va como primer parámetro en operaciones que cruzan I/O, cancelación o timeout.

```go
func (s *Service) CreateInvoice(ctx context.Context, input CreateInvoiceInput) error
```

## Herramientas

| Función | Herramienta |
|---|---|
| Formato | `gofumpt` + `goimports`, como formatters de golangci-lint v2 |
| Análisis y tipos | `golangci-lint` v2 + `go vet` |
| Modernización | `go fix ./...` (modernizadores del toolchain) |
| Vulnerabilidades | `govulncheck ./...` |
| Capas | `depguard` (dentro de golangci-lint) |

Versión fija y verificada con el `checksums.txt` del release; el binario tiene que estar
compilado con un Go igual o más nuevo que el `go` del `go.mod` (`golangci-lint version`
lo dice). En código existente la puerta arranca con `--new-from-merge-base=<rama>`.

## `.golangci.yml` base (v2, validado con `golangci-lint config verify`)

`depguard` aplica sólo al paquete de dominio: los handlers sí importan `net/http` y los
adaptadores de base sí importan `database/sql`. En `cmd/` se permite imprimir: son CLIs.

```yaml
version: "2"

run:
  timeout: 5m

linters:
  default: standard            # errcheck, govet, ineffassign, staticcheck, unused
  enable:
    - bodyclose
    - contextcheck
    - depguard
    - errorlint
    - exhaustive
    - forbidigo
    - forcetypeassert
    - gocritic
    - gosec
    - nilerr
    - noctx
    - revive
    - rowserrcheck
    - sloglint
    - sqlclosecheck
    - unparam
  settings:
    depguard:
      rules:
        dominio:
          files:
            - "**/interno/dominio/**"   # ajustar a la carpeta de dominio real
          deny:
            - pkg: net/http
              desc: el dominio no depende de HTTP
            - pkg: database/sql
              desc: el dominio no depende de SQL
            - pkg: github.com/jackc/pgx/v5
              desc: el dominio no depende del driver
    forbidigo:
      forbid:
        - pattern: ^fmt\.Print.*$
          msg: usá log/slog
        - pattern: ^log\.(Print|Fatal|Panic).*$
          msg: usá log/slog
    govet:
      enable-all: true
      disable:
        - fieldalignment
        - shadow
  exclusions:
    rules:
      - path: _test\.go
        linters: [forcetypeassert, gosec, unparam]
      - path: cmd/
        linters: [forbidigo]

formatters:
  enable:
    - gofumpt
    - goimports
  settings:
    gofumpt:
      # 🪤 Obligatorio, con el mismo path del módulo. Sin esto, gofumpt toma los imports
      # del proyecto (sin punto en el primer elemento) por biblioteca estándar y pide
      # agruparlos con ella, mientras goimports los separa: `golangci-lint fmt` deja el
      # archivo de una forma y `golangci-lint run` lo sigue marcando como mal formateado.
      module-path: <modulo>
    goimports:
      # 🪤 Obligatorio: el path del módulo (la línea `module` del go.mod). Sin esto,
      # goimports mete los imports del propio proyecto en el grupo de la biblioteca
      # estándar y marca diferencias en todos los archivos que los separan.
      local-prefixes:
        - <modulo>
```

## Skills complementarios

Si el stack tiene `golang-safety`, `golang-testing`, `golang-concurrency`, `golang-database`, `golang-observability` o `golang-security`, combinarlos con este estándar.
