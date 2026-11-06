/**
 * Arranque de la aplicación: conecta los módulos una vez cargado el DOM.
 * (Los scripts usan `defer`, por lo que se ejecutan con el DOM ya disponible.)
 */
(function (MiRed) {
  'use strict';

  const { courseConfig, displayPreferences, topicCards, resourceViewer, courseProgress } = MiRed;

  displayPreferences.initDisplayPreferences();

  resourceViewer.initResourceViewer({
    modalElement: document.getElementById('resource-viewer'),
    courseConfig,
  });

  topicCards.renderTopicCards({
    container: document.querySelector('[data-topic-list]'),
    courseConfig,
    onOpenResource: resourceViewer.openResource,
  });

  // Estado inicial: ningún tema completado → solo el tema 1 disponible.
  // Cuando exista la API, su respuesta se entrega a MiRed.trackingAdapter.
  courseProgress.initCourseProgress(courseConfig.topics);
})(window.MiRed);
