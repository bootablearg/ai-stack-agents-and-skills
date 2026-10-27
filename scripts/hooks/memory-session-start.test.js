'use strict';
// Tests del núcleo del hook: `node --test scripts/hooks/memory-session-start.test.js`
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { recortar, resumenEstandar } = require('./memory-session-start.js');

const AVISO = '\n…';

test('recortar deja intacto un texto bajo el límite', () => {
  assert.equal(recortar('abc', 5, AVISO), 'abc');
});

test('recortar corta en el límite y agrega el aviso', () => {
  assert.equal(recortar('abcdef', 3, AVISO), 'abc' + AVISO);
});

test('resumenEstandar devuelve vacío si el archivo no existe', () => {
  assert.equal(resumenEstandar('/no/existe/BRIEF.md', {}), '');
});

test('resumenEstandar devuelve vacío con AISTACK_STANDARDS=0', () => {
  assert.equal(resumenEstandar(__filename, { AISTACK_STANDARDS: '0' }), '');
});

test('resumenEstandar devuelve el contenido sin espacios en los bordes', () => {
  // Lee este mismo archivo: no hace falta escribir nada en disco.
  assert.equal(resumenEstandar(__filename, {}), fs.readFileSync(__filename, 'utf8').trim());
});
