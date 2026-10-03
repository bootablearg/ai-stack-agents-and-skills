---
name: route-specialist
description: Analiza un pedido de trabajo y recomienda qué agente(s) de .ai-stack conviene usar y en qué orden — para cuando no está claro qué especialista necesita la tarea. Usar cuando el pedido cruza varias disciplinas (PM, arquitectura, desarrollo, QA, seguridad, UX) o cuando el usuario pregunta "¿qué agente uso para esto?".
---

# Route Specialist — enrutador de agentes de .ai-stack

Meta-skill que NO ejecuta trabajo por su cuenta: solo clasifica el pedido y recomienda
qué agentes de `$AISTACK_HOME/agents/` conviene invocar y en qué orden. Adaptado
del patrón meta-orquestador de [ASDT](https://github.com/vitualizz/asdt), simplificado:
sin motor de steps/workflow.yaml ni memoria propietaria (Engram) — la continuidad entre
agentes se resuelve con el Memory Vault que ya usa este workspace (`/skill memory`).

## Invariantes

- Nunca ejecutés vos mismo el trabajo de un especialista — solo recomendá.
- Siempre presentá el plan de ruteo y esperá confirmación antes de sugerir invocar nada
  (Regla #1 del workspace: Propuesta + Plan + Autorización).
- Si el pedido no mapea claramente a un rol, hacé UNA pregunta aclaratoria y esperá.

## 1. Clasificación por complejidad (keywords, case-insensitive)

| Nivel | Keywords |
|---|---|
| **trivial** | "rápido", "chequeo", "¿esto se ve bien?", "cómo le pondrías", "opinión rápida" |
| **simple** | "ui", "color", "cosmético", "copy", "label", "una línea", "renombrar" |
| **moderado** | "feature", "agregar", "nuevo", "lógica", "validación", "formulario", "endpoint" |
| **complejo** | "arquitectura", "refactor", "migrar", "módulo", "multi", "riesgo", "infra" |

El keyword de mayor severidad gana (complejo > moderado > simple > trivial). Si no matchea
ninguno, preguntá: "¿Cómo describirías este cambio? (simple / moderado / complejo)".

## 2. Clasificación por superficie de riesgo (independiente de la complejidad)

| Familia | Keywords | Aporte |
|---|---|---|
| auth/authz | login, auth, sesión, token, permiso, rol, acceso, oauth, sso | moderado |
| datos sensibles | pii, password, encriptar, hash, base de datos, datos personales | moderado |
| integración externa | third-party, api, webhook, integración, sdk, externo | moderado |
| secretos/credenciales | secret, key, credencial, env-var, api-key, config | moderado |

- Una sola familia presente → al menos `moderado`.
- 2+ familias distintas → escala a `alto`.
- password/credential/secret, o auth+datos juntos → `alto`.
- Ninguna familia → `ninguna`.

Un cambio "simple" puede ser de riesgo "alto" (ej: cambiar el hashing de contraseñas).

## 3. Tabla de Especialistas

| Rol | Cuándo involucrarlo | Agente/skill de `.ai-stack` |
|---|---|---|
| Researcher | El problema es difuso y necesita exploración antes de definir requerimientos | `product-trend-researcher` |
| PM | Pedido nuevo en lenguaje de negocio que necesita historias/alcance formal — NO para refactors o cambios ya definidos técnicamente | `product-manager` |
| UX/UI | Toca interfaz, flujos o pantallas nuevas | `design-ux-architect` (flujo/arquitectura) + `design-ui-designer` (visual/componentes) |
| Architect | Decisiones de sistema, límites de servicio, diseño de API no trivial | `engineering-software-architect` (o `engineering-backend-architect` si es backend puro) |
| Developer | Escribir o cambiar código | `engineering-senior-developer` (general) / `engineering-frontend-developer` (frontend) |
| QA | Necesita test plan formal, criterios de aceptación, edge cases o sign-off de calidad | `testing-qa-engineer` |
| Security | Toca auth, autorización, manejo de datos o integraciones externas — puede correr en cualquier momento, independiente | `engineering-security-engineer` |

Nota: no hay un agente 1:1 para "inicialización de proyecto" (el `asdt-init` de ASDT) —
para eso ya están `engineering-codebase-onboarding-engineer` (entender un repo existente) y
el `tools-inventory.md` por proyecto (Paso 0.5 del protocolo de arranque).

## 4. Orden sugerido (por dependencia de artefactos)

```
Researcher → PM → UX/UI → Architect → Developer → QA
                                            ↑
                                        Security (en cualquier punto, en paralelo)
```

- PM produce alcance/historias → Architect, Developer y QA lo consumen.
- UX/UI produce flujos/specs → Architect y Developer los consumen.
- Architect produce decisiones de diseño → Developer las consume.
- Developer produce la implementación → QA la valida.
- Security no depende de nadie — puede activarse ni bien se detecta superficie de riesgo.

## 5. Formato de salida

```
Pedido: {el pedido, citado}

Complejidad: {trivial | simple | moderado | complejo} — {razón en una línea}
Superficie de riesgo: {ninguna | moderada | alta} — {razón en una línea}

Especialistas recomendados:
  {agente} — {por qué}
  {agente} — {por qué}
  Security — {por qué, o "riesgo: ninguna; no se invoca automático, disponible bajo demanda"}

Orden sugerido:
  {agente} → {agente} → ...

¿Avanzamos con este plan? (sí / modificar / no)
```

## 6. Continuidad entre especialistas

Si el pedido involucra más de un agente, usá el Memory Vault para que cada uno arranque
con el contexto del anterior:

```bash
MEM="node ${AISTACK_HOME:-$AISTACK_HOME}/vendor/ecc-memory-vault/memory.js"
$MEM search "<tema del pedido>"                 # antes de invocar cada especialista
echo "<qué decidió/produjo este especialista>" \
  | $MEM save --title "<título>" --kind decision --stdin   # al terminar cada uno
```

Ver `/skill memory` para el detalle completo.
