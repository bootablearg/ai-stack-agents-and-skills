# App nueva — nace con el estándar puesto

Una aplicación nueva no tiene deuda que pagar: arranca en la etapa 7 del plan de calidad.

## Antes de la primera línea de código

1. **Stack cubierto.** Si no existe `stacks/<stack>.md` en este skill, se crea antes de
   escribir código: layout, regla de dependencia, errores y las tres herramientas de
   `toolchain.md`. Si el stack tiene skills propios (`golang-*`, `laravel-*`, `django-*`),
   se citan en ese archivo. Un stack nuevo exige actualizar `TOOLS_INVENTORY.md` y correr
   `scripts/gen-catalogs.sh`.
2. **Nivel declarado** con la tabla del `SKILL.md` y la declaración de 5 líneas.
3. **Proyecto registrado**: cabecera del `projectbrief.md` y `gen-proyectos.py`.

## Esqueleto obligatorio (primer commit)

| Pieza | Contenido mínimo |
|---|---|
| Formato y análisis | Config del formateador y del analizador del stack, en modo estricto, sin baseline |
| Tipos | Modo estricto del lenguaje (`strict_types`, `mypy --strict`, TS `strict`) |
| Capas | Regla de dependencia forzada por herramienta si es N3 |
| Tests | Un test de dominio y uno de caso de uso con puerto fake |
| Pipeline | formato → análisis → tests → vulnerabilidades → build → deploy dev; prod por botón |
| Versión | Etiqueta `v0.1.0`; el pipeline calcula la siguiente `vX.Y.Z` al publicar |
| Secretos | gitleaks en el pipeline; ninguna credencial en el repo |

## Definición de terminado

Una función nueva está terminada cuando pasa la puerta de calidad del `SKILL.md`, tiene sus
tests, y el pipeline la llevó a dev. "Anda en mi máquina" no cuenta.
