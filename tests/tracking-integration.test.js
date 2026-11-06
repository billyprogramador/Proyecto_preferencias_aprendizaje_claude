/**
 * Integración: adaptador de seguimiento → coordinador → interfaz.
 * La interfaz se reemplaza por espías para verificar qué recibe y cuántas veces.
 */
'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, plain } = require('./helpers/load-scripts');

const TOPICS = Array.from({ length: 7 }, (_, index) => ({ id: `tema-${index + 1}` }));

function setup() {
  const calls = { renderOverallProgress: [], applyTopicStates: [] };
  const MiRed = loadScripts(
    [
      'js/progress/progress-calculator.js',
      'js/progress/topic-access.js',
      'js/progress/course-progress.js',
      'js/integration/tracking-adapter.js',
    ],
    {
      progressIndicator: {
        renderOverallProgress: (percentage) => calls.renderOverallProgress.push(percentage),
      },
      topicCards: {
        applyTopicStates: (states) => calls.applyTopicStates.push(plain(states)),
      },
    }
  );
  MiRed.courseProgress.initCourseProgress(TOPICS);
  return { MiRed, calls };
}

describe('courseProgress', () => {
  let MiRed;
  let calls;
  beforeEach(() => ({ MiRed, calls } = setup()));

  test('el arranque pinta 0 % y bloquea desde el tema 2', () => {
    assert.deepEqual(calls.renderOverallProgress, [0]);
    const [states] = calls.applyTopicStates;
    assert.equal(states[0].status, 'available');
    assert.ok(states.slice(1).every((state) => state.status === 'locked'));
  });

  test('cada actualización pinta la interfaz exactamente una vez', () => {
    MiRed.courseProgress.updateCourseProgress(['tema-1']);
    assert.equal(calls.renderOverallProgress.length, 2);
    assert.equal(calls.applyTopicStates.length, 2);
  });

  test('getCompletedTopicIds devuelve una copia que no altera el estado interno', () => {
    MiRed.courseProgress.updateCourseProgress(['tema-1']);
    const copy = MiRed.courseProgress.getCompletedTopicIds();
    copy.push('tema-7');
    assert.deepEqual(plain(MiRed.courseProgress.getCompletedTopicIds()), ['tema-1']);
  });

  test('cada actualización reemplaza el estado anterior (no lo acumula)', () => {
    MiRed.courseProgress.updateCourseProgress(['tema-1', 'tema-2']);
    const result = MiRed.courseProgress.updateCourseProgress(['tema-1']);
    assert.equal(result.percentage, 14);
  });
});

describe('trackingAdapter', () => {
  let MiRed;
  let calls;
  beforeEach(() => ({ MiRed, calls } = setup()));

  test('applyCompletedTopicIds actualiza progreso y acceso', () => {
    const result = plain(MiRed.trackingAdapter.applyCompletedTopicIds(['tema-1', 'tema-2']));
    assert.deepEqual(result, { completedTopicIds: ['tema-1', 'tema-2'], percentage: 29 });
    assert.equal(calls.renderOverallProgress.at(-1), 29);
    assert.equal(calls.applyTopicStates.at(-1)[2].status, 'available');
  });

  test('varios formatos del mismo tema no duplican el avance', () => {
    const result = MiRed.trackingAdapter.applyCompletedTopicIds([
      'tema-1', // video
      'tema-1', // documento
      'tema-1', // pódcast
      'tema-1', // multimedia
    ]);
    assert.equal(result.percentage, 14);
  });

  test('processTrackingResponse delega en la función de extracción', () => {
    const response = { cualquier: 'estructura' };
    let received;
    const result = MiRed.trackingAdapter.processTrackingResponse(response, (value) => {
      received = value;
      return ['tema-1', 'tema-2', 'tema-3'];
    });
    assert.equal(received, response);
    assert.equal(result.percentage, 43);
  });

  test('processTrackingResponse exige una función de extracción', () => {
    assert.throws(() => MiRed.trackingAdapter.processTrackingResponse({}), {
      name: 'TypeError',
    });
    assert.throws(() => MiRed.trackingAdapter.processTrackingResponse({}, 'no-es-funcion'), {
      name: 'TypeError',
    });
    // El fallo no debe modificar la interfaz.
    assert.equal(calls.renderOverallProgress.length, 1);
  });

  test('una extracción vacía o nula deja el curso en 0 %', () => {
    assert.equal(MiRed.trackingAdapter.processTrackingResponse({}, () => null).percentage, 0);
    assert.equal(MiRed.trackingAdapter.processTrackingResponse({}, () => []).percentage, 0);
  });

  test('ignora temas desconocidos en la respuesta', () => {
    const result = MiRed.trackingAdapter.applyCompletedTopicIds(['tema-1', 'tema-8', 'x']);
    assert.deepEqual(plain(result.completedTopicIds), ['tema-1']);
  });
});
