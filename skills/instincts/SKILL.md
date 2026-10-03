---
name: instincts
description: Instintos — reglas de comportamiento aprendidas, con nivel de confianza, que se acumulan por proyecto y globalmente. Usar cuando el usuario te corrige o confirma una forma de trabajar y querés que eso persista ("acordate de que siempre…", "no hagas más X"), cuando arrancás en un proyecto y querés cargar sus reglas tácitas, o cuando querés ver/promover/podar lo aprendido. Es la capa entre una corrección suelta y una regla dura del AGENTS.md.
license: MIT
---

# instincts — Reglas aprendidas con confianza

Motor: **ECC continuous-learning-v2** (MIT) vendorizado en
`$AISTACK_HOME/vendor/ecc-instincts/`. `instinct-cli.py` es **stdlib-only**
(no pide pip install nada).

**Qué resuelve:** entre "el usuario me corrigió una vez" y "es una Regla dura del
`AGENTS.md`" no había nada. Un instinto es esa capa intermedia: una regla con
**confianza numérica**, con **alcance** (este proyecto vs todos), que se puede promover
o descartar con evidencia.

## ⚠️ Cómo está configurado en este nodo (leé esto)

- El **observador en background está DESACTIVADO a propósito** (`config.json`:
  `observer.enabled: false`). En ECC original ese observador lanza un `claude --model
  haiku` cada 5 minutos contra tu transcript — **tokens facturados sin pedirte permiso**.
  Acá no corre. Nada se ejecuta solo.
- **No hay hooks instalados.** Los instintos no se inyectan automáticamente en el
  contexto: los leés vos con este skill cuando arrancás una tarea.
- El resultado: capacidad disponible, **cero cambio en tu flujo actual**.

## Uso

```bash
INS="python3 ${AISTACK_HOME:-$AISTACK_HOME}/vendor/ecc-instincts/scripts/instinct-cli.py"
```

### Ver lo aprendido (hacelo al arrancar en un proyecto)
```bash
$INS status              # todos, con barra de confianza, agrupados por dominio
$INS projects            # qué proyectos tienen instintos registrados
```

### Crear un instinto
No hay comando `add`: un instinto **es un archivo markdown**. Escribilo vos.

- **Global** (aplica a todo) → `~/.local/share/ecc-homunculus/instincts/personal/<id>.md`
- **De proyecto** → `~/.local/share/ecc-homunculus/projects/<hash>/instincts/personal/<id>.md`
  (el `<hash>` te lo dice `$INS status`; sale del git remote, sin credenciales)

```markdown
---
id: contraste-nunca-minimo
trigger: "when styling pills, badges, chips or buttons"
confidence: 0.85
domain: "design"
source: "user-feedback"
scope: global
---

# Contraste nunca mínimo

## Action
Jamás diferencias de color mínimas. Contraste AA perceptible, verificado sobre el
componente real renderizado.

## Evidence
- Regla dura del usuario, repetida en varias sesiones
- Aplica a todos los proyectos del workspace
```

**Confianza según cuántas veces lo viste:** 1-2 → `0.3` · 3-5 → `0.5` · 6-10 → `0.7` ·
11+ → `0.85`. En la duda, `scope: project` (es más fácil promover después que
descontaminar lo global).

### Gestionar
```bash
$INS promote <id>     # project → global (requiere confianza >= 0.8 y presencia en 2+ proyectos)
$INS merge            # unifica duplicados
$INS prune            # saca los de baja confianza
$INS gc               # limpia pendientes vencidos (TTL 30 días)
$INS delete <id>
$INS export / import  # compartir instintos (import valida la URL contra SSRF)
$INS evolve           # agrupa instintos parecidos y sugiere convertirlos en skill/comando
```

## Cuándo usarlo vs. dónde más guardar

| La cosa es… | Va a… |
|---|---|
| Una forma de trabajar que el usuario corrigió/confirmó | **instinto** (acá) |
| Una regla innegociable del nodo | `\.ai-stack/AGENTS.md` (Reglas #1/#2/#3) |
| Un dato operativo que cruza asistentes (gotcha, runbook, decisión) | `/skill memory` |
| Una preferencia estable del usuario | `~/.claude/projects/<slug>/memory/` |
| Documentación viva del proyecto | `{proyecto}/memorias/` |

## Límites reales (verificados en el código, no prometidos por el README)

- **El decay de confianza NO está implementado.** El `-0.02/semana` y los `±0.05/-0.1` de
  la doc no tienen código detrás. El número queda como lo escribiste: **revisalo a mano**.
- **`evolve` agrupa por `str.replace` sobre el trigger**, no por semántica. Sirve como
  disparador de ideas, no como decisión: siempre revisá lo que propone.
- Los umbrales que **sí** son código: promoción `>= 0.8` y presencia en `>= 2` proyectos.
