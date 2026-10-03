---
name: golang-observability
description: "[Go] Observabilidad de un servicio Go — logging estructurado con log/slog, qué registrar en cada camino de falla, correlación por request, y cuándo recién corresponde sumar métricas o tracing. Usar al escribir o revisar un handler, un camino de error, o cualquier código que hoy loguee con log.Printf o fmt.Println; y siempre antes de dar por cerrado un defecto que 'no dejaba nada en el log'. No cubre qué NO registrar por seguridad —PII, tokens, log injection— que está en golang-security."
license: MIT
---

> ## 🇦🇷 Skill armado para este host — leer antes de usar
>
> **Qué es.** Cómo se instrumenta un servicio Go para que un defecto en producción sea
> diagnosticable: `log/slog`, qué deja registrado cada camino de falla, y el orden en que
> conviene sumar métricas y trazas — si es que corresponde.
>
> **Para qué está acá.** Por un defecto real, no por completitud. El 2026-09-11, en un
> servicio Go en producción, la subida de KYC guardaba 0 filas **y no dejaba nada en el log**.
> Encontrar la causa —una columna `NOT NULL` sin default— llevó una sesión entera, y el
> tiempo se fue en que el handler devolvía todos sus errores a la pantalla del usuario y no
> registraba ninguno. El defecto de fondo no era el `INSERT`: era que nadie se enteraba.
>
> Lo que mide el proyecto al 2026-09-11: **0 usos de `slog`**, 51 `log.Print`/`log.Fatal` y
> 31 `fmt.Print`. El hueco es el más barato de tapar de todos los pendientes.
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
> **Qué se le sacó por duplicado.** La sección "nunca loguear datos sensibles": eso ya está
> en `golang-security`, `references/logging.md`, con PII, log injection y filtración de
> internals en los mensajes de error. Acá se remite, no se repite.
>
> **🪤 Métricas y trazas están al final y marcadas.** Prometheus y OpenTelemetry **no
> aplican hoy** en el proyecto y el skill lo dice en su propia sección: tres servicios en un host,
> sin microservicios, con el monitoreo ya resuelto afuera (Grafana + InfluxDB). Quedan
> documentados para el día que la API de laboratorios convierta esto en varios servicios
> hablando entre sí. **No propongas instrumentar con OTel un servicio que no lo necesita.**
>
> **🪤 No le agregues la clave `paths:` al frontmatter.** Claude Code descarta el skill
> entero si está presente, sin aviso.

**Persona:** sos quien va a estar a las dos de la mañana leyendo el log de este servicio.
Escribís pensando en esa persona, que no tiene el código a la vista ni el navegador del
usuario que se quejó.

## La regla dura

**Todo camino de falla deja registro.** Si una función puede devolver un error, el lugar
donde ese error se convierte en respuesta al usuario tiene que registrarlo antes. Mostrarle
el problema a quien lo provocó **no es registrarlo**: el usuario ve "no se pudo guardar",
cierra la pestaña, y del lado del servidor no queda nada.

El anti-patrón exacto, tal como estaba en el proyecto:

```go
// ✗ El error muere en la pantalla del usuario
if err := kyc.Guardar(ctx, db, anillo, s.CuentaID, storage, tipo, f); err != nil {
    mostrar(w, r, s, err.Error(), "atencion")
    return
}

// ✓ Queda registro, y el usuario sigue viendo un mensaje entendible
if err := kyc.Guardar(ctx, db, anillo, s.CuentaID, storage, tipo, f); err != nil {
    slog.Error("kyc: no se pudo guardar la evidencia",
        "error", err, "tipo", tipo, "cuenta", s.CuentaID)
    mostrar(w, r, s, "No se pudo guardar el documento.", "atencion")
    return
}
```

🪤 Dos cosas del ejemplo, las dos deliberadas: al usuario **no** se le muestra `err.Error()`
—puede filtrar el nombre de una columna o de una tabla, ver `golang-security`— y el log
lleva el identificador de la cuenta, no el nombre ni el email de la persona.

## `log/slog` — desde Go 1.21 está en la stdlib

No hace falta zap ni logrus. En un proyecto con cuatro dependencias directas, sumar una
librería de logging sería el peor cambio de relación costo/beneficio disponible.

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
slog.SetDefault(logger)

slog.Info("sesión iniciada", "cuenta", idHex, "rol", rol, "ms", tomo.Milliseconds())
```

Las reglas, en orden de lo que más duele cuando falta:

1. **Campos estructurados, no interpolación.** `"cuenta", id` y no
   `fmt.Sprintf("cuenta %s", id)`. Un log interpolado no se puede filtrar ni agrupar; uno
   estructurado, sí — y acá el agregador ya existe (Loki, en el servidor de monitoreo).
2. **Nivel correcto.** `Error` es algo que alguien tiene que mirar; `Warn` es algo raro que
   siguió funcionando; `Info` es el hilo normal de la operación. Si todo es `Error`, nada lo
   es.
3. **Un identificador que permita seguir el hilo.** Con `slog` eso se hace con
   `logger.With("request", id)` una vez, y todos los mensajes de esa request lo llevan.
4. **`stdout`, y que systemd se ocupe.** Los tres servicios corren bajo systemd: escribir a
   `stdout` alcanza para que quede en el journal, y de ahí sale a donde haga falta. No hay
   que abrir archivos de log ni rotarlos a mano.

### Salir de `log.Printf` sin romper nada

`log.Printf` y `fmt.Println` siguen funcionando: `slog` no los rompe. La migración es por
archivo y por necesidad, no una tanda de 82 cambios de una vez. **El orden que rinde:**
primero los caminos de falla que hoy no registran nada (los handlers), después el arranque
y la baja de cada servicio, y al final lo cosmético. `fmt.Print` dentro de un comando de
línea (`cmd/verificar`, `cmd/importador`) **está bien y se queda**: eso es la salida del
programa para quien lo corre, no el log de un servicio.

## Qué registrar en un servicio como éste

| Momento | Nivel | Qué tiene que estar |
|---|---|---|
| Arranque | `Info` | Nombre del servicio, versión, commit, puerto |
| Falla al guardar o leer datos | `Error` | La operación, el error real, el identificador opaco de la cuenta |
| Rechazo de autorización | `Warn` | Quién pidió qué y por qué se rechazó — es el rastro de un intento |
| Baja ordenada | `Info` | Que empezó, y que terminó |
| Panic recuperado | `Error` | El valor del panic y el stack |

🪤 **Esto no reemplaza a `interno/auditoria`.** Son dos cosas distintas y las dos hacen
falta: la auditoría es un registro **de negocio**, con valor legal, que vive en la base y
dice quién vio la historia clínica de quién. El log es **operativo**, es efímero y sirve
para diagnosticar. Un `slog.Error` no es un evento de auditoría, y un evento de auditoría
no reemplaza al log.

## Lo que ya está en otro skill

| Tema | Dónde |
|---|---|
| PII, tokens y passwords en el log; log injection; errores que filtran internals | `golang-security`, `references/logging.md` |
| Errores envueltos con `%w`, `errors.Is` / `errors.As` | `golang-safety` |
| Qué registrar de una transacción que vuelve atrás | `golang-database` |

## Métricas y trazas — no aplican hoy, y cuándo sí

**Prometheus (`client_golang`)** expone contadores, histogramas y gauges en `/metrics`.
**OpenTelemetry** encadena spans entre servicios para ver una request de punta a punta.
Los dos están bien y los dos **sobran hoy en el proyecto**: son tres servicios en un host, sin
llamadas entre ellos, y el monitoreo de infraestructura ya existe afuera de la aplicación
(Grafana + InfluxDB + Telegraf en el servidor de monitoreo).

**Cuándo dejar de postergarlo:**

- *Métricas*, cuando haga falta alertar sobre **la aplicación** y no sobre la máquina:
  tasa de error por endpoint, latencia p95, cuántas cargas de estudio fallan por día.
- *Trazas*, recién cuando la API de ingesta de laboratorios haga que una operación cruce
  más de un servicio y "algo anda lento" deje de contestarse leyendo un log.

Si ese día llega, dos advertencias que se pagan caro: **la cardinalidad mata a Prometheus**
—nunca un `user_id`, una IP o un timestamp como etiqueta— y **instrumentar los bordes
primero** (entrada HTTP, base, servicios externos), que es donde está casi todo el valor.

## Formato de revisión

```
[archivo:línea] <camino de falla sin registro / log no estructurado>
Impacto: <qué sería imposible diagnosticar sin esto>
Corrección: <la línea de slog concreta, con sus campos>
```

## Referencias

- `pkg.go.dev/log/slog`
- `go.dev/blog/slog` — el porqué del diseño.
