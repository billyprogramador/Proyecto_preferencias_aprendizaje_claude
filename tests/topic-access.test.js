'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, plain } = require('./helpers/load-scripts');

const { topicAccess } = loadScripts(['js/progress/topic-access.js']);
const { resolveTopicStates, TopicStatus } = topicAccess;

const TOPICS = Array.from({ length: 7 }, (_, index) => ({ id: `tema-${index + 1}` }));

/** Resume los estados como "tema-1:available*" (el asterisco marca el tema actual). */
function summarize(completedIds) {
  return plain(resolveTopicStates(TOPICS, new Set(completedIds))).map(
    ({ id, status, isCurrent }) => `${id}:${status}${isCurrent ? '*' : ''}`
  );
}

describe('resolveTopicStates', () => {
  test('al inicio solo el tema 1 está disponible y es el actual', () => {
    assert.deepEqual(summarize([]), [
      'tema-1:available*',
      'tema-2:locked',
      'tema-3:locked',
      'tema-4:locked',
      'tema-5:locked',
      'tema-6:locked',
      'tema-7:locked',
    ]);
  });

  test('completar un tema habilita solo el siguiente', () => {
    assert.deepEqual(summarize(['tema-1']).slice(0, 3), [
      'tema-1:completed',
      'tema-2:available*',
      'tema-3:locked',
    ]);
  });

  test('el tema actual avanza con los temas completados', () => {
    assert.deepEqual(summarize(['tema-1', 'tema-2', 'tema-3']).slice(2, 5), [
      'tema-3:completed',
      'tema-4:available*',
      'tema-5:locked',
    ]);
  });

  test('con todos los temas completados no hay tema actual ni bloqueos', () => {
    const states = summarize(TOPICS.map((topic) => topic.id));
    assert.ok(states.every((state) => state.endsWith(':completed')));
  });

  test('un tema reportado como completado nunca aparece bloqueado', () => {
    // La API reporta el tema 3 aunque el 2 no esté completado.
    assert.deepEqual(summarize(['tema-1', 'tema-3']).slice(0, 5), [
      'tema-1:completed',
      'tema-2:available*',
      'tema-3:completed',
      'tema-4:available',
      'tema-5:locked',
    ]);
  });

  test('solo hay un tema actual como máximo', () => {
    const states = plain(resolveTopicStates(TOPICS, new Set(['tema-1', 'tema-3'])));
    assert.equal(states.filter((state) => state.isCurrent).length, 1);
  });

  test('conserva el orden y la cantidad de temas', () => {
    const states = plain(resolveTopicStates(TOPICS, new Set()));
    assert.deepEqual(
      states.map((state) => state.id),
      TOPICS.map((topic) => topic.id)
    );
  });

  test('expone los tres estados posibles', () => {
    assert.deepEqual(plain(TopicStatus), {
      LOCKED: 'locked',
      AVAILABLE: 'available',
      COMPLETED: 'completed',
    });
  });
});
