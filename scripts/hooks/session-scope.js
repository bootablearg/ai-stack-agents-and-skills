#!/usr/bin/env node
/**
 * session-scope.js — ¿Qué tocó esta sesión y dónde hay que documentarlo?
 *
 * Lo usa @protocol-end para no cerrar de memoria. Lista los archivos modificados
 * en el workspace desde un momento dado, los agrupa por proyecto y reporta qué
 * piezas de documentación tiene cada uno (memorias/, memory-bank, .ecc).
 *
 *   node session-scope.js                      # últimas 8 horas, texto
 *   node session-scope.js --since "3 hours ago"
 *   node session-scope.js --since 2026-08-11T09:00
 *   node session-scope.js --json               # para consumo programático
 *   node session-scope.js --root $WORKSPACE
 *
 * Excluye siempre: temp/, .ecc/ (es salida del vault, no trabajo), .git,
 * node_modules, .venv y archivos ocultos de editor.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ARGV = process.argv.slice(2);
function flag(name, fallback) {
  const i = ARGV.indexOf(name);
  return i !== -1 && ARGV[i + 1] ? ARGV[i + 1] : fallback;
}

const ROOT = flag('--root', process.env.WORKSPACE_ROOT || path.join(require('os').homedir(), 'workspace'));
const SINCE = flag('--since', '8 hours ago');
const JSON_OUT = ARGV.includes('--json');

const EXCLUIR = [
  '*/temp/*', '*/.ecc/*', '*/.git/*', '*/node_modules/*', '*/.venv/*',
  '*/__pycache__/*', '*/.pytest_cache/*', '*.pyc', '*.swp', '*~',
];

// El cerebro compartido vive fuera del workspace, pero su documentación va al
// proyecto `ai-stack`. Se escanea aparte y se mapea a ese nombre.
const AISTACK = process.env.AISTACK_HOME || path.resolve(__dirname, '..', '..');

function buscar(dir, etiqueta) {
  if (!fs.existsSync(dir)) return [];
  const args = [dir, '-type', 'f', '-newermt', SINCE];
  for (const p of EXCLUIR) args.push('!', '-path', p);
  let out = '';
  try {
    // stderr ignorado: los "Permission denied" de subdirectorios ajenos son ruido,
    // no un fallo — find igual devuelve todo lo que sí pudo leer.
    out = execFileSync('find', args, {
      encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (e) {
    out = (e.stdout || '').toString();
    if (!out.trim() && e.status !== 1) {
      throw new Error(`no pude listar ${etiqueta} (¿--since "${SINCE}" es válido?)`);
    }
  }
  return out.split('\n').filter(Boolean).map((f) => ({ abs: f, base: dir, etiqueta }));
}

function archivosModificados() {
  return [...buscar(ROOT, 'workspace'), ...buscar(AISTACK, 'ai-stack')];
}

function piezas(proyecto) {
  const base = path.join(ROOT, proyecto);
  return {
    memorias: fs.existsSync(path.join(base, 'memorias')),
    memoryBank: fs.existsSync(path.join(base, '.agent-zero', 'memory-bank')),
    ecc: fs.existsSync(path.join(base, '.ecc')),
    activeContext: fs.existsSync(path.join(base, '.agent-zero', 'memory-bank', 'activeContext.md')),
    progress: fs.existsSync(path.join(base, '.agent-zero', 'memory-bank', 'progress.md')),
    decisions: fs.existsSync(path.join(base, '.agent-zero', 'memory-bank', 'decisions.md')),
  };
}

function main() {
  let archivos;
  try { archivos = archivosModificados(); } catch (e) {
    if (JSON_OUT) { console.log(JSON.stringify({ error: e.message, proyectos: [] })); process.exit(0); }
    console.error(e.message); process.exit(1);
  }

  const porProyecto = new Map();
  const sueltos = [];

  for (const f of archivos) {
    // Todo lo del cerebro compartido se documenta en el proyecto `ai-stack`.
    if (f.etiqueta === 'ai-stack') {
      const rel = 'ai-stack/' + path.relative(AISTACK, f.abs);
      if (!porProyecto.has('ai-stack')) porProyecto.set('ai-stack', []);
      porProyecto.get('ai-stack').push(rel);
      continue;
    }
    const rel = path.relative(ROOT, f.abs);
    const seg = rel.split(path.sep);
    if (seg.length < 2) { sueltos.push(rel); continue; }
    const proj = seg[0];
    if (!porProyecto.has(proj)) porProyecto.set(proj, []);
    porProyecto.get(proj).push(rel);
  }

  const proyectos = [...porProyecto.entries()]
    .map(([nombre, files]) => {
      const p = piezas(nombre);
      const faltan = [];
      if (!p.memorias) faltan.push('memorias/');
      if (!p.memoryBank) faltan.push('.agent-zero/memory-bank/');
      if (!p.ecc) faltan.push('.ecc/ (se crea sola al primer save)');
      return {
        nombre,
        archivos: files.length,
        muestra: files.slice(0, 8),
        // Lista completa sólo bajo pedido: la consume doc-debt.js para filtrar ruido
        // sin adivinar a partir de la muestra recortada.
        todos: ARGV.includes('--all') ? files : undefined,
        piezas: p,
        faltan,
      };
    })
    .sort((a, b) => b.archivos - a.archivos);

  const resultado = { root: ROOT, since: SINCE, total: archivos.length, proyectos, sueltos };

  if (JSON_OUT) { console.log(JSON.stringify(resultado, null, 2)); return; }

  if (!archivos.length) {
    console.log(`Sin cambios en ${ROOT} desde "${SINCE}". No hay nada que cerrar.`);
    return;
  }

  console.log(`# Alcance de la sesión — ${archivos.length} archivos desde "${SINCE}"\n`);
  for (const p of proyectos) {
    console.log(`## ${p.nombre} (${p.archivos} archivos)`);
    for (const m of p.muestra) console.log(`   - ${m}`);
    if (p.archivos > p.muestra.length) console.log(`   … y ${p.archivos - p.muestra.length} más`);
    const tiene = Object.entries(p.piezas).filter(([, v]) => v).map(([k]) => k).join(', ') || 'ninguna';
    console.log(`   destinos disponibles: ${tiene}`);
    if (p.faltan.length) console.log(`   ⚠️  faltan: ${p.faltan.join(' · ')}`);
    console.log('');
  }
  if (sueltos.length) console.log(`## Sueltos en la raíz (${sueltos.length}): ${sueltos.slice(0, 5).join(', ')}`);
}

module.exports = { archivosModificados, piezas };
if (require.main === module) {
  try { main(); } catch (e) { console.error('session-scope:', e.message); process.exit(1); }
}
