# WordPress

## Estructura

- Plugins y temas con namespaces y clases.
- Registro de hooks separado de la lógica.
- Templates sin lógica de negocio.
- Acceso a datos encapsulado.
- Escape y sanitización en los límites.

## Hooks

El hook registra la entrada y delega.

```php
add_action('init', [PluginHooks::class, 'register']);
```

La clase que ejecuta la regla no debería depender de globals de WordPress salvo que sea un adaptador.

## Templates

Un template muestra datos ya preparados. No consulta, no decide reglas, no escribe.

## Datos

Encapsulá `WP_Query`, opciones, post meta y llamadas a APIs en clases dedicadas cuando la lógica crece.

## Seguridad en límites

- Sanitizá entrada con funciones de WordPress.
- Escapá salida según contexto: HTML, atributo, URL o JS.
- Verificá nonces y capabilities en acciones.

## Herramientas

- PHPCS con WordPress Coding Standards.
- PHPStan con `szepeviktor/phpstan-wordpress`.
