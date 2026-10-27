# Laravel

Aplicar a Laravel 11, Livewire 3 y PHP 8.2+.

## Ubicación

- Controladores y componentes Livewire: entrada delgada, validan/coordinan y delegan.
- Actions: una clase, un método público, una intención de aplicación.
- Services: coordinación técnica o dominio que no encaja como Action.
- Form Requests: validación de forma.
- Policies: autorización.
- Models: Eloquent, relaciones, casts, scopes y reglas de persistencia cercanas al modelo.
- `app/Contracts`: interfaces para sistemas externos.
- ServiceProvider: binding de interfaces a implementaciones.
- DTO: clases `readonly` para límites claros.
- Enums: enums nativos para estados y opciones cerradas.
- Events/listeners: efectos secundarios desacoplados.
- Jobs: trabajo diferido o costoso.

## Regla práctica

No pongas lógica de negocio en controladores ni componentes Livewire. Un método Livewire puede preparar estado de pantalla, pero la regla vive en una Action, Service, Model o caso de uso.

## Ejemplo de Action

```php
final readonly class PublishPostAction
{
    public function __construct(private SlugGenerator $slugGenerator) {}

    public function execute(Post $post): void
    {
        $post->publish($this->slugGenerator->for($post->title));
        $post->save();
    }
}
```

## Herramientas

- Larastan: subir el nivel de a uno con baseline. Nunca bajar el nivel para ocultar deuda.
- Pint: formato.
- Rector: modernización y actualización de Laravel/PHP; corre en modo `--dry-run` en el pipeline.
- `declare(strict_types=1);` en todo archivo PHP nuevo y en cada archivo que se toque.
- deptrac: controlar dependencias entre capas.

## deptrac sugerido

Las capas siguen las carpetas que Laravel ya tiene. No crees `app/Domain` ni
`app/Infrastructure` en una app existente: eso es un refactor mayor y va por plan aparte.

```yaml
deptrac:
  paths:
    - app
  layers:
    - name: Entrada
      collectors:
        - type: directory
          value: app/(Http|Livewire|Console)/.*
    - name: Aplicacion
      collectors:
        - type: directory
          value: app/(Actions|Services)/.*
    - name: Modelo
      collectors:
        - type: directory
          value: app/(Models|Enums)/.*
    - name: Contratos
      collectors:
        - type: directory
          value: app/Contracts/.*
  ruleset:
    Entrada: [Aplicacion, Modelo, Contratos]
    Aplicacion: [Modelo, Contratos]
    Modelo: [Contratos]
    Contratos: []
```

Arrancá con `deptrac` en modo informe y un baseline, igual que Larastan: primero se congela
la deuda existente y después se impide que crezca.
