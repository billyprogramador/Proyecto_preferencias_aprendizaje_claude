/**
 * Cálculo del avance general. Funciones puras: no leen ni modifican el DOM.
 */
(function (MiRed) {
  'use strict';

  /**
   * Normaliza una lista de identificadores de temas completados:
   * elimina duplicados (p. ej. varios formatos consultados del mismo tema)
   * y descarta los que no pertenecen al curso.
   *
   * @param {Iterable<string>} completedTopicIds
   * @param {ReadonlyArray<string>} courseTopicIds
   * @returns {Set<string>}
   */
  function normalizeCompletedTopicIds(completedTopicIds, courseTopicIds) {
    const validIds = new Set(courseTopicIds);
    const normalized = new Set();

    for (const id of completedTopicIds ?? []) {
      const topicId = String(id).trim();
      if (validIds.has(topicId)) normalized.add(topicId);
    }
    return normalized;
  }

  /**
   * Porcentaje de avance general (0–100, entero).
   * @param {number} completedCount
   * @param {number} totalCount
   * @returns {number}
   */
  function calculateOverallPercentage(completedCount, totalCount) {
    if (!Number.isFinite(totalCount) || totalCount <= 0) return 0;
    const safeCompleted = Math.min(Math.max(completedCount, 0), totalCount);
    return Math.round((safeCompleted / totalCount) * 100);
  }

  MiRed.progressCalculator = Object.freeze({
    normalizeCompletedTopicIds,
    calculateOverallPercentage,
  });
})((window.MiRed = window.MiRed || {}));
