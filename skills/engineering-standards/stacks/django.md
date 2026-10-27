# Django

Aplicar a Django y Django REST Framework.

## Ubicación

- Apps por contexto acotado.
- `services.py`: operaciones de escritura y casos de uso.
- `selectors.py`: consultas de lectura.
- Vistas y serializers DRF: entrada/salida sin lógica de negocio.
- Modelos: invariantes propias del dominio y comportamiento cercano a los datos.
- Signals: sólo para desacoplar apps. Nunca para lógica central.
- Settings: separados por ambiente.

## Regla práctica

Un serializer valida forma. Un service decide la operación. Un selector concentra lecturas complejas.

## Ejemplo

```python
def create_invoice(*, customer_id: int, items: list[InvoiceItemInput]) -> Invoice:
    customer = get_customer_for_update(customer_id)
    invoice = Invoice.create_for(customer=customer, items=items)
    invoice.full_clean()
    invoice.save()
    return invoice
```

## Signals

Usalos para efectos secundarios entre apps, como invalidar cache o emitir un evento. Si entender el flujo principal exige leer signals, la lógica está escondida.

## Herramientas

- `ruff`: lint y formato.
- `mypy` con `django-stubs`: `--strict` en código nuevo y en cada módulo ya normalizado; el resto, progresivo por módulo.
- `ruff` con las reglas `UP` (pyupgrade): modernización.
- `import-linter`: contratos entre apps y capas.

## Contrato import-linter

```ini
[importlinter]
root_package = app

[importlinter:contract:domain_does_not_import_web]
name = domain does not import web
type = forbidden
source_modules =
    app.billing.domain
forbidden_modules =
    django.http
    rest_framework
```
