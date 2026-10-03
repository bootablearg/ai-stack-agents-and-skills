---
name: anti-ai-design
description: Audita la estética de interfaces creadas con IA para detectar y eliminar el look "generado por IA". Analiza una URL en vivo (screenshot real desktop+mobile) y/o el código (HTML/CSS/SCSS/componentes/tokens), califica un "AI-smell score" 0-100 y devuelve hallazgos priorizados con el fix concreto de cada uno; opcionalmente aplica los fixes con autorización. Usar cuando el usuario pide auditar/analizar/mejorar la estética de algo hecho con IA, dice "¿esto se nota que es IA?", "que no parezca IA", "revisá el diseño", "anti-ai-design", "auditá la UI", o quiere quitarle el aspecto genérico/plantilla a una web, landing, dashboard o componente.
---

# anti-ai-design — Auditor de estética anti-IA

Detecta y elimina las señales que delatan una interfaz "hecha con IA": paletas
violeta/índigo de stock, tipografía sin jerarquía, cards uniformes, motion sin
propósito, copy robótico. Objetivo: que se vea **artesanal, con criterio humano**.

## Reglas del nodo (no negociables)

- Respondé en **castellano argentino**.
- **Regla #1:** diagnosticar → proponer → esperar "sí" antes de tocar archivos. La
  auditoría (pasos 1-5) es solo-lectura. Los fixes (paso 6) requieren autorización
  explícita **por archivo**.
- **Nunca asumir** (Regla #2): screenshot/código real antes de afirmar. "Parece bien
  en el HTML" ≠ verificado.

## Flujo

### 1. Input
Determiná qué te dieron: **URL**, **ruta de código**, o **ambos**. Si falta, preguntá.
Si hay URL detrás de login, buscá credenciales en `credentials/` del proyecto.

### 2. Captura (evidencia real)
- **URL** → `scripts/shot.sh "<url>" <slug>` saca desktop (1440) + mobile (390) a
  `$WORKSPACE/temp/` y los abrís con `Read`. Mirá lo renderizado, no el HTML.
- **Código** → localizá templates, hojas de estilo (CSS/SCSS/Tailwind config), y
  archivos de tokens/tema. Leé los reales.

### 3. Auditoría por dimensiones
Recorré las **10 dimensiones** de [CHECKLIST.md](CHECKLIST.md). Para cada señal que
encuentres anotá: **qué** viste (con evidencia: screenshot o `archivo:línea`), **por
qué grita IA**, y el **fix** concreto. No inventes hallazgos: si una dimensión está
bien, decilo.

### 4. AI-smell score
Calculá 0-100 según CHECKLIST.md (0 = artesanal, indistinguible de humano; 100 =
plantilla de IA de manual). Dá un veredicto de una línea.

### 5. Reporte priorizado
Entregá los hallazgos **rankeados por severidad** (Crítico / Alto / Medio / Bajo),
cada uno con qué / por qué / fix. Para profundizar apoyate en los skills y agentes
hermanos (ver **Refuerzos**). No apliques nada todavía.

### 6. Fixes (opcional, con autorización)
Si el usuario quiere aplicar: proponé los **diffs concretos**, esperá su "sí"
**por archivo**, aplicá, y **re-verificá con screenshot** (protocolo visual-proof).
Screenshot del antes y el después.

## Refuerzos (encadenar cuando haga falta profundidad)

- `/skill design-motion-principles` — auditar/arreglar motion (modo audit caza AI-slop).
- `/skill impeccable` — subir el nivel: jerarquía, tipografía, color, espaciado.
- `/skill frontend-design` — rehacer un componente evitando estética genérica.
- `/skill visual-proof` — protocolo de verificación visual de los fixes.
- Agentes `design-ui-designer`, `design-whimsy-injector`, `testing-accessibility-auditor`
  para una segunda perspectiva especializada.

## Quick start

```
/anti-ai-design https://example.com
/anti-ai-design  (y le pasás la ruta del código, o ambos: URL + carpeta)
```
