# Clean Architecture

## Círculos

```text
+-----------------------------+
| Frameworks y drivers        |
| +-------------------------+ |
| | Adaptadores             | |
| | +---------------------+ | |
| | | Casos de uso        | | |
| | | +-----------------+ | | |
| | | | Entidades       | | | |
| | | +-----------------+ | | |
| | +---------------------+ | |
| +-------------------------+ |
+-----------------------------+
```

## Regla de dependencia

Las dependencias apuntan hacia adentro. Entidades y casos de uso no importan frameworks, base de datos, HTTP, colas, SDKs ni filesystem.

## Capas

- Entidades: reglas e invariantes del dominio.
- Casos de uso: orquestan una intención del usuario o del sistema.
- Adaptadores: traducen entre el mundo externo y los casos de uso.
- Frameworks: detalles como ORM, HTTP, CLI, colas, correo o almacenamiento.

## Frameworks Active Record (Laravel, Django, Rails)

En estos frameworks el modelo del ORM es a la vez entidad y persistencia. Aislar el dominio
del ORM duplica cada modelo y pelea contra el framework, así que la variante por defecto es
pragmática:

- Los casos de uso (Actions, services) **pueden** usar los modelos del ORM.
- Los casos de uso **no pueden** usar el request, la sesión, la respuesta HTTP, el
  componente de UI ni el contenedor de servicios como localizador.
- Todo sistema externo (correo, pagos, almacenamiento, APIs de terceros, colas) entra por
  un puerto, nunca por una facade o un SDK llamado directo desde el caso de uso.
- Las reglas de invariante viven en el modelo o en el caso de uso, nunca en el controlador.

El aislamiento estricto (dominio sin ORM, con repositorios) se adopta sólo cuando el dominio
lo justifica (reglas complejas, más de una fuente de datos, tests sin base) y se registra
en un ADR.

## Puertos y adaptadores

Un puerto es una interfaz definida por la capa que consume. Un adaptador implementa ese puerto usando un detalle externo.

```go
type Mailer interface {
    SendWelcome(ctx context.Context, email string) error
}
```

## DTO en límites

Usá DTO para cruzar límites de capa. No pases requests HTTP, modelos ORM ni objetos de SDK hacia casos de uso.

## Validación

La validación de forma vive en el borde: request, serializer, CLI args. La validación de regla de negocio vive en entidades o casos de uso.

## Autorización

La autorización de acceso se decide antes del caso de uso o al inicio del caso de uso. Las entidades no deberían conocer usuarios HTTP ni sesiones.

## Transacciones

La transacción envuelve el caso de uso cuando hay que conservar consistencia entre varias escrituras. No la escondas en un repositorio si el caso de uso necesita coordinar varias operaciones.

## Tests

- Entidades: tests unitarios puros.
- Casos de uso: tests con puertos fake.
- Adaptadores: tests de integración contra el detalle externo controlado.
- Frameworks: pocos tests end-to-end para flujos críticos.

## Verificación automática

- PHP: `deptrac` para impedir dependencias desde dominio hacia framework.
- Python: `import-linter` para contratos entre capas.
- Go: `depguard` en `golangci-lint` para bloquear imports prohibidos.

Ejemplo de regla: la capa `domain` no puede importar `http`, ORM, SDKs ni paquetes de infraestructura.
