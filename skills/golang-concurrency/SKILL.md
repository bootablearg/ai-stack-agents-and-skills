---
name: golang-concurrency
description: "[Go] Patrones estructurales de concurrencia en Go — errgroup, worker pools, fan-in/fan-out, pipelines, prevención de goroutine leaks y el memory model (happens-before). Usar al escribir o revisar código Go con goroutines, channels o estado compartido; al paralelizar trabajo (N ítems, llamadas externas, importación por lotes); o cuando aparezcan las palabras worker pool, errgroup, pipeline, deadlock o race condition. Es el destino de las remisiones a concurrencia de golang-safety. No cubre defectos no concurrentes como nil panics o aliasing de slices (→ golang-safety), ni vulnerabilidades explotables (→ golang-security)."
license: MIT
---

> ## 🇦🇷 Skill armado para este host — leer antes de usar
>
> **Qué es.** Los patrones de concurrencia que evitan goroutine leaks, deadlocks y races:
> `errgroup`, worker pool, fan-in/fan-out, pipeline, y el memory model que explica por qué
> cada uno garantiza lo que promete.
>
> **Para qué está acá.** Por dos razones distintas, y la segunda es la fuerte:
>
> 1. **`golang-safety` lo necesita.** Remite a un `golang-concurrency` **cuatro veces** —en
>    su `description`, en *Map concurrent access*, en *Goroutine leaks* y en sus
>    cross-references—. Hasta el 2026-09-11 esas remisiones apuntaban al vacío: el lector
>    quedaba sin el material justo donde el skill decía "esto se explica en otro lado".
> 2. **el proyecto de referencia casi no tiene concurrencia propia hoy** — medido el 2026-09-11:
>    **1 `go func(`** (la baja ordenada del servidor), 0 `errgroup`, 0 `sync.Mutex`, 0
>    `sync.WaitGroup` y 1 `chan` (la señal de SIGTERM). Está acá para cuando eso cambie: la
>    API de ingesta de laboratorios y la carga por lotes del importador son los dos lugares
>    donde va a aparecer primero.
>
> **De dónde salió.** Lo generó **Claude en la interfaz de chat** (no agéntica) a pedido
> del usuario, y él lo entregó el 2026-09-11 en `temp/skils_golang/`. Es material propio del host:
> no hay licencia de terceros que acreditar. El contenido se reescribió acá — se sacó lo que
> ya cubren los skills instalados y se ancló al proyecto.
>
> 🪤 **Que lo haya escrito un modelo sin acceso al código importa al leerlo.** El texto
> original describía buenas prácticas generales, sin poder verificar ninguna contra este
> proyecto; de los siete candidatos del mismo paquete, uno afirmaba que un panic en un
> handler tumba el proceso, cuando `net/http` lo recupera por conexión. Lo que está acá se
> contrastó contra el repo, pero **si encontrás una afirmación que no se sostiene, revisala
> contra el código y corregila**: este archivo no es una fuente primaria.
>
> **Qué se le sacó por duplicado.** La sección de `go test -race` como herramienta: eso ya
> está en `golang-security` (*Security Testing*), y la tabla de comportamiento de un channel
> nil está en `golang-safety`. Acá se remite, no se repite.
>
> **🪤 No le agregues la clave `paths:` al frontmatter.** Claude Code descarta el skill
> entero si está presente, sin aviso. Es lo que tuvo invisibles a los cuatro skills de Go
> desde el 2026-09-10 hasta el 2026-09-11.

**Persona:** sos un ingeniero Go que ya depuró un deadlock en producción. Tratás toda
goroutine como un recurso con ciclo de vida: si no sabés cómo termina, es un leak.

## Cuándo usar este skill

- Al paralelizar trabajo: procesar N ítems, llamar a varias APIs, importar por lotes.
- Al revisar código con `go func(` para buscar leaks, deadlocks o estado compartido.
- Cuando haya que coordinar varias goroutines y propagar error y cancelación.

## La regla que ordena todo lo demás

**Toda goroutine tiene que tener una forma clara de terminar, escrita en el código.** Si
una función lanza una goroutine, el que la lee tiene que poder responder *cuándo termina y
quién la corta*. Una goroutine bloqueada para siempre en un `send` o un `receive` no
aparece en ningún log, no rompe ningún test y se acumula hasta que el proceso se queda sin
memoria.

De ahí salen las dos obligaciones concretas:

1. Toda goroutine que pueda bloquearse en un channel lleva **también** un
   `case <-ctx.Done():` en su `select`.
2. La cancelación se propaga con `context.Context`, nunca con un `bool` compartido — un
   flag booleano leído desde otra goroutine es, además, una race.

## `errgroup` — la forma correcta de manejar un grupo

`golang.org/x/sync/errgroup` resuelve el caso más común: lanzar N goroutines, esperarlas a
todas, y si alguna falla, cancelar el resto y devolver el primer error.

```go
g, ctx := errgroup.WithContext(ctx)

for _, u := range urls {
    g.Go(func() error {
        return procesar(ctx, u)   // el ctx del grupo: se cancela solo si alguna falla
    })
}
if err := g.Wait(); err != nil {
    return err
}
```

Reemplaza al combo manual `sync.WaitGroup` + channel de errores + cancelación a mano, que
es donde aparecen los bugs. **`g.SetLimit(n)`** acota cuántas corren a la vez, que es lo
que hace falta cuando el recurso escaso es la base o una API con límite.

🪤 **Es una dependencia nueva.** `golang.org/x/sync` no está en el `go.mod` de el proyecto, que hoy
tiene **cuatro** dependencias directas. Sumarla es una decisión, no un detalle de
implementación: se propone y se espera el sí, como cualquier cambio (Regla #1).

## Worker pool — cuándo, y el bug clásico

Se usa cuando la cantidad de tareas es grande o desconocida —lanzar una goroutine por tarea
sin techo agota memoria y descriptores— o cuando hay un recurso limitado que proteger: el
pool de conexiones de la base, el rate limit de un servicio externo.

```go
func pool(ctx context.Context, trabajos <-chan Trabajo, n int) <-chan Resultado {
    salida := make(chan Resultado)
    var wg sync.WaitGroup

    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for t := range trabajos {
                select {
                case salida <- procesar(t):
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    go func() { wg.Wait(); close(salida) }()   // ← el punto clave
    return salida
}
```

**El `close(salida)` va en una goroutine aparte que espera el `wg.Wait()`.** Cerrarlo antes
de que todos los workers terminen es `panic: send on closed channel`, y es el error más
repetido del patrón. La regla general: **cierra el que escribe, nunca el que lee**.

## Fan-out, fan-in y pipeline

- **Fan-out:** varias goroutines leyendo del *mismo* channel de entrada. Es lo que hace el
  pool de arriba.
- **Fan-in:** juntar varias salidas en un channel único, con un `WaitGroup` que lo cierra
  cuando la última fuente terminó.
- **Pipeline:** cada etapa recibe un channel y devuelve otro, y **cierra el suyo** al
  terminar. Eso es lo que permite encadenar `etapa3(etapa2(etapa1(entrada)))` sin
  coordinación externa.

```go
func etapa(ctx context.Context, entrada <-chan int) <-chan int {
    salida := make(chan int)
    go func() {
        defer close(salida)
        for v := range entrada {
            select {
            case salida <- v * v:
            case <-ctx.Done():
                return
            }
        }
    }()
    return salida
}
```

## Memory model — lo mínimo para no memorizar recetas

La regla central: **sin un `happens-before` establecido explícitamente** —por un channel,
un mutex o `sync/atomic`— **no hay ninguna garantía** de que una goroutine vea lo que
escribió otra, aunque "en la práctica funcione" en tu máquina. Dos consecuencias que se
ven seguido:

- Un `sync.WaitGroup` sincroniza **la espera, no la memoria**: por sí solo no alcanza para
  compartir datos. Hay que proteger el dato igual.
- Una variable leída y escrita desde dos goroutines sin mutex, channel ni atomic **es una
  race**, aunque el resultado se vea bien en veinte corridas.

Las races no fallan de forma consistente: por eso `go test -race` se corre siempre, no
sólo cuando algo se rompe. El detalle de la herramienta está en `golang-security`, sección
*Security Testing*.

## Lo que ya está en otro skill

| Tema | Dónde |
|---|---|
| `go test -race`, races como vulnerabilidad (TOCTOU) | `golang-security` |
| Comportamiento de un channel, map o slice **nil** | `golang-safety` |
| Map accedido concurrentemente, leaks desde la mirada defensiva | `golang-safety` remite acá; el patrón está arriba |
| `defer` dentro de un loop | `golang-safety` |
| Transacciones y pool de conexiones de la base | `golang-database` |

## Formato de revisión

```
[archivo:línea] <problema de concurrencia>
Riesgo: <goroutine leak | race | deadlock | send on closed channel>
Corrección: <código concreto>
```

## Referencias

- `go.dev/ref/mem` — el memory model oficial.
- `pkg.go.dev/golang.org/x/sync/errgroup`
- "Concurrency in Go", Katherine Cox-Buday.
