---
name: protocol-end
description: Protocolo de cierre de tarea del .ai-stack. Se invoca como @protocol-end cuando el usuario confirma que una tarea terminó. Documenta la sesión en los cuatro destinos (bitácora del proyecto, memory-bank, Memory Vault y handoff) sin reescribir archivos, agregando sólo lo nuevo. Usar cuando el usuario dice "listo", "terminamos", "cerrá la tarea", "@protocol-end", o cuando detectes fin de tarea y quieras ofrecer el cierre.
---

# @protocol-end — cierre de tarea

Contraparte de `@protocol-enforce`. Aquel abre la tarea; este la cierra. Sin cierre, el
conocimiento queda sólo en la sesión y se pierde al terminar.

## Cuándo se ejecuta

**Sólo con confirmación explícita del usuario.** Dos vías:

1. El usuario lo pide: `@protocol-end`, "listo", "terminamos", "cerrá la tarea".
2. Vos detectás fin de tarea y **ofrecés** cerrar: *"¿Cierro con @protocol-end?"*.
   No cierres por tu cuenta — una tarea a medias documentada como terminada es peor que
   no documentarla.

No lo ejecutes tras cada respuesta, ni tras un cambio suelto. La unidad es **la tarea**.

## Regla de escritura que manda sobre todo lo demás

**Nunca reescribas un archivo existente.** Ni `activeContext.md`, ni `progress.md`, ni
`decisions.md`. Reescribir gasta tokens de lectura y de salida para reproducir contenido
que ya estaba bien, y cada reescritura es una oportunidad de perder información.

- Usá `Edit`, no `Write`, sobre cualquier archivo que ya exista.
- `Write` sólo para archivos nuevos: la bitácora del día.
- Si no encontrás el ancla para el `Edit`, leé el archivo primero; no lo pises.

Cómo se agrega en cada uno:

| Archivo | Dónde entra lo nuevo | Ancla del Edit |
|---|---|---|
| `activeContext.md` | Sección nueva **arriba**, debajo del encabezado | el `>` de la nota de cabecera |
| `progress.md` | Línea o bloque al **final de la sección** que corresponda | `## Hecho` / `## En curso` / `## Pendiente` |
| `decisions.md` | Bloque nuevo al **final** | la última línea del archivo |
| `{proyecto}/memorias/` | Archivo **nuevo** `YYYY_MM_DD_sesion_<tema>.md` | — (es `Write`) |

## Paso 0 — Alcance (no cierres de memoria)

```bash
node $AISTACK_HOME/scripts/hooks/session-scope.js --since "<inicio de la tarea>"
```

Devuelve los archivos tocados agrupados por proyecto y qué destinos tiene cada uno.
Los cambios en `$AISTACK_HOME/` se documentan en el proyecto **`ai-stack`** del
workspace (`$WORKSPACE/ai-stack/`), nunca dentro del cerebro compartido.

Si un proyecto no tiene alguna pieza, el script lo marca en `faltan`. Creala si el
proyecto la necesita, o decilo en el resumen final. No la inventes en silencio.

## Paso 1 — Clasificar qué se produjo

Preguntas, en orden. Cada "sí" habilita un destino:

1. ¿Hay un **relato** de sesión que valga (qué se hizo, qué se probó, qué se descartó)? → bitácora
2. ¿Cambió el **estado** del proyecto? → `activeContext.md` + `progress.md`
3. ¿Se tomó una **decisión** de arquitectura o de política? → `decisions.md`
4. ¿Apareció un **gotcha, runbook o dato atómico** que otro asistente debería encontrar
   buscando? → Memory Vault
5. ¿Queda **trabajo a medias** para otro asistente? → handoff
6. ¿Apareció una **preferencia o corrección del usuario** sobre cómo trabajar? → auto-memoria
   (`~/.claude/projects/<slug>/memory/`) y, si aplica a los 4 asistentes, al Vault

Si una respuesta es "no", ese destino se salta. Un cierre honesto de tres destinos vale
más que uno completo con relleno en los seis.

## Paso 2 — Escribir

### Bitácora — `{proyecto}/memorias/YYYY_MM_DD_sesion_<tema>.md`

Archivo nuevo. Estructura mínima:

```markdown
# <Título de la tarea> — YYYY-MM-DD

## Qué se pidió
## Qué se hizo
## Cómo se verificó
## Qué NO se hizo (y por qué)
## Pendientes
```

`Cómo se verificó` no es opcional: sin evidencia, la bitácora es una declaración de
intenciones. `Qué NO se hizo` evita que la próxima sesión repita un camino descartado.

### memory-bank — `Edit`, nunca `Write`

`activeContext.md`, sección nueva arriba:

```markdown
## Estado al YYYY-MM-DD — <titular en una línea>

Bitácora: `memorias/YYYY_MM_DD_sesion_<tema>.md`.

- <estado concreto, con rutas y comandos verificables>
```

`progress.md`: una línea al final de `## Hecho` (o de la sección que toque).
`decisions.md`: sólo si hubo decisión, bloque nuevo al final con fecha, qué se decidió,
por qué, y qué alternativas se descartaron.

### Memory Vault

```bash
MEM="node $AISTACK_HOME/vendor/ecc-memory-vault/memory.js"
echo "<el dato>" | $MEM save --title "<título>" --kind <runbook|decision|fact|lesson> --stdin
```

**Parate en el directorio del proyecto antes de guardar**: el scope se resuelve por el
CWD. Guardar desde `temp/` manda la memoria al lugar equivocado.

`search` antes de `save`: el vault es create-only. Si corregís algo viejo, guardá uno
nuevo con `--link <id-viejo>`.

Qué NO va al vault: credenciales (van a `credentials/`), documentación viva del proyecto
(va al memory-bank), y relato de sesión (va a la bitácora).

### Handoff — sólo si queda trabajo a medias

```bash
echo "<qué hice, qué falta, qué mirar, qué NO probar>" \
  | $MEM handoff --from claude --target <codex|gemini|copilot|opencode> --title "<t>" --stdin
```

Un handoff sin "qué falta" concreto no sirve. Incluí las rutas y el estado de
verificación de cada cosa.

## Paso 3 — Verificar

No reportes lo que no comprobaste:

```bash
ls -la {proyecto}/memorias/ | tail -3
$MEM search "<título que guardaste>"
```

Si algo falló, decilo en el resumen. Un cierre que reporta éxito sin escribir es peor
que no cerrar, porque instala confianza falsa.

## Paso 4 — Registrar el cierre

```bash
node $AISTACK_HOME/scripts/hooks/doc-debt.js record-close <proyecto> [<proyecto>...]
```

**Sin esto la deuda nunca se salda** y el aviso va a seguir apareciendo en cada arranque
de cualquier asistente hasta volverse ruido. Registrá sólo los proyectos que documentaste
de verdad: marcar como cerrado algo que no cerraste es peor que no marcar nada.

`node doc-debt.js check` para confirmar que quedó en cero.

Después, regenerar el índice de proyectos (actualiza bitácoras, última fecha y último cierre;
si cambiaste la cabecera de un `projectbrief.md`, también lo toma):

```bash
python3 $AISTACK_HOME/scripts/gen-proyectos.py
```

## Paso 5 — Resumen

Tres líneas: qué se escribió, dónde, y qué quedó pendiente. Sin adorno.

## Anti-patrones

| Anti-patrón | Por qué |
|---|---|
| Reescribir `activeContext.md` entero | Gasta tokens y arriesga perder contenido. `Edit`, siempre |
| Cerrar sin correr `session-scope.js` | Te vas a olvidar un proyecto tocado de refilón |
| Escribir en los 6 destinos siempre | Genera ruido; el memory-bank se vuelve ilegible |
| Documentar en `$AISTACK_HOME/` | Ese path es sólo código. La doc va a `workspace/ai-stack/` |
| Guardar en el vault desde `temp/` | El scope sale mal por el CWD |
| Reportar el cierre sin verificar | Confianza falsa |
| Olvidar el `record-close` | La deuda queda abierta y el aviso se vuelve ruido |
| `record-close` de un proyecto que no documentaste | Apaga el aviso sin resolver nada |

## Deuda de documentación

`doc-debt.js` compara la marca del último cierre de cada proyecto contra el mtime de sus
archivos, y el bloque de deuda se inyecta al arrancar **cualquiera** de los cinco
asistentes (los tres puntos de arranque usan el mismo generador). No depende de ningún
evento de fin de sesión: `SessionEnd` sólo existe en Claude Code, así que atarlo a eso
habría dejado afuera a los otros cuatro.

La marca vive en **`{proyecto}/.agent-zero/last-close.json`**, no en un estado global:
`$AISTACK_HOME/` es sólo conocimiento y no lleva estado de ejecución. Los directorios
que no son proyectos (los que empiezan con punto, `temp`, `credentials`) quedan afuera.

Ignora ruido que cambia solo (`*.log`, `state/`, `cache/`, `*.lock`) y lo que escribe el
propio cierre (`memorias/`, `.agent-zero/`, `.ecc/`), para no reportarse a sí mismo.

```bash
node .../doc-debt.js check      # qué debe documentarse
node .../doc-debt.js status     # marcas de cierre por proyecto
node .../doc-debt.js bootstrap  # línea base (sólo al instalar, o para un proyecto nuevo)
```

Un proyecto sin marca de cierre sólo mira las últimas 36 horas: sin eso, el primer
`check` reporta meses de trabajo viejo y el aviso nace muerto. Se desactiva todo con
`AISTACK_DOCDEBT=0`.
