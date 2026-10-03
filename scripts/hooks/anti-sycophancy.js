#!/usr/bin/env node
/**
 * anti-sycophancy.js — Capa de enforcement anti-adulación del .ai-stack
 *
 * Detecta patrones de adulación en la respuesta de un asistente. Pensado para
 * ser consumido de dos formas:
 *
 *   1. CLI (Claude Code, hook `Stop`):
 *        node anti-sycophancy.js --claude-stop      (lee el JSON del hook por stdin)
 *      Sale con 2 y escribe el motivo en stderr -> Claude reescribe la respuesta.
 *
 *   2. Módulo (OpenCode, hook `experimental.text.complete`):
 *        const { detect, strip } = require('.../anti-sycophancy.js')
 *
 * Filosofía: falsos negativos antes que falsos positivos. Sólo marca lo que es
 * inequívocamente adulación — aperturas de elogio y concesiones sin evidencia.
 * "Tenés razón, porque <dato verificado>" es legítimo y NO se marca.
 *
 * Desactivar: AISTACK_ANTISYC=0 en el entorno.
 */

'use strict';

const fs = require('fs');

// --- Patrones -------------------------------------------------------------
// Regla: sólo se evalúan contra la APERTURA de la respuesta (ver HEAD_CHARS) o
// como línea completa, que es donde la adulación vive. Buscarlos en todo el
// cuerpo genera falsos positivos (citar al usuario, explicar la regla, etc.).

const HEAD_CHARS = 320;   // ventana de apertura donde se busca el elogio

// ELOGIO PURO: nunca es legítimo, tenga o no evidencia detrás. Es exactamente
// lo que el usuario pidió eliminar.
const ELOGIO = [
  // Castellano
  /\b(excelente|buen[ií]sima|muy\s+buena|gran)\s+(pregunta|idea|punto|observaci[oó]n|aporte)\b/i,
  /\b(perfecto|genial|exacto|buen[ií]simo|impecable)\b\s*[!.,]/i,
  /\bme\s+encanta\s+(la\s+idea|tu|c[oó]mo)\b/i,
  /\bqu[eé]\s+buen[ao]\s+(pregunta|idea|punto|ojo)\b/i,
  /\bbuen\s+ojo\b/i,
  /\b(muy\s+)?buena\s+observaci[oó]n\b/i,
  // Inglés
  /\b(great|excellent|fantastic|brilliant)\s+(question|idea|point|catch|observation)\b/i,
  /\bgood\s+(catch|question|point|eye)\b/i,
  /\bthat(?:'s| is)\s+(a\s+)?(great|excellent|brilliant|smart)\b/i,
];

// CONCESIÓN: darle la razón. Legítima SÓLO si la misma oración trae la evidencia.
const CONCESION = [
  /\b(ten[eé]s|tienes)\s+(toda\s+la\s+)?raz[oó]n\b/i,
  /\b(totalmente|completamente|absolutamente)\s+de\s+acuerdo\b/i,
  /\byou(?:'re|\s+are)\s+(absolutely\s+|completely\s+|totally\s+)?right\b/i,
  /\bi\s+(completely|totally|absolutely)\s+agree\b/i,
];

const APERTURA = [...ELOGIO, ...CONCESION];

// Marcas de que la concesión está fundada. Se buscan en la MISMA oración.
// OJO: sin `\b` de cierre en los términos que terminan en vocal acentuada —
// en JS `\w` no incluye acentos, así que /verifiqué\b/ NUNCA matchea.
const EVIDENCIA = new RegExp(
  '\\b(?:' + [
    'porque', 'ya que', 'seg[uú]n', 'verifiqu[eé]', 'comprob[eé]', 'confirm[eé]',
    'med[ií]', 'prob[eé]', 'lo confirm', 'la evidencia', 'el dato', 'los datos',
    'el log', 'el test', 'el output', 'el c[oó]digo', 'la salida',
    'because', 'verified', 'confirmed', 'i checked', 'the log', 'the test', 'the output',
  ].join('|') + ')',
  'i'
);

// Cierres de relleno (se detectan como línea completa al final)
const CIERRE = [
  /^\s*(espero\s+que\s+(esto\s+)?(te\s+)?(sirva|ayude)|cualquier\s+(cosa|duda)\s+(me\s+)?(avis[aá]s|dec[ií]s)|estoy\s+(ac[aá]|aqu[ií])\s+para\s+lo\s+que\s+necesites)\b/i,
  /^\s*(let\s+me\s+know\s+if|hope\s+(this|that)\s+helps|feel\s+free\s+to\s+ask)\b/i,
];

// --- Slop de redacción ----------------------------------------------------
// Patrones tomados de `skills/stop-slop-es/references/structures.md`.
//
// A diferencia de la adulación, el slop de redacción NO vive en la apertura:
// vive en el cuerpo. Por eso se busca en todo el texto — pero sólo en prosa.
// Los bloques de código, el código en línea y las líneas citadas se sacan
// antes: ahí un "no es X, es Y" suele ser una cita o un identificador, no una
// figura retórica.
//
// Criterio de inclusión: SÓLO lo inequívoco. Se dejaron AFUERA a propósito:
//
//   - La jerga de negocio de phrases.md ("potenciar", "ecosistema", "alinear").
//     En texto técnico son palabras legítimas y dispararían sobre respuestas
//     correctas.
//   - La fragmentación dramática ("Velocidad. Calidad. Costo."). Choca de
//     frente con la regla de CONCISIÓN del AGENTS.md: una respuesta corta y
//     telegráfica es lo que el usuario pide, y el detector la marcaría como
//     slop. Entre las dos reglas manda la concisión.
//   - "¿Y si ...?" como pregunta retórica: es indistinguible por regex de una
//     propuesta real al usuario ("¿Y si lo hacemos con un symlink?").
//
// Desactivar sólo esta capa: AISTACK_STOPSLOP=0 — independiente de
// AISTACK_ANTISYC=0, que apaga las dos.

const SLOP = [
  // Contraste binario. La forma desnuda ("no es X, es Y") se exige al ARRANQUE
  // de la oración: embebida ("...falla porque no es un bug, es config") es
  // habla normal, no retórica de plantilla.
  { tipo: 'contraste-binario',
    re: /(?:^|[.!?]\s+|\n)\s*no\s+es\s+[^.,;:!?\n]{2,45},\s*es\s+[^.;:!?\n]{2,45}[.!?]/i },
  { tipo: 'contraste-binario',
    re: /\bno\s+se\s+trata\s+de\s+[^.,;:!?\n]{2,45},?\s*(?:sino|se\s+trata\s+de)\b/i },
  { tipo: 'contraste-binario',
    re: /\bel\s+problema\s+no\s+es\s+[^.,;:!?\n]{2,45},\s*(?:el\s+problema\s+)?es\b/i },
  { tipo: 'contraste-binario',
    re: /\bla\s+(?:respuesta|clave|cuesti[oó]n)\s+no\s+es\s+[^.,;:!?\n]{2,45},\s*(?:sino|es)\b/i },
  { tipo: 'contraste-binario',
    re: /\bparece\s+[^.,;:!?\n]{2,45},?\s*pero\s+en\s+realidad\s+(?:es|son)\b/i },
  { tipo: 'contraste-binario',
    re: /\bit(?:'s|\s+is)\s+not\s+[^.,;:!?\n]{2,45},\s*it(?:'s|\s+is)\s+[^.;:!?\n]{2,45}[.!?]/i },
  { tipo: 'contraste-binario',
    re: /\b(?:this|it)\s+is(?:n't|\s+not)\s+about\s+[^.,;:!?\n]{2,45},\s*it(?:'s|\s+is)\s+about\b/i },

  // Pregunta retórica que se contesta sola. Son encabezados de relleno: anuncian
  // la idea en vez de darla.
  { tipo: 'pregunta-retorica',
    re: /(?:^|\n)\s*[¿]?(?:qu[eé]\s+significa\s+esto|por\s+qu[eé]\s+importa|qu[eé]\s+cambia\s+esto|qu[eé]\s+quiere\s+decir\s+esto)\s*\?/i },
  { tipo: 'pregunta-retorica',
    re: /(?:^|\n)\s*(?:what\s+does\s+this\s+mean|why\s+does\s+this\s+matter|so\s+what)\s*\?/i },

  // Frase-placa: fabrica gravedad sin nombrar el cambio concreto.
  { tipo: 'frase-placa',
    re: /\b(?:eso|esto)\s+(?:lo\s+)?cambia\s+todo\b/i },
  { tipo: 'frase-placa',
    re: /\b(?:that\s+changes\s+everything|end\s+of\s+story)\b/i },
];

// Lista negativa: se arma suspenso diciendo lo que algo NO es antes de decir qué es.
const LISTA_NEGATIVA = {
  tipo: 'lista-negativa',
  re: /\bno\s+es\s+[^.\n]{1,40}\.\s*no\s+es\s+[^.\n]{1,40}\.\s*(?:no\s+es\s+[^.\n]{1,40}\.\s*)?es\b/i,
};

/**
 * Deja sólo la prosa: saca bloques de código cercados, código en línea y
 * líneas citadas (`>`). Reemplaza por espacios para no correr los índices.
 */
function soloProsa(text) {
  return text
    .replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length))
    .replace(/^[ \t]*>.*$/gm, (m) => ' '.repeat(m.length))
    // Salto de línea BLANDO: el markdown de este repo viene cortado a ~88
    // columnas, y ese \n parte oraciones al medio. Sin esto, un contraste
    // embebido ("...que varía entre corridas\nno es un error de formato, es
    // otra cosa") se lee como si arrancara la oración y se marca de más.
    // Medido: era el único falso positivo sobre 17 documentos reales del repo.
    // Los saltos DOBLES (párrafo) y los de lista/encabezado se conservan.
    .replace(/([^\n|>*\-#\d])\n(?=[^\n|>*\-#\s])/g, '$1 ');
}

// --- Detección ------------------------------------------------------------

function detect(text) {
  if (!text || typeof text !== 'string') return [];
  if (process.env.AISTACK_ANTISYC === '0') return [];

  const hallazgos = [];
  const head = text.slice(0, HEAD_CHARS);

  // Elogio: se marca siempre, salvo que esté entrecomillado — ahí se está
  // citando la frase (por ejemplo, para explicar esta misma regla).
  for (const re of ELOGIO) {
    const m = head.match(re);
    if (!m) continue;
    const idx = head.indexOf(m[0]);
    const antes = head[idx - 1];
    const despues = head[idx + m[0].length];
    const comillas = ['"', "'", '«', '»', '`', '“', '”', '‘', '’'];
    if (comillas.includes(antes) || comillas.includes(despues)) continue;
    hallazgos.push({ tipo: 'elogio', frase: m[0].trim() });
  }

  // Concesión: se marca sólo si la oración que la contiene no trae evidencia.
  for (const re of CONCESION) {
    const m = head.match(re);
    if (!m) continue;
    const idx = head.indexOf(m[0]);
    const desde = head.lastIndexOf('.', idx) + 1;
    let hasta = head.indexOf('.', idx + m[0].length);
    if (hasta === -1) hasta = head.length;
    const oracion = head.slice(desde, hasta);
    if (EVIDENCIA.test(oracion)) continue;
    hallazgos.push({ tipo: 'concesion-sin-evidencia', frase: m[0].trim() });
  }

  const lineas = text.trimEnd().split('\n');
  for (const l of lineas.slice(-3)) {
    for (const re of CIERRE) {
      const m = l.match(re);
      if (m) hallazgos.push({ tipo: 'cierre-de-relleno', frase: m[0].trim() });
    }
  }

  // Slop de redacción: cuerpo completo, sólo prosa. Capa independiente.
  if (process.env.AISTACK_STOPSLOP !== '0') {
    const prosa = soloProsa(text);
    for (const { tipo, re } of SLOP) {
      const m = prosa.match(re);
      if (m) hallazgos.push({ tipo, frase: m[0].trim().slice(0, 90) });
    }
    const mln = prosa.match(LISTA_NEGATIVA.re);
    if (mln) hallazgos.push({ tipo: LISTA_NEGATIVA.tipo, frase: mln[0].trim().slice(0, 90) });
  }

  // dedup por frase
  const vistos = new Set();
  return hallazgos.filter((h) => {
    const k = h.tipo + '|' + h.frase.toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/** Quita quirúrgicamente las aperturas de elogio (para hosts que no pueden reintentar). */
function strip(text) {
  if (!text) return text;
  let out = text;
  for (const re of APERTURA) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const head = out.slice(0, HEAD_CHARS);
    if (!re.test(head)) continue;
    out = head.replace(g, '').replace(/^[\s,.;:!¡—-]+/, '') + out.slice(HEAD_CHARS);
  }
  return out;
}

const TIPOS_SLOP = new Set([
  'contraste-binario', 'pregunta-retorica', 'frase-placa', 'lista-negativa',
]);

const REGLAS_ADULACION = [
  'Reglas del AGENTS.md (sección Anti-adulación):',
  '- Sin elogios al usuario ni a sus preguntas. Si algo está bien, seguí adelante sin comentarlo.',
  '- No coincidas por defecto: acordar sólo si lo verificaste, y mostrando el dato.',
  '- Aportá el contrapunto: dónde falla, qué alternativa es mejor, qué costo no se ve.',
  '- Sin cierres de relleno ("espero que sirva", "cualquier cosa avisame").',
];

const REGLAS_SLOP = [
  'Reglas del skill stop-slop-es (references/structures.md):',
  '- Nada de "no es X, es Y" ni "no se trata de X, sino Y": decí Y de entrada.',
  '- No armes listas negativas para generar suspenso. Nombrá la cosa y explicá por qué.',
  '- Sin preguntas retóricas que te contestás solo. Afirmá la idea.',
  '- Sin frases-placa ("eso lo cambia todo"): nombrá el cambio concreto.',
];

function mensaje(hallazgos) {
  const l = hallazgos.map((h) => `  - [${h.tipo}] "${h.frase}"`).join('\n');
  const haySlop = hallazgos.some((h) => TIPOS_SLOP.has(h.tipo));
  const hayAdulacion = hallazgos.some((h) => !TIPOS_SLOP.has(h.tipo));

  const titulo = hayAdulacion && haySlop
    ? 'ADULACIÓN Y SLOP DE REDACCIÓN DETECTADOS en tu respuesta. Reescribila antes de entregarla.'
    : haySlop
      ? 'SLOP DE REDACCIÓN DETECTADO en tu respuesta. Reescribila antes de entregarla.'
      : 'ADULACIÓN DETECTADA en tu respuesta. Reescribila antes de entregarla.';

  const reglas = [];
  if (hayAdulacion) reglas.push(...REGLAS_ADULACION);
  if (hayAdulacion && haySlop) reglas.push('');
  if (haySlop) reglas.push(...REGLAS_SLOP);

  return [
    titulo,
    l,
    '',
    ...reglas,
    'Entregá la misma respuesta sin eso. No expliques este bloqueo al usuario.',
  ].join('\n');
}

// --- CLI: hook Stop de Claude Code ---------------------------------------

function ultimoMensajeAssistant(transcriptPath) {
  try {
    const lineas = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    for (let i = lineas.length - 1; i >= 0; i--) {
      let e;
      try { e = JSON.parse(lineas[i]); } catch { continue; }
      const msg = e && (e.message || e);
      if (!msg || msg.role !== 'assistant') continue;
      const c = msg.content;
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) {
        return c.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
      }
    }
  } catch { /* sin transcript legible -> no bloquear */ }
  return '';
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--self-test')) {
    const casos = [
      // deben DETECTAR
      ['Tenés toda la razón, lo cambio ya.', true],
      ['Excelente pregunta. El archivo está en /etc.', true],
      ['You\'re absolutely right, I\'ll fix it.', true],
      ['Perfecto! Ya lo aplico.', true],
      ['Buen ojo, no lo había visto.', true],
      ['Listo. 12 skills en 4.0.508.\n\nEspero que te sirva.', true],
      ['Great catch. The config was wrong.', true],
      // deben PASAR (falsos positivos a evitar)
      ['Tenés razón porque el log muestra el timeout en la línea 42.', false],
      ['El backup falló: el disco está lleno. Lo revisé con df.', false],
      ['Tenés razón: verifiqué el ownership y es root, no user1.', false],
      ['La regla dice: nada de "excelente pregunta" como apertura.'.slice(0), false],
      ['El test pasa 32/32. El PDF sale de LibreOffice, no de reportlab.', false],
      ['No, eso no es así: el commit 8da1f03 ya trae esa regla.', false],

      // --- slop de redacción: deben DETECTAR ---
      ['No es un problema de red, es un problema de permisos.', true],
      ['No se trata de velocidad, sino de correccion.', true],
      ['El problema no es el disco, es el inodo agotado.', true],
      ['Parece un timeout, pero en realidad es un deadlock.', true],
      ['La respuesta no es cachear, sino indexar.', true],
      ['Migramos el hook.\n\n¿Qué significa esto?\n\nQue el Stop rechaza.', true],
      ['Bajamos el build a 40s. Eso cambia todo.', true],
      ['No es un bug. No es config. Es un permiso 100755.', true],
      ["It's not a cache issue, it's a permissions issue.", true],

      // --- slop: deben PASAR (falsos positivos a evitar) ---
      // Contraste embebido en habla normal, no al arranque de la oración.
      ['Falla porque no es un bug, es config, y ya lo verifiqué con stat.', false],
      // Dentro de un bloque de código.
      ['Corré esto:\n\n```js\nif (x) return "no es A, es B.";\n```\n\nListo.', false],
      // Código en línea.
      ['El flag `no es X, es Y.` viene del parser original.', false],
      // Línea citada.
      ['El README dice:\n\n> No es un framework, es una librería.\n\nEs de 2019.', false],
      // Estilo telegráfico: la regla de concisión manda, no se marca.
      ['Listo. Verificado. Sigo con el siguiente.', false],
      // Negación simple, sin la estructura de contraste.
      ['No es el disco. Lo medí con df: 33G libres.', false],
      // Pregunta real al usuario, no retórica.
      ['¿Y si lo hacemos con un symlink en vez de copiar?', false],
    ];
    let ok = 0;
    for (const [txt, esperado] of casos) {
      const hit = detect(txt).length > 0;
      const bien = hit === esperado;
      if (bien) ok++;
      console.log(`${bien ? 'OK  ' : 'FALLA'} (${hit ? 'detecta' : 'pasa'}) ${JSON.stringify(txt.slice(0, 58))}`);
    }
    console.log(`\n${ok}/${casos.length} casos correctos`);
    process.exit(ok === casos.length ? 0 : 1);
  }

  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { process.exit(0); }
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }

  // Anti-loop: si ya bloqueamos una vez en este turno, dejar pasar.
  if (input.stop_hook_active) process.exit(0);

  const texto = input.transcript_path ? ultimoMensajeAssistant(input.transcript_path) : '';
  const hallazgos = detect(texto);
  if (!hallazgos.length) process.exit(0);

  process.stderr.write(mensaje(hallazgos) + '\n');
  process.exit(2); // 2 = bloquear y devolverle el motivo al modelo
}

module.exports = { detect, strip, mensaje, HEAD_CHARS };

if (require.main === module) {
  // Ante cualquier fallo inesperado, dejar pasar: el hook nunca debe trabar una sesión.
  try { main(); } catch (e) {
    if (process.env.AISTACK_ANTISYC_DEBUG) process.stderr.write('anti-sycophancy: ' + e.message + '\n');
    process.exit(0);
  }
}
