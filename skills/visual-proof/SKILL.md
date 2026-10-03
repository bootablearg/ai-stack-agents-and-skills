---
name: visual-proof
description: Protocolo obligatorio de prueba visual REAL. Usar SIEMPRE que un cambio afecte lo que se ve del producto (CSS/SCSS, templates, componentes, tokens, tema WordPress, layout, copy visible) antes de reportar "listo"; o cuando te pidan QA/verificar un resultado visual. Elige el camino MÁS RÁPIDO a un screenshot real del cambio, maneja login buscando credenciales en el store, y verifica de verdad — nunca "parece bien en el HTML".
license: MIT
---

# visual-proof — Prueba visual real, camino más rápido

**Regla dura:** ningún cambio visual se reporta como hecho sin un **screenshot real** del
resultado, leído y verificado. "Parece bien en el HTML/CSS" **no** es verificación.
Alinea con la regla global *Screenshot Obligatorio — Cambios Visuales*.

## Cuándo se dispara

Antes de decir "listo/funciona" cuando tocaste algo que cambia lo que ve el usuario:
CSS/SCSS, templates/HTML, componentes (React/Vue/Blade/Livewire), tokens de diseño,
tema/plugin WordPress, layout, imágenes, o **copy visible**. También cuando te piden
auditar o confirmar un resultado visual o de QA.

## Paso 0 — Rutas fijas (no asumir)

- **Temp / salida de capturas:** `$WORKSPACE/temp/` — nombrá `NN_descripcion_check.png`.
- **Store de credenciales:** `$WORKSPACE/credentials/` (un `.md` por servidor/servicio:
  `<servidor>.md`, `<servicio>.md`, el inventario de servidores, claves SSH, etc.).
  Buscá acá SIEMPRE que la vista esté detrás de login. Nunca hardcodees secretos ni los
  imprimas en logs/stdout ni los dejes visibles en el screenshot (redactá si hace falta).
- **Cuentas de prueba del proyecto:** ver la memoria del proyecto
  (usuario de prueba con el onboarding completo — credenciales en el credentials store del proyecto, nunca acá).

## Árbol de decisión — el camino más rápido primero

Elegí el **primer** caso que aplique. Más arriba = más rápido y menos frágil.

### 1) HTML local o URL pública SIN login → Chrome headless (lo más rápido)
```bash
google-chrome --headless --disable-gpu --no-sandbox --ignore-certificate-errors \
  --window-size=1280,900 \
  --screenshot=$WORKSPACE/temp/NN_check.png \
  "https://HOST/RUTA"        # o  "file://$WORKSPACE/temp/x.html"
```
Para páginas con render JS/SPA que tardan, sumá `--virtual-time-budget=4000`.

### 2) Detrás de login / requiere interacción (click, form, estado) → Playwright
Chrome solo no autentica ni interactúa. Usá el Playwright del **host de agentes**
(módulo node + `chromium-1223`, hay que pasar `executablePath`) — ver [[playwright-node-location]].
Patrón mínimo:
```js
// 1) leer credenciales del store ANTES (credentials/<host>.md o cuenta de prueba)
// 2) login → navegar → esperar selector real → screenshot
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath: '<ruta chromium-1223>' });
const p = await (await b.newContext()).newPage();
await p.goto(URL_LOGIN, { waitUntil: 'networkidle' });
await p.fill('#email', EMAIL); await p.fill('#password', PASS); await p.click('button[type=submit]');
await p.goto(URL_DEL_CAMBIO, { waitUntil: 'networkidle' });
await p.waitForSelector('SELECTOR_QUE_PRUEBA_EL_CAMBIO');
await p.screenshot({ path: '$WORKSPACE/temp/NN_check.png', fullPage: true });
await b.close();
```

### 3) Solo alcanzable desde otro host (red interna 192.168.x, SSH) → capturá EN ese host
Corré Chrome/Playwright en el servidor que llega al target (p. ej. el host de agentes alcanza la
interna) y traé el PNG por `scp`, o abrí un túnel SSH y capturá local. No fuerces desde acá
una URL que este nodo no resuelve/alcanza.

## Paso final — Verificar de verdad (obligatorio)

1. **`Read` el PNG** y confirmá con tus ojos que el cambio está presente y bien.
2. **Corroborá con computed style** cuando el render de screenshot en Linux sea dudoso
   (fuentes/antialiasing/colores) — `getComputedStyle` del elemento tocado en Playwright.
   No te apoyes solo en la imagen si hay señal de render inconsistente ([[playwright-node-location]]).
3. **Veredicto con evidencia:** decí qué muestra la captura. Si NO se pudo verificar, decilo
   explícito — no afirmes "funciona".

## Combina bien con

- `impeccable` (audit/live) → chequeo anti-slop determinista sobre la misma URL/archivo.
- `browser-testing-with-devtools`, `webapp-testing`, `playwright-best-practices` → tooling.
- Agente de QA visual propio del proyecto, si existe → regresión visual multimarca.
