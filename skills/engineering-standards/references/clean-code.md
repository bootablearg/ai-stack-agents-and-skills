# Clean Code

## Nombres

Regla: un nombre debe revelar intención, unidad y alcance.

Violación observable: variables como `data`, `tmp`, `x`, `flag` o funciones como `process()` en lógica de negocio.

Malo:

```php
$d = $user->orders()->sum('total');
```

Bueno:

```php
$totalPurchasedAmount = $user->orders()->sum('total');
```

## Funciones

Regla: una función hace una sola cosa en un nivel de abstracción.

Violación observable: una función valida entrada, consulta datos, decide reglas, escribe archivos y envía notificaciones.

Malo:

```python
def import_users(path):
    rows = open(path).read().splitlines()
    for row in rows:
        if "@" not in row:
            print("invalid")
        else:
            database.insert({"email": row})
```

Bueno:

```python
def parse_emails(lines):
    return [line.strip() for line in lines if "@" in line]
```

## Argumentos

Regla: preferí pocos argumentos y objetos con nombre cuando los datos viajan juntos.

Violación observable: llamadas con muchos booleanos o valores posicionales difíciles de leer.

Malo:

```go
CreateUser("ana@example.com", true, false, 3)
```

Bueno:

```go
CreateUser(CreateUserInput{Email: "ana@example.com", SendWelcome: true})
```

## Comentarios

Regla: comentá el porqué, la restricción o la decisión. El qué debe leerse en el código.

Violación observable: comentarios que repiten la línea siguiente.

Malo:

```js
// Incrementa el contador
count++;
```

Bueno:

```js
// El proveedor reintenta sólo respuestas 429, por eso no agrupamos 503 acá.
if (response.status === 429) retry();
```

## Manejo de errores

Regla: no tragues excepciones y no devuelvas `null` cuando corresponde un error explícito.

Violación observable: `catch` vacío, logs sin acción o retornos ambiguos.

Malo:

```php
try {
    $client->send($message);
} catch (Throwable $e) {
    return null;
}
```

Bueno:

```php
try {
    $client->send($message);
} catch (Throwable $e) {
    throw new MessageDeliveryFailed($message->id, previous: $e);
}
```

## Formato

Regla: el formato lo decide la herramienta del proyecto.

Violación observable: discusiones manuales sobre espacios, imports o comillas que el formatter puede resolver.

Malo:

```bash
python script.py   --name ana
```

Bueno:

```bash
ruff format .
```

## Límites

Regla: envolvé APIs de terceros detrás de un adaptador propio cuando el código de negocio depende de ellas.

Violación observable: SDKs externos importados desde reglas de negocio.

Malo:

```python
from vendor_mail import Client

def register_user(user):
    Client().send_welcome(user.email)
```

Bueno:

```python
def register_user(user, mailer):
    mailer.send_welcome(user.email)
```

## Tests F.I.R.S.T.

Regla: los tests deben ser rápidos, independientes, repetibles, auto-verificables y oportunos.

Violación observable: tests que dependen del reloj real, red externa, orden de ejecución o inspección manual.

Malo:

```python
def test_invoice_total():
    print(calculate_total(items))
```

Bueno:

```python
def test_invoice_total():
    assert calculate_total([Item(price=10), Item(price=5)]) == 15
```
