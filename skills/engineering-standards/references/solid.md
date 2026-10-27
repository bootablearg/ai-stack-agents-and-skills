# SOLID

## S: Single Responsibility Principle

Qué dice: una unidad cambia por una sola razón.

Señal de violación: una clase cambia cuando cambia el formato de entrada, una regla de negocio y el mecanismo de persistencia.

Corrección: separá parsing, regla y salida.

Sobreingeniería: partir una función simple N1 en varias clases sin estado ni reutilización.

## O: Open/Closed Principle

Qué dice: el comportamiento debe poder extenderse sin modificar código estable.

Señal de violación: cada nuevo método de pago agrega otro `if` en el mismo flujo crítico.

Corrección: extraé una estrategia y registrá implementaciones.

Sobreingeniería: crear un plugin system para dos variantes que no van a crecer.

## L: Liskov Substitution Principle

Qué dice: una implementación debe poder reemplazar su contrato sin romper expectativas.

Señal de violación: una subclase lanza `NotSupported` en métodos obligatorios o cambia precondiciones.

Corrección: achicá el contrato o separá capacidades.

Sobreingeniería: jerarquías abstractas cuando composición o una función alcanzan.

## I: Interface Segregation Principle

Qué dice: quien consume no debe depender de métodos que no usa.

Señal de violación: una implementación vacía métodos sólo para cumplir una interfaz grande.

Corrección: definí interfaces chicas del lado consumidor.

Sobreingeniería: una interfaz por cada clase concreta sin consumidor real.

## D: Dependency Inversion Principle

Qué dice: el código de alto nivel depende de abstracciones, y los detalles dependen de esas abstracciones.

Señal de violación: casos de uso que importan SDKs, ORM, HTTP o filesystem.

Corrección: definí un puerto en la capa de aplicación y pasá el adaptador por constructor o parámetro.

Sobreingeniería: introducir contenedores, factories e interfaces en scripts N1.

## Ejemplo mínimo

Malo:

```python
def notify_user(user):
    smtp = SmtpClient()
    smtp.send(user.email, "Alta completa")
```

Bueno:

```python
class Notifier:
    def __init__(self, mailer):
        self.mailer = mailer

    def notify_user(self, user):
        self.mailer.send(user.email, "Alta completa")
```
