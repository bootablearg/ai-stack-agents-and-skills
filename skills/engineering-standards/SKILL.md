---
name: engineering-standards
description: "Estándar obligatorio de código (Clean Code, SOLID, design patterns, Clean Architecture) con niveles proporcionales al tamaño. Usar ANTES de escribir, editar, delegar o revisar código en cualquier lenguaje."
---

# Engineering Standards

## Propósito

Este estándar es obligatorio para todo código que escriba un agente. Sirve para decidir cuánto diseño aplicar, dónde ubicar cada responsabilidad y cómo revisar el resultado sin sobreactuar una tarea chica.

## Tabla de proporcionalidad

| Nivel | Criterio objetivo | Obligatorio | Prohibido |
|---|---|---|---|
| N1 Script | Un archivo, una tarea, sin estado persistente propio. | Clean Code completo; funciones con una sola responsabilidad; config y constantes separadas de la lógica; manejo de errores explícito. | Capas, interfaces, patrones. |
| N2 Módulo/herramienta | Varios archivos, CLI, plugin o librería interna. | N1 + SOLID a nivel clase/módulo; núcleo de lógica pura separado del I/O; dependencias inyectadas por parámetro o constructor; tests del núcleo. | Clean Architecture completa si no hay dominio ni persistencia propia. |
| N3 Aplicación | App con dominio de negocio, persistencia y usuarios: web, API o servicio. | N2 + Clean Architecture con regla de dependencia; casos de uso explícitos; puertos para sistemas externos; entrada delgada. | Lógica de negocio en controladores, vistas, handlers o adaptadores externos. |

Regla de desempate: ante la duda entre dos niveles, elegí el más bajo y subí cuando aparezca la necesidad. Subir de nivel es refactor y requiere plan.

## Reglas transversales

- Nombres que revelan intención.
- Sin números ni strings mágicos.
- Sin código muerto ni huérfano: lo reemplazado se borra en la misma tanda.
- Sin duplicación de lógica de negocio.
- Un patrón sólo si se nombra la fuerza concreta que lo justifica.
- Convención del framework por encima de pureza teórica.
- Toda desviación relevante se documenta en un ADR.

## Declaración obligatoria en el plan

Todo plan que toque código debe incluir estas 5 líneas antes de pedir autorización:

```md
Nivel: N1/N2/N3, porque <criterio objetivo>.
Ubicación: <capa/carpeta>.
Responsabilidad: <una oración>.
Patrón: <nombre + fuerza que lo justifica> / ninguno.
Dependencias nuevas: <dependencia> -> <hacia dónde apunta> / ninguna.
```

## Flujo

1. Identificar el stack.
2. Leer `stacks/<stack>.md`.
3. Clasificar el nivel con la tabla.
4. Declarar nivel, ubicación, responsabilidad, patrón y dependencias en el plan.
5. Escribir el cambio.
6. Hacer autocontrol con `references/checklist-revision.md`.
7. Pasar la puerta de calidad (abajo).
8. Pedir revisión al agente `standards-reviewer` en cambios N2 o N3.

## Puerta de calidad

Ningún commit se da por terminado sin las cinco:

1. Formateador del stack limpio (`references/toolchain.md`).
2. Analizador estático y tipos sin hallazgos nuevos.
3. Suite de tests en verde, con tests de lo nuevo.
4. Si es refactor: sin cambio de comportamiento, con tests de caracterización previos si no había cobertura.
5. N2/N3: veredicto de `standards-reviewer`. Lotes implementados por otro agente: además, revisión adversarial (`references/roles-agentes.md`).

Una app nueva cumple `references/app-nueva.md` desde el primer commit. Normalizar una app existente completa sigue `references/plan-de-calidad.md`.

## Delegación

Al delegar código a un subagente u otro asistente, el prompt debe ordenar cargar este skill e incluir la declaración obligatoria del plan. La delegación no baja el estándar ni reemplaza la revisión.

## Código existente

Todo código nuevo cumple este estándar. En código existente se aplica la regla del boy scout acotada: mejorar sólo la función, clase o módulo que la tarea toca, sin extender el alcance autorizado. Refactors mayores van en plan aparte.

## Índice

- `references/clean-code.md`: reglas observables de nombres, funciones, errores, formato, límites y tests.
- `references/solid.md`: aplicación práctica de los 5 principios y señales de sobreingeniería.
- `references/design-patterns.md`: catálogo acotado de patrones, fuerzas que los justifican y abusos.
- `references/clean-architecture.md`: capas, regla de dependencia, puertos, DTO, validación, autorización y tests.
- `references/legacy.md`: cómo trabajar sobre código existente sin mezclar alcance ni comportamiento.
- `references/checklist-revision.md`: checklist verificable para autocontrol y revisión.
- `references/toolchain.md`: formateador, analizador/tipos y modernizador forzados por stack.
- `references/plan-de-calidad.md`: plantilla de normalización integral sin cambio de comportamiento.
- `references/app-nueva.md`: esqueleto obligatorio y definición de terminado de una app nueva.
- `references/roles-agentes.md`: Claude, Codex, DSH y standards-reviewer como implementadores o revisores adversariales.
- `BRIEF.md`: resumen que se inyecta al arrancar cada sesión de los cinco asistentes.
- `stacks/laravel.md`: adaptación para Laravel 11, Livewire 3 y PHP 8.2+.
- `stacks/django.md`: adaptación para Django y DRF.
- `stacks/go.md`: adaptación para Go.
- `stacks/wordpress.md`: adaptación para WordPress.
- `stacks/scripts.md`: adaptación para bash y Python sueltos.
- `stacks/nextjs.md`: adaptación para Next.js (App Router), React, TypeScript y Node.
- `stacks/postgres.md`: esquema, migraciones, roles y permisos por fila en PostgreSQL; se combina con el stack de la app.
