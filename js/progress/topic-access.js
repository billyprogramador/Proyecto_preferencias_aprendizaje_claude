/**
 * Reglas de acceso secuencial a los temas. Funciones puras.
 *
 * - El primer tema siempre está disponible.
 * - Un tema se habilita solo cuando el anterior está completado.
 * - El "tema actual" es el primer tema disponible que aún no se completa.
 */
(function (MiRed) {
  'use strict';

  const TopicStatus = Object.freeze({
    LOCKED: 'locked',
    AVAILABLE: 'available',
    COMPLETED: 'completed',
  });

  /**
   * @param {ReadonlyArray<{id: string}>} topics  en orden del curso
   * @param {Set<string>} completedTopicIds       ya normalizados
   * @returns {Array<{id: string, status: string, isCurrent: boolean}>}
   */
  function resolveTopicStates(topics, completedTopicIds) {
    let currentAssigned = false;

    return topics.map((topic, index) => {
      const isCompleted = completedTopicIds.has(topic.id);
      const isUnlocked = index === 0 || completedTopicIds.has(topics[index - 1].id);

      // Un tema que el seguimiento reporta como completado nunca se muestra bloqueado.
      let status = TopicStatus.LOCKED;
      if (isCompleted) status = TopicStatus.COMPLETED;
      else if (isUnlocked) status = TopicStatus.AVAILABLE;

      const isCurrent = !currentAssigned && status === TopicStatus.AVAILABLE;
      if (isCurrent) currentAssigned = true;

      return { id: topic.id, status, isCurrent };
    });
  }

  MiRed.topicAccess = Object.freeze({ TopicStatus, resolveTopicStates });
})((window.MiRed = window.MiRed || {}));
