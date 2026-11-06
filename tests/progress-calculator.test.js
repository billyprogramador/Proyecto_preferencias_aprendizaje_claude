'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, plain } = require('./helpers/load-scripts');

const { progressCalculator } = loadScripts(['js/progress/progress-calculator.js']);
const { calculateOverallPercentage, normalizeCompletedTopicIds } = progressCalculator;

const COURSE_IDS = ['tema-1', 'tema-2', 'tema-3', 'tema-4', 'tema-5', 'tema-6', 'tema-7'];

describe('calculateOverallPercentage', () => {
  test('0 de 7 temas es 0 %', () => {
    assert.equal(calculateOverallPercentage(0, 7), 0);
  });

  test('7 de 7 temas es 100 %', () => {
    assert.equal(calculateOverallPercentage(7, 7), 100);
  });

  test('redondea al entero más cercano', () => {
    const expected = [0, 14, 29, 43, 57, 71, 86, 100];
    expected.forEach((percentage, completed) => {
      assert.equal(calculateOverallPercentage(completed, 7), percentage, `${completed}/7`);
    });
  });

  test('limita los valores fuera de rango', () => {
    assert.equal(calculateOverallPercentage(-3, 7), 0);
    assert.equal(calculateOverallPercentage(12, 7), 100);
  });

  test('devuelve 0 si el total no es válido', () => {
    assert.equal(calculateOverallPercentage(3, 0), 0);
    assert.equal(calculateOverallPercentage(3, -1), 0);
    assert.equal(calculateOverallPercentage(3, NaN), 0);
    assert.equal(calculateOverallPercentage(3, undefined), 0);
  });
});

describe('normalizeCompletedTopicIds', () => {
  const normalize = (ids) => plain([...normalizeCompletedTopicIds(ids, COURSE_IDS)]);

  test('cuenta una sola vez los temas repetidos (varios formatos del mismo tema)', () => {
    assert.deepEqual(normalize(['tema-1', 'tema-1', 'tema-1', 'tema-2']), ['tema-1', 'tema-2']);
  });

  test('descarta identificadores que no pertenecen al curso', () => {
    assert.deepEqual(normalize(['tema-1', 'tema-99', 'otro', '']), ['tema-1']);
  });

  test('ignora espacios alrededor del identificador', () => {
    assert.deepEqual(normalize(['  tema-3 ']), ['tema-3']);
  });

  test('acepta null, undefined y listas vacías', () => {
    assert.deepEqual(normalize(null), []);
    assert.deepEqual(normalize(undefined), []);
    assert.deepEqual(normalize([]), []);
  });

  test('acepta cualquier iterable, no solo arreglos', () => {
    assert.deepEqual(normalize(new Set(['tema-2', 'tema-4'])), ['tema-2', 'tema-4']);
  });

  test('no distingue entre números y textos convertibles', () => {
    assert.deepEqual(plain([...normalizeCompletedTopicIds([1, '2'], ['1', '2'])]), ['1', '2']);
  });
});
