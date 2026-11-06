/**
 * Coordinador del progreso del curso.
 *
 * Recibe la lista de temas completados (venga de donde venga), la normaliza,
 * calcula el avance general y actualiza la interfaz. Es el único punto que
 * une el cálculo (progress-calculator, topic-access) con la vista
 * (progress-indicator, topic-cards).
 */
(function (MiRed) {
  'use strict';

  const { normalizeCompletedTopicIds, calculateOverallPercentage } = MiRed.progressCalculator;
  const { resolveTopicStates } = MiRed.topicAccess;
  const { renderOverallProgress } = MiRed.progressIndicator;
  const { applyTopicStates } = MiRed.topicCards;

  let topics = [];
  let completedTopicIds = new Set();

  /** @param {ReadonlyArray<{id: string}>} courseTopics */
  function initCourseProgress(courseTopics) {
    topics = courseTopics;
    updateCourseProgress([]);
  }

  /**
   * Actualiza el progreso general y el acceso a los temas.
   * @param {Iterable<string>} topicIds  identificadores de temas completados
   * @returns {{ completedTopicIds: string[], percentage: number }}
   */
  function updateCourseProgress(topicIds) {
    completedTopicIds = normalizeCompletedTopicIds(
      topicIds,
      topics.map((topic) => topic.id)
    );

    const percentage = calculateOverallPercentage(completedTopicIds.size, topics.length);
    renderOverallProgress(percentage);
    applyTopicStates(resolveTopicStates(topics, completedTopicIds));

    return { completedTopicIds: [...completedTopicIds], percentage };
  }

  /** @returns {string[]} */
  function getCompletedTopicIds() {
    return [...completedTopicIds];
  }

  MiRed.courseProgress = Object.freeze({
    initCourseProgress,
    updateCourseProgress,
    getCompletedTopicIds,
  });
})((window.MiRed = window.MiRed || {}));
