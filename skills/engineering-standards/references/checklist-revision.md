# Checklist de revisión

Usá este checklist con respuestas sí/no. Marcá severidad y corrección concreta.

## Clean Code

| Ítem | Severidad |
|---|---|
| Los nombres revelan intención, unidad y alcance. | a corregir |
| No hay números ni strings mágicos en lógica. | a corregir |
| Cada función tiene una responsabilidad clara. | bloqueante |
| El manejo de errores es explícito y no traga excepciones. | bloqueante |
| No hay código muerto, duplicado ni huérfano. | bloqueante |
| El código cruza APIs externas mediante límites claros. | a corregir |

## SOLID

| Ítem | Severidad |
|---|---|
| La unidad editada cambia por una sola razón. | a corregir |
| Las variantes reales se modelan sin cadenas crecientes de condicionales. | a corregir |
| Los contratos no obligan métodos vacíos o imposibles. | bloqueante |
| Las dependencias se pasan por constructor o parámetro en N2/N3. | bloqueante |
| Las interfaces existen del lado consumidor y tienen uso real. | sugerencia |

## Patrones

| Ítem | Severidad |
|---|---|
| Cada patrón usado declara la fuerza que lo justifica. | a corregir |
| No se agregó patrón en N1. | bloqueante |
| No se envolvió un ORM Active Record en Repository genérico por defecto. | a corregir |
| No hay Service Locator, Singleton con estado global ni God object nuevos. | bloqueante |

## Arquitectura N3

| Ítem | Severidad |
|---|---|
| Los casos de uso son explícitos. | bloqueante |
| Controladores, vistas, handlers y comandos son delgados. | bloqueante |
| Casos de uso y dominio no usan HTTP, sesión, UI ni SDKs externos. Con ORM Active Record, usar los modelos está permitido (ver `clean-architecture.md`). | bloqueante |
| Todo sistema externo entra por un puerto. | bloqueante |
| DTOs cruzan límites de capa. | a corregir |
| Validación de forma y validación de negocio están separadas. | a corregir |
| La transacción cubre el caso de uso correcto. | a corregir |

## Tests

| Ítem | Severidad |
|---|---|
| N2 tiene tests del núcleo de lógica. | bloqueante |
| N3 tiene tests de entidades y casos de uso con puertos fake. | bloqueante |
| Los tests son rápidos, independientes, repetibles y auto-verificables. | a corregir |
| El cambio legacy riesgoso tiene tests de caracterización. | bloqueante |

## Legacy y alcance

| Ítem | Severidad |
|---|---|
| El cambio mejora sólo el área tocada. | a corregir |
| No mezcla refactor mayor con cambio de comportamiento. | bloqueante |
| Los hallazgos fuera de alcance se listan aparte. | sugerencia |
| Cualquier subida de nivel N1->N2 o N2->N3 tiene plan aprobado. | bloqueante |

## Puerta de calidad

| Ítem | Severidad |
|---|---|
| El formateador del stack no deja diff. | bloqueante |
| El analizador estático y los tipos no suman hallazgos nuevos. | bloqueante |
| Ningún `nolint` / `@phpstan-ignore` / `type: ignore` nuevo sin motivo escrito. | bloqueante |
| Un lote implementado por otro agente tuvo revisión adversarial. | bloqueante |
