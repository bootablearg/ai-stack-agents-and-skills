# Design Patterns

Usá un patrón sólo cuando puedas nombrar la fuerza concreta que lo justifica.

| Patrón | Fuerza que lo justifica | Señal de abuso | Ejemplo mínimo |
|---|---|---|---|
| Strategy | Variantes intercambiables de una regla. | Una sola implementación sin crecimiento esperado. | `tax = tax_strategy.calculate(order)` |
| Factory method/simple | Creación con decisión encapsulada. | Factory que sólo llama `new`. | `GatewayFactory.from_config(config)` |
| Adapter | Aislar SDK, API o contrato externo. | Adaptar una clase propia sin cambio de contrato. | `MailerAdapter.send(message)` |
| Decorator | Agregar comportamiento sin tocar el objeto base. | Capas de wrappers que ocultan el flujo. | `CachedRatesProvider(provider)` |
| Observer/eventos de dominio | Efectos secundarios desacoplados. | Lógica central escondida en listeners. | `UserRegistered` dispara email. |
| Command/Action | Una operación de aplicación con entrada clara. | Clases `Action` para getters triviales. | `CreateInvoiceAction.execute(input)` |
| Template Method | Pasos fijos con variantes acotadas. | Herencia profunda para evitar funciones. | `Importer.run()` define leer, validar, guardar. |
| Facade | Simplificar un subsistema estable. | Ocultar dependencias globales mutables. | `BillingFacade.charge(order)` |
| Builder | Construcción compleja o testeable. | Builder para dos campos obligatorios. | `ReportBuilder().with_period(period).build()` |
| Null Object | Evitar condicionales repetidos ante ausencia válida. | Tapar errores reales. | `NoopLogger.info(message)` |
| Repository | Aislar persistencia cuando el dominio lo necesita o hay más de una fuente. | Envolver un ORM Active Record por defecto. | `CustomerRepository.find_active(id)` |
| Specification | Reglas combinables y testeables. | Predicados simples sin reutilización. | `IsEligible.and_(HasCredit)` |
| Pipeline/Chain of Responsibility | Pasos ordenados y extensibles. | Flujo lineal fijo que una función expresa mejor. | `pipeline.handle(request)` |

## Advertencia sobre ORM Active Record

No envuelvas Eloquent, Django ORM u otro Active Record en un Repository genérico por defecto. Usá Repository cuando el dominio necesita aislarse de la persistencia, cuando hay más de una fuente de datos o cuando querés testear casos de uso sin el ORM.

## Ejemplo

Malo, cuando la implementación sólo reenvía a Eloquent y nadie la reemplaza:

```php
interface UserRepository {
    public function find(int $id): User;
}
```

Bueno cuando hay aislamiento real:

```php
interface ExchangeRateProvider {
    public function currentRate(CurrencyPair $pair): Rate;
}
```

## Antipatrones

- God object: concentra reglas, I/O y coordinación.
- Service Locator: esconde dependencias y complica tests.
- Singleton con estado global: acopla ejecución, orden y tests.
- Anemic domain: reglas de negocio dispersas en servicios cuando el dominio tiene invariantes.
- Herencia profunda: obliga a navegar muchas capas para entender una operación.
