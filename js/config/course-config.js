/**
 * Configuración del curso: única fuente de verdad del contenido publicado.
 *
 * - Para cambiar textos, duraciones o rutas de los recursos, edita solo este archivo.
 * - Los archivos de cada tema viven en /contenido/tema-N/.
 * - `video.url` y `podcast.url` admiten enlaces de YouTube o Vimeo (watch, youtu.be o embed).
 *   Si se dejan vacíos, el visor muestra un aviso de "recurso pendiente".
 *   El seguimiento (play, pausa, etc.) solo funciona con enlaces de Vimeo.
 */
(function (MiRed) {
  'use strict';

  /** Formatos disponibles para cada tema, en el orden en que se muestran. */
  const RESOURCE_TYPES = Object.freeze([
    Object.freeze({ key: 'video', label: 'Video', icon: 'icon-video' }),
    Object.freeze({ key: 'document', label: 'Documento', icon: 'icon-document' }),
    Object.freeze({ key: 'podcast', label: 'Pódcast', icon: 'icon-podcast' }),
    Object.freeze({ key: 'multimedia', label: 'Recurso interactivo', icon: 'icon-multimedia' }),
  ]);

  /**
   * Crea la definición de un tema con las rutas estándar de sus recursos.
   * @param {object} topic
   * @param {number} topic.number
   * @param {string} topic.title
   * @param {string} topic.description
   * @param {number} topic.durationMinutes
   * @param {string} topic.icon   id del símbolo SVG definido en index.html
   * @param {string} [topic.videoUrl]
   * @param {string} [topic.podcastUrl]  el pódcast se publica como video de Vimeo
   */
  function defineTopic({
    number,
    title,
    description,
    durationMinutes,
    icon,
    videoUrl = '',
    podcastUrl = '',
  }) {
    const folder = `contenido/tema-${number}`;
    return Object.freeze({
      id: `tema-${number}`,
      number,
      title,
      description,
      durationMinutes,
      icon,
      resources: Object.freeze({
        video: Object.freeze({ url: videoUrl }),
        document: Object.freeze({ src: `${folder}/documento.pdf` }),
        podcast: Object.freeze({ url: podcastUrl }),
        multimedia: Object.freeze({ src: `${folder}/actividad/index.html` }),
      }),
    });
  }

  const TOPICS = Object.freeze([
    defineTopic({
      number: 1,
      title: 'Fundamentos y principios',
      description:
        'Qué es la seguridad social, sus principios (universalidad, solidaridad, integralidad, unidad y participación) y cómo está organizada.',
      durationMinutes: 20,
      icon: 'topic-shield',
      videoUrl: 'https://player.vimeo.com/video/1234190581?h=a9d9a65ef2&badge=0&autopause=0&player_id=0&app_id=58479',
      podcastUrl: 'https://player.vimeo.com/video/1234190581?h=a9d9a65ef2&badge=0&autopause=0&player_id=0&app_id=58479',
    }),
    defineTopic({
      number: 2,
      title: 'Protección frente a los riesgos',
      description:
        'Salud, riesgos laborales y maternidad, con el caso de Camilo, mensajero que sufre un accidente de trabajo.',
      durationMinutes: 25,
      icon: 'topic-helmet',
    }),
    defineTopic({
      number: 3,
      title: 'Vejez y protección al cesante',
      description: 'Pensión, semanas de cotización y qué hacer al perder el empleo.',
      durationMinutes: 20,
      icon: 'topic-elder',
    }),
    // Temas 4 a 7: textos de ejemplo. Reemplázalos con el contenido definitivo.
    defineTopic({
      number: 4,
      title: 'Título del tema 4',
      description: 'Descripción pendiente del tema 4.',
      durationMinutes: 20,
      icon: 'topic-family',
    }),
    defineTopic({
      number: 5,
      title: 'Título del tema 5',
      description: 'Descripción pendiente del tema 5.',
      durationMinutes: 20,
      icon: 'topic-briefcase',
    }),
    defineTopic({
      number: 6,
      title: 'Título del tema 6',
      description: 'Descripción pendiente del tema 6.',
      durationMinutes: 20,
      icon: 'topic-health',
    }),
    defineTopic({
      number: 7,
      title: 'Título del tema 7',
      description: 'Descripción pendiente del tema 7.',
      durationMinutes: 20,
      icon: 'topic-scale',
    }),
  ]);

  MiRed.courseConfig = Object.freeze({
    /** Etiqueta que se muestra antes del número ("Unidad 1"). */
    topicLabel: 'Tema',
    lockedMessage: 'Se activa al terminar la unidad anterior.',
    statusLabels: Object.freeze({ pending: 'Pendiente', completed: 'Completado' }),
    resourceTypes: RESOURCE_TYPES,
    topics: TOPICS,
  });
})((window.MiRed = window.MiRed || {}));
