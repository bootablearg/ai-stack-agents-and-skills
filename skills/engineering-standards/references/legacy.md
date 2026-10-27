# Legacy

## Regla base

Todo código nuevo cumple el estándar. En código existente se mejora sólo lo que la tarea toca: función, clase, módulo o archivo autorizado.

## Boy scout acotado

Dejá mejor el área editada sin ampliar el alcance. Cambios válidos:

- Renombrar variables locales confusas.
- Extraer una función dentro del mismo archivo si reduce riesgo.
- Borrar código muerto reemplazado por el cambio.
- Agregar manejo de error explícito en el flujo tocado.
- Agregar tests de la regla modificada.

## Alcance

No extiendas cambios a módulos vecinos porque viste deuda técnica. Listalos como fuera de alcance y proponé un plan separado si bloquean el trabajo.

## Refactor mayor

Un refactor mayor requiere plan aparte y autorización explícita. Incluye mover capas, introducir puertos, separar módulos, cambiar persistencia o reemplazar patrones de framework.

## Comportamiento

Nunca mezcles refactor y cambio de comportamiento en el mismo commit. Si hace falta hacer ambos, primero tests de caracterización, después refactor, después cambio funcional.

## Tests de caracterización

Antes de refactorizar algo sin tests, capturá el comportamiento actual.

```python
def test_legacy_discount_keeps_current_rounding():
    assert calculate_discount(101) == 10
```

El test puede revelar una regla fea, pero sirve como cinturón antes de mover código.
