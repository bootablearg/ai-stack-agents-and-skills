---
name: security-scan-verified
description: Escaneo profundo de vulnerabilidades del código propio, por niveles de esfuerzo, donde cada hallazgo se cuestiona antes de reportarlo y el conteo final lo calcula un script, no el modelo. Con lo que sobrevive propone parches, cada uno verificado por dos revisores independientes, que se aplican sólo cuando el usuario dice que sí. Usar para "escaneá la seguridad de este repo", "revisá la seguridad de estos cambios / de este PR antes de mergear", "sugerí parches para los hallazgos", o al delegarle un escaneo a Codex. Portable a Claude Code, OpenCode, Codex, Gemini y Copilot. Encadena semgrep, codeql, cyber-neo, los skills de seguridad por lenguaje, fp-check, variant-analysis y santa-method.
license: MIT
---

# Escaneo de seguridad verificado

Tres trabajos, un registro, un reporte:

| Trabajo | Qué revisa | Cuándo |
|---|---|---|
| **escanear-cambios** | El diff contra una rama o un rango de commits | Antes de mergear o de pushear |
| **escanear-repo** | El repositorio entero | Auditoría periódica, antes de un release, al heredar código |
| **sugerir-parches** | Los hallazgos confirmados de un escaneo anterior | Después de un escaneo, cuando el usuario lo pide |

**Principio que no se negocia:** el modelo encuentra y juzga; **`scripts/findings.py` guarda
y cuenta**. Todo hallazgo pasa por el registro, todo cambio de estado lleva motivo y
evidencia, y **ningún número del reporte lo escribe el modelo**: sale de `findings.py tally`.

> **En Claude Code**, si está instalado el plugin oficial `claude-security`, usá ese: está
> pensado para Claude Code y lo hace mejor. Este skill existe para los otros asistentes y
> para **delegar un escaneo a Codex** sin gastar el límite de Claude (ver §7).

---

## 1. Niveles de esfuerzo

Preguntá el nivel si el usuario no lo dijo. Por defecto: `rapido` para cambios,
`estandar` para el repo.

| Nivel | Búsqueda | Verificación de cada hallazgo | Variantes |
|---|---|---|---|
| **rapido** | cyber-neo (secretos) + semgrep con reglas del lenguaje + lectura del diff | `fp-check` estándar | no |
| **estandar** | lo anterior + skills de seguridad del framework + `insecure-defaults` + `sharp-edges` | `fp-check` estándar; profundo en severidad alta o crítica | sobre los confirmados alta/crítica |
| **profundo** | lo anterior + `codeql` (flujo de datos) + agentes de `audit-context-building` por módulo | `fp-check` profundo en todos (agentes `data-flow-analyzer`, `exploitability-verifier`, `poc-builder`) | sobre todos los confirmados |

Avisá el costo antes de arrancar `profundo`: dispara varios agentes por hallazgo.

---

## 2. Preparación

```bash
F="$AISTACK_HOME/skills/security-scan-verified/scripts/findings.py"
D="$WORKSPACE/temp/security-scan/<proyecto>-$(date +%F)"   # volátil: sólo trabajo intermedio
python3 "$F" init --dir "$D" --target <ruta-del-repo> --nivel <rapido|estandar|profundo>
```

Verificá qué herramientas hay (`command -v semgrep codeql gitleaks`). **Si falta una, decilo
en el reporte** ("semgrep no instalado: la búsqueda por patrones se hizo leyendo el código")
y seguí con lo que haya. No la instales sin autorización.

---

## 3. Fases de un escaneo (`escanear-cambios` y `escanear-repo`)

Cada fase es un rol distinto. Si el asistente puede lanzar subagentes, cada rol es un
subagente con su propio contexto; si no, se hacen en orden y **sin mezclar**: el que
verifica no es el que encontró.

### Fase 1 — Inventario
Qué hay y por dónde entra el atacante. `audit-context-building` (o `graphify-local` si hay
grafo). Salida: lista de puntos de entrada (rutas HTTP, comandos, colas, webhooks, uploads),
límites de confianza, dónde se autentica y autoriza, qué datos sensibles maneja.
En `escanear-cambios`: `differential-review` clasifica el diff por riesgo y decide qué
archivos merecen contexto profundo.

### Fase 2 — Secretos (redactor)
```bash
python3 "$AISTACK_HOME/skills/cyber-neo/skills/cyber-neo/scripts/scan_secrets.py" <ruta> > "$D/secretos.json"
python3 "$F" ingest --dir "$D" "$D/secretos.json"
```
**Nunca** copies un secreto al chat, al reporte ni a un commit: `findings.py` los guarda
enmascarados. Si un secreto aparece en pantalla, recomendá rotarlo.

### Fase 3 — Búsqueda (investigador)
- Herramientas → SARIF → registro:
  `semgrep` (skill `semgrep`), `codeql` (skill `codeql`, nivel profundo), y
  `python3 "$F" ingest --dir "$D" <archivo.sarif>...`
- Revisión guiada por el framework, con el skill que corresponda: `laravel-security`,
  `django-security`, `golang-security`, `security-and-hardening`, más `insecure-defaults` y
  `sharp-edges`. Cada sospecha va al registro:
  `python3 "$F" add --dir "$D" --titulo "..." --archivo X --linea N --severidad alta --cwe CWE-89`
- Para un tipo de ataque puntual, el skill específico de `cybersecurity-skills`
  (`testing-for-xss-vulnerabilities`, `exploiting-idor-vulnerabilities`, etc.).

### Fase 4 — Verificación (verificador)
Por **cada** hallazgo `nuevo`: `fp-check` (estándar o profundo según el nivel). Guardá su
salida en `$D/evidencia/<ID>.md` y registrá el veredicto:
```bash
python3 "$F" set --dir "$D" <ID> confirmado  --motivo "<qué camino de datos se probó>" --evidencia "$D/evidencia/<ID>.md"
python3 "$F" set --dir "$D" <ID> descartado  --motivo "<por qué no es explotable>"
python3 "$F" set --dir "$D" <ID> duplicado   --motivo "<mismo defecto>" --de <ID-original>
```
El script rechaza confirmar sin evidencia, motivos vagos y saltos de estado.

### Fase 5 — Variantes
Sobre los confirmados que diga el nivel: `variant-analysis`. Cada variante nueva entra con
`add` y vuelve a la fase 4. **Una variante sin verificar no se reporta.**

### Fase 6 — Cierre y reporte
```bash
python3 "$F" tally  --dir "$D" --estricto        # falla si queda algo sin veredicto
python3 "$F" report --dir "$D" --out "$D/reporte.md"
```
Copiá el reporte a `{proyecto}/memorias/YYYY_MM_DD_security_scan.md` (el `temp` es volátil).
Al usuario: el conteo **tal como lo dio `tally`**, los confirmados de mayor severidad
primero, y qué herramientas faltaron.

---

## 4. `sugerir-parches`

Sólo sobre hallazgos `confirmado` del registro. Uno por vez:

1. **Generador:** escribe el parche mínimo (diff) en `$D/parches/<ID>.diff`, **sin aplicarlo**.
   Un parche arregla la causa, no esconde el síntoma, y no toca nada fuera del defecto.
   `python3 "$F" set --dir "$D" <ID> parche-propuesto --motivo "<qué cambia y por qué>"`
2. **Panel de verificación:** `santa-method` con **dos revisores independientes** y la misma
   pauta: ¿cierra el camino de ataque que confirmó `fp-check`?, ¿rompe comportamiento
   legítimo?, ¿abre otro defecto?, ¿hay test que lo pruebe? Los dos tienen que aprobar.
   - Aprobado → `set ... parche-verificado --evidencia $D/evidencia/<ID>-panel.md`
   - Rechazado → `set ... parche-rechazado --motivo "<qué objetó el panel>"` y vuelta al paso 1
     (tope: 3 vueltas; después, se escala al usuario).
3. **Aplicar es decisión del usuario.** Mostrá el diff y esperá un "sí" explícito
   (Regla #1 del stack). Recién ahí se aplica y se registra
   `set ... aplicado --motivo "aprobado por el usuario el <fecha>; tests: <resultado>"`.
   Si decide no parchear: `aceptado-sin-parche` con el motivo.

---

## 5. Estados del registro

```
nuevo ──► confirmado ──► parche-propuesto ──► parche-verificado ──► aplicado
  │            │                 │  ▲                 │
  │            │                 ▼  │                 └──► aceptado-sin-parche
  │            │          parche-rechazado ──────────────► aceptado-sin-parche
  │            └──► aceptado-sin-parche
  ├──► descartado
  └──► duplicado
```
Pendiente = `nuevo`, `parche-propuesto` o `parche-rechazado`. `tally --estricto` falla
mientras haya alguno.

---

## 6. Qué no hacer

- Reportar un hallazgo que no pasó por la fase 4.
- Escribir un número en el reporte que no salga de `tally`.
- Aplicar un parche sin el "sí" del usuario, aunque el panel lo apruebe.
- Escanear código de terceros o sistemas ajenos: este skill es para código propio o con
  autorización explícita.
- Correr exploits contra producción. La prueba de concepto de `fp-check` va contra un
  entorno local o de desarrollo.

---

## 7. Delegar a Codex (ciclo Codex ejecuta, Claude audita)

Un escaneo `estandar` o `profundo` es de lo más caro en tokens. Codex corre contra la
suscripción de ChatGPT, así que el reparto por defecto es:

```bash
$AISTACK_HOME/scripts/ai-start.sh codex --rw "Seguí el skill security-scan-verified \
($AISTACK_HOME/skills/security-scan-verified/SKILL.md), trabajo escanear-repo, nivel estandar, \
sobre <ruta>. Registro en <D>. No apliques parches."
```

Después, Claude **audita**: relee una muestra de `confirmado` y `descartado` contra su
evidencia, corre `findings.py tally --estricto` él mismo y recién entonces reporta.
`sugerir-parches` se puede delegar igual; aplicar, nunca sin el "sí".
