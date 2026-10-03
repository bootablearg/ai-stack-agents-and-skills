#!/usr/bin/env node
/**
 * doc-debt.js — Deuda de documentación del .ai-stack
 *
 * Responde: "¿qué proyectos se tocaron después de su último cierre con @protocol-end?"
 *
 * Diseño deliberado: la deuda se calcula del ESTADO EN DISCO (marca de último cierre vs
 * mtime de los archivos), no de un evento de fin de sesión. Motivo: `SessionEnd` sólo
 * existe en Claude Code; OpenCode no tiene evento de cierre y Codex/Gemini/Copilot no
 * tienen hooks. Calculándolo del disco, los cinco asistentes ven la misma deuda al
 * arrancar, y ninguno depende de que el anterior haya cerrado bien.
 *
 * La marca de cierre vive en `{proyecto}/.agent-zero/last-close.json`, NO en un estado
 * global: `$AISTACK_HOME/` es sólo conocimiento compartido y no se contamina con estado
 * de ejecución. La deuda sigue siendo del proyecto y no del usuario — si un usuario tocó
 * un proyecto y no lo documentó, otro lo ve al entrar, porque lee el mismo archivo.
 *
 *   node doc-debt.js check                 # texto legible
 *   node doc-debt.js check --json
 *   node doc-debt.js check --plain         # bloque para inyectar en un prompt
 *   node doc-debt.js record-close proyecto-a ai-stack   # marca cierre de esos proyectos
 *   node doc-debt.js status                # marcas de cierre registradas
 *   node doc-debt.js bootstrap             # línea base (sólo al instalar)
 *
 * Desactivar: AISTACK_DOCDEBT=0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const AISTACK = process.env.AISTACK_HOME || path.resolve(__dirname, '..', '..');
const SCOPE = path.join(AISTACK, 'scripts', 'hooks', 'session-scope.js');
const ROOT = process.env.WORKSPACE_ROOT || path.join(require('os').homedir(), 'workspace');

// La marca de cierre vive EN CADA PROYECTO, no en un estado global:
// `$AISTACK_HOME/` es sólo conocimiento compartido y no se contamina con estado
// de ejecución. Además así la marca viaja con el proyecto si se mueve o se versiona.
const MARCA = (proyecto) => path.join(ROOT, proyecto, '.agent-zero', 'last-close.json');

// Ruido que cambia solo (cron, logs, estado de apps) y no es trabajo a documentar.
const RUIDO = [
  /\.log$/i, /\.lock$/i, /\.pid$/i, /\.tmp$/i, /\.bak$/i,
  /(^|\/)state\//, /(^|\/)logs?\//, /(^|\/)cache\//, /(^|\/)\.cache\//,
  /(^|\/)node_modules\//, /(^|\/)__pycache__\//,
  // `skills/synced/` lo escribe el propio cliente al sincronizar skills de la cuenta:
  // aparece con cientos de archivos y no lo tocó ninguna persona.
  /(^|\/)skills\/synced\//,
];

// Lo que escribe el propio cierre no cuenta como deuda nueva.
const ES_DOCUMENTACION = [
  /(^|\/)memorias\//, /(^|\/)\.agent-zero\//, /(^|\/)\.ecc\//,
];

const MIN_ARCHIVOS = Number(process.env.AISTACK_DOCDEBT_MIN || 1);

// Directorios del workspace que NO son proyectos: no se documentan ni llevan marca de
// cierre. Los que empiezan con punto son config de editores/asistentes (.claude,
// .vscode); `credentials` tiene su propia política y no se narra en bitácoras.
const NO_PROYECTOS = new Set(
  (process.env.AISTACK_DOCDEBT_IGNORAR || 'temp,credentials').split(',').map((s) => s.trim()).filter(Boolean)
);
const esProyecto = (n) => !!n && !n.startsWith('.') && !NO_PROYECTOS.has(n);

/** Marca de cierre de UN proyecto. Devuelve el timestamp ISO o null. */
function leerCierre(proyecto) {
  try {
    const d = JSON.parse(fs.readFileSync(MARCA(proyecto), 'utf8'));
    return typeof d.lastClose === 'string' ? d.lastClose : null;
  } catch { return null; }
}

function guardarCierre(proyecto, ts, extra = {}) {
  const f = MARCA(proyecto);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ lastClose: ts, ...extra }, null, 2) + '\n');
  fs.renameSync(tmp, f);
  try { fs.chmodSync(f, 0o664); } catch { /* umask/ACL del proyecto */ }
}

/** Todos los proyectos del workspace que tienen marca, para `status`. */
function todosLosCierres() {
  const out = {};
  let dirs = [];
  try { dirs = fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return out; }
  for (const d of dirs) {
    if (!esProyecto(d.name)) continue;
    const t = leerCierre(d.name);
    if (t) out[d.name] = t;
  }
  return out;
}

function scope(since) {
  try {
    const out = execFileSync('node', [SCOPE, '--since', since, '--json', '--all'], {
      encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(out);
  } catch { return { proyectos: [] }; }
}

/**
 * Patrones de ignore propios de UN proyecto, en `{proyecto}/.agent-zero/docdebt-ignore`.
 * Existe porque hay salida de cron y de herramientas que sólo el proyecto sabe nombrar
 * (los CSV de un scraper, por ejemplo): hardcodearla en este archivo metería rutas de un
 * proyecto en el cerebro compartido, que es conocimiento y no config de nadie.
 *
 * Formato: un glob por línea, relativo a la raíz del proyecto. `#` comenta.
 *   marketing/scraping/*.csv     → sólo esos archivos
 *   marketing/scraping/          → todo el subárbol (la barra final)
 *   **\/*.generated.json         → en cualquier profundidad
 */
const IGNORE_PROYECTO = 'docdebt-ignore';
const cacheIgnore = new Map();

function globARegex(glob) {
  const esc = (t) => t.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += esc(c);
  }
  // Una barra final ignora el subárbol completo.
  if (glob.endsWith('/')) re += '.*';
  return new RegExp('^' + re + '$');
}

function patronesProyecto(proyecto) {
  if (cacheIgnore.has(proyecto)) return cacheIgnore.get(proyecto);
  let out = [];
  try {
    const f = path.join(ROOT, proyecto, '.agent-zero', IGNORE_PROYECTO);
    out = fs.readFileSync(f, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map(globARegex);
  } catch { /* sin archivo: sólo rigen los patrones globales */ }
  cacheIgnore.set(proyecto, out);
  return out;
}

/** Archivos que cuentan como trabajo sin documentar. */
function relevantes(archivos, proyecto) {
  const propios = proyecto ? patronesProyecto(proyecto) : [];
  const prefijo = proyecto ? proyecto + '/' : '';
  return archivos.filter((f) => {
    if (RUIDO.some((re) => re.test(f))) return false;
    if (ES_DOCUMENTACION.some((re) => re.test(f))) return false;
    // Los patrones del proyecto son relativos a su raíz; la lista viene con prefijo.
    const rel = prefijo && f.startsWith(prefijo) ? f.slice(prefijo.length) : f;
    return !propios.some((re) => re.test(rel));
  });
}

/**
 * Un proyecto SIN marca de cierre no arrastra deuda histórica: se cuenta desde
 * VENTANA_NUEVA. Sin esto, el primer `check` reporta meses de trabajo viejo como deuda
 * (11 proyectos, `.vscode` incluido) y el aviso se vuelve ruido que nadie lee.
 * `bootstrap` fija la línea base para todos los proyectos existentes.
 */
const VENTANA_NUEVA = process.env.AISTACK_DOCDEBT_VENTANA || '36 hours ago';

function calcular() {
  if (process.env.AISTACK_DOCDEBT === '0') return [];

  const deuda = [];

  // Una pasada por la ventana corta: define qué proyectos están en juego.
  const recientes = scope(VENTANA_NUEVA);

  for (const p of recientes.proyectos || []) {
    if (!esProyecto(p.nombre)) continue;
    const cierre = leerCierre(p.nombre);
    // Con marca de cierre se recalcula desde ahí (puede ser más viejo o más nuevo que
    // la ventana corta); sin marca, la ventana corta es el límite.
    let proj = p;
    if (cierre) {
      const detalle = scope(cierre);
      proj = (detalle.proyectos || []).find((x) => x.nombre === p.nombre);
      if (!proj) continue; // nada después del cierre: está al día
    }

    const lista = proj.todos || proj.muestra || [];
    const utiles = relevantes(lista, p.nombre);
    if (utiles.length < MIN_ARCHIVOS) continue;

    deuda.push({
      proyecto: p.nombre,
      archivos: utiles.length,
      muestra: utiles.slice(0, 5),
      ultimoCierre: cierre || null,
      desde: cierre || VENTANA_NUEVA,
      faltan: proj.faltan || [],
    });
  }
  return deuda.sort((a, b) => b.archivos - a.archivos);
}

/** Marca "ahora" como línea base de todos los proyectos con actividad conocida. */
function bootstrap() {
  const datos = scope('365 days ago');
  const ahora = new Date().toISOString();
  const nuevos = [];
  for (const p of datos.proyectos || []) {
    if (!esProyecto(p.nombre) || leerCierre(p.nombre)) continue;
    try { guardarCierre(p.nombre, ahora, { nota: 'linea base inicial (bootstrap)' }); nuevos.push(p.nombre); }
    catch { /* proyecto sin permiso de escritura: se omite */ }
  }
  return nuevos;
}

function bloquePlain(deuda) {
  if (!deuda.length) return '';
  const l = ['⚠️ DEUDA DE DOCUMENTACIÓN — proyectos tocados y sin cerrar con @protocol-end:'];
  for (const d of deuda) {
    const cuando = d.ultimoCierre ? `desde el último cierre (${d.ultimoCierre.slice(0, 16)})` : 'nunca cerrado';
    l.push(`- **${d.proyecto}**: ~${d.archivos} archivos, ${cuando}. Ej: ${d.muestra.slice(0, 2).join(', ')}`);
  }
  l.push('Ofrecé cerrar con @protocol-end antes de empezar algo nuevo, o decí por qué no corresponde.');
  return l.join('\n');
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (cmd === 'record-close') {
    const proyectos = rest.filter((a) => !a.startsWith('--'));
    if (!proyectos.length) { console.error('uso: doc-debt.js record-close <proyecto> [...]'); process.exit(2); }
    const ahora = new Date().toISOString();
    const ok = [], fallo = [];
    for (const p of proyectos) {
      try { guardarCierre(p, ahora); ok.push(p); } catch (e) { fallo.push(`${p} (${e.code || e.message})`); }
    }
    if (ok.length) console.log(`cierre registrado (${ahora}) en ${ok.map((p) => p + '/.agent-zero/last-close.json').join(', ')}`);
    if (fallo.length) { console.error(`no pude registrar: ${fallo.join(', ')}`); process.exitCode = 1; }
    return;
  }

  if (cmd === 'bootstrap') {
    const nuevos = bootstrap();
    console.log(nuevos.length
      ? `línea base fijada para ${nuevos.length} proyectos: ${nuevos.join(', ')}`
      : 'todos los proyectos ya tenían línea base');
    return;
  }

  if (cmd === 'status') {
    const e = Object.entries(todosLosCierres());
    if (!e.length) { console.log('sin cierres registrados todavía'); return; }
    for (const [p, t] of e.sort()) console.log(`${p.padEnd(22)} ${t}`);
    return;
  }

  // default: check
  const deuda = calcular();
  if (rest.includes('--json') || cmd === '--json') { console.log(JSON.stringify(deuda, null, 2)); return; }
  if (rest.includes('--plain') || cmd === '--plain') { const b = bloquePlain(deuda); if (b) console.log(b); return; }

  if (!deuda.length) { console.log('Sin deuda de documentación.'); return; }
  console.log(bloquePlain(deuda));
}

module.exports = { calcular, bloquePlain, relevantes, leerCierre, guardarCierre, todosLosCierres };
if (require.main === module) {
  try { main(); } catch (e) {
    if (process.env.AISTACK_DOCDEBT_DEBUG) console.error('doc-debt:', e.message);
    process.exit(0); // nunca romper el arranque de una sesión
  }
}
