/**
 * Punto de integración con la API externa de seguimiento.
 *
 * La URL, la autenticación y la estructura de la respuesta de la API aún no
 * están definidas, por eso aquí NO se hace ninguna petición ni se asume un
 * formato. Esta capa solo se encarga de:
 *   1. Recibir la respuesta ya obtenida.
 *   2. Traducirla a una lista de identificadores de temas completados
 *      mediante una función de extracción que se escribirá cuando se conozca
 *      el formato real.
 *   3. Entregar esa lista a `courseProgress.updateCourseProgress`, que se encarga
 *      del cálculo y de la interfaz (sin duplicar esa lógica aquí).
 *
 * Los identificadores de tema esperados son los de course-config.js:
 * "tema-1", "tema-2", …, "tema-7". Si la API reporta varios formatos de un
 * mismo tema, el identificador repetido se cuenta una sola vez.
 */
(function (MiRed) {
  'use strict';

  const { updateCourseProgress } = MiRed.courseProgress;

  /**
   * Aplica directamente una lista de temas completados.
   * @param {Iterable<string>} completedTopicIds
   * @returns {{ completedTopicIds: string[], percentage: number }}
   */
  function applyCompletedTopicIds(completedTopicIds) {
    return updateCourseProgress(completedTopicIds);
  }

  /**
   * Procesa una respuesta de la API de seguimiento.
   *
   * @param {unknown} response  respuesta de la API, tal como llegue
   * @param {(response: unknown) => Iterable<string>} extractCompletedTopicIds
   *        función que, según el formato definitivo de la API, devuelve los
   *        identificadores de los temas completados
   * @returns {{ completedTopicIds: string[], percentage: number }}
   */
  function processTrackingResponse(response, extractCompletedTopicIds) {
    if (typeof extractCompletedTopicIds !== 'function') {
      throw new TypeError(
        'processTrackingResponse necesita una función que extraiga los temas completados de la respuesta.'
      );
    }
    return applyCompletedTopicIds(extractCompletedTopicIds(response));
  }

  MiRed.trackingAdapter = Object.freeze({
    applyCompletedTopicIds,
    processTrackingResponse,
  });
})((window.MiRed = window.MiRed || {}));
