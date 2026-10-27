# Roles — quién implementa, quién revisa

Cuatro actores. **Quien implementa un lote nunca lo revisa.**

| Actor | Rol por defecto | Cuándo cambia |
|---|---|---|
| **Claude** | Plan, criterio, diseño (SOLID, patrones, Clean Architecture del dominio crítico) y auditoría final de todo lo que entra | Nunca delega la auditoría |
| **Codex** | Implementador de lotes mecánicos (formato, renombres, normalización repetitiva, tests de caracterización con plantilla dada) | Sin cuota → DSH implementa y Codex no participa |
| **DSH** | Revisor adversarial de lo que implementó Codex | Si DSH implementó, revisa Codex (`codex exec -s read-only`) |
| **standards-reviewer** | Puerta del estándar en cambios N2/N3 | — |

Para código con datos de salud, sumar `healthcare-reviewer`; para auth, pagos o datos
personales, la revisión adversarial es obligatoria aunque el cambio lo haya hecho Claude.

## Cómo se le pasa un lote a cada uno

Todo encargo abre con un párrafo de autorización explícita (si no, el agente aplica la
Regla #1 y termina pidiendo un "sí"), carga este skill y trae la declaración de 5 líneas.

```bash
# Codex implementa. Sin `< /dev/null` queda colgado leyendo stdin.
$AISTACK_HOME/scripts/ai-start.sh codex --rw "<encargo>" < /dev/null

# DSH revisa. No tiene sandbox de sólo lectura: corre sobre una copia con git
# y después se mira `git status` para confirmar que no escribió.
dsh headless - < pedido.md > respuesta.md 2> diagnostico.log

# Codex revisa en sólo lectura.
codex exec -s read-only --skip-git-repo-check "<pedido de revisión>" < /dev/null
```

## Qué pide una revisión adversarial

- Buscar cómo el lote **cambia comportamiento**: ramas alteradas, errores tragados,
  orden de efectos, valores por defecto, nulos, zonas horarias, redondeo.
- Citar `archivo:línea` y el escenario concreto que falla.
- No proponer estilo: eso lo cubre el formateador.
- No escribir archivos.

## Auditoría de Claude (siempre)

1. Lee una muestra del lote y **todo** lo que la revisión marcó.
2. Corre la puerta por commit (`plan-de-calidad.md`).
3. Verifica el estado real, no el código de salida.
