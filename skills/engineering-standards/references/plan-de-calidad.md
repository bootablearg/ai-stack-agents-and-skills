# Plan de calidad — normalización integral sin cambio de comportamiento

Plantilla para llevar una aplicación existente al estándar. Se instancia por proyecto en
`{proyecto}/memorias/AAAA_MM_DD_plan_calidad_codigo.md` y cada etapa necesita su propio "sí".

## Invariantes (rigen en todas las etapas)

1. **Un refactor no cambia comportamiento.** Un bug encontrado se anota y se arregla en un
   commit aparte. Si algo cambia después de un refactor, el refactor se revierte sin discutir.
2. **Primero el test, después el cambio.** Lo que no tiene cobertura recibe tests de
   caracterización que fijan lo que hace hoy, defectos incluidos.
3. **Expandir → migrar → contraer.** Lo nuevo convive con lo viejo, los consumidores pasan de
   a uno y lo viejo se borra al final. En cualquiera de los tres estados el sistema funciona.
4. **Sin cambios de esquema** salvo que la etapa lo declare y tenga su propio "sí".
5. **Commits chicos y reversibles**: cada uno se deshace con `git revert`.
6. **Cada etapa deja el sistema desplegable.**
7. **Batch mecánico → implementador; criterio → Claude; todo lote → revisor adversarial.**
   Ver `roles-agentes.md`.

## Etapas

| # | Etapa | Qué | Puerta de salida |
|---|---|---|---|
| 0 | Línea de base | Medir cobertura por módulo, hallazgos del analizador, tiempos del pipeline. Sin tocar código. | Números escritos en el plan |
| 1 | Herramientas | Formateador, analizador y modernizador del stack (`toolchain.md`) en el pipeline, con versión fija. Puerta sólo para lo nuevo. Un commit de formato. | Pipeline verde |
| 2 | Red de caracterización | Tests de los módulos sin cobertura; fotos (golden) del HTML de cada pantalla y de las salidas de los procesos críticos; cobertura que no puede bajar (ratchet). | Fotos y suite en verde |
| 3 | Normalización mecánica | Clean Code: nombres, errores explícitos, sin números mágicos, funciones y archivos partidos, logging estructurado. Módulo por módulo hasta analizador en cero; ahí la puerta cubre todo. | Analizador en 0 en el módulo |
| 4 | SOLID y patrones | Dependencias inyectadas, interfaces del lado consumidor, I/O fuera de la lógica. Cada patrón declara su fuerza. | `standards-reviewer` APRUEBA |
| 5 | Clean Architecture en el dominio crítico | Entidades y objetos de valor puros, casos de uso, puertos y adaptadores, entrada delgada. Regla de dependencia forzada por herramienta (depguard / deptrac / import-linter). | `standards-reviewer` + revisión adversarial |
| 6 | Actualización del framework | Runtime y framework a la última estable, modernizador, dependencias de a una. Las abandonadas se evalúan aparte. | Suite completa en verde |
| 7 | CI/CD y versión | Etapas de formato, análisis y cobertura en el pipeline; deploy sólo por pipeline; versión `vX.Y.Z` automática con release notes. | Pase a producción con etiqueta nueva |

## Dominio crítico

Es lo que, si falla, daña a una persona o a la plata: datos clínicos, autorización, cobros,
identidad. Se declara en el plan del proyecto. Fuera de él rige N2 y la regla del boy scout.

## Puerta por commit

Formateador limpio · analizador sin hallazgos nuevos · suite completa en verde · prueba de
humo de lo tocado · revisión adversarial del lote si lo implementó otro agente.
