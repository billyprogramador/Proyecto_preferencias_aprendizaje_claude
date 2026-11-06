/**
 * Tarjetas de los temas: se construyen una sola vez a partir de la configuración
 * y luego solo se actualiza su estado (bloqueado, disponible, completado).
 */
(function (MiRed) {
  'use strict';

  const { TopicStatus } = MiRed.topicAccess;

  const STATE_CLASSES = Object.freeze({
    [TopicStatus.LOCKED]: 'is-locked',
    [TopicStatus.AVAILABLE]: 'is-available',
    [TopicStatus.COMPLETED]: 'is-completed',
  });

  /** @type {HTMLElement | null} */
  let listElement = null;
  /** @type {typeof MiRed.courseConfig | null} */
  let config = null;

  function formatEyebrow(topic) {
    return `${config.topicLabel} ${topic.number}`;
  }

  function createResourceButton(template, resourceType, topic) {
    const item = template.content.firstElementChild.cloneNode(true);
    const button = item.querySelector('[data-resource-button]');

    button.dataset.resourceKey = resourceType.key;
    button.classList.add(`resource-button--${resourceType.key}`);
    button.setAttribute('aria-label', `${resourceType.label}: ${formatEyebrow(topic)}`);
    item.querySelector('[data-resource-icon]').setAttribute('href', `#${resourceType.icon}`);
    item.querySelector('[data-resource-label]').textContent = resourceType.label;
    return item;
  }

  function createCard(cardTemplate, resourceTemplate, topic) {
    const item = cardTemplate.content.firstElementChild.cloneNode(true);
    const card = item.querySelector('.topic-card');
    const titleId = `${topic.id}-title`;

    card.dataset.topicId = topic.id;
    card.setAttribute('aria-labelledby', titleId);

    item.querySelector('[data-topic-icon]').setAttribute('href', `#${topic.icon}`);
    item.querySelector('[data-topic-eyebrow]').textContent = formatEyebrow(topic);
    const title = item.querySelector('[data-topic-title]');
    title.id = titleId;
    title.textContent = topic.title;
    item.querySelector('[data-topic-description]').textContent = topic.description;
    item.querySelector('[data-topic-duration]').textContent =
      `Duración estimada: ${topic.durationMinutes} min`;
    item.querySelector('[data-locked-text]').textContent = config.lockedMessage;
    item
      .querySelector('[data-topic-enter]')
      .setAttribute('aria-label', `Entrar a ${formatEyebrow(topic)}: ${topic.title}`);

    const resourceList = item.querySelector('[data-resource-list]');
    config.resourceTypes.forEach((type) => {
      resourceList.append(createResourceButton(resourceTemplate, type, topic));
    });

    return item;
  }

  /**
   * Construye las tarjetas y registra un único manejador de clics (delegación).
   * @param {object} options
   * @param {HTMLElement} options.container
   * @param {typeof MiRed.courseConfig} options.courseConfig
   * @param {(topicId: string, resourceKey: string) => void} options.onOpenResource
   */
  function renderTopicCards({ container, courseConfig, onOpenResource }) {
    listElement = container;
    config = courseConfig;

    const cardTemplate = document.getElementById('topic-card-template');
    const resourceTemplate = document.getElementById('resource-button-template');
    const fragment = document.createDocumentFragment();

    config.topics.forEach((topic) => {
      fragment.append(createCard(cardTemplate, resourceTemplate, topic));
    });
    listElement.replaceChildren(fragment);

    listElement.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-resource-button], [data-topic-enter]');
      if (!trigger || trigger.disabled) return;

      const card = trigger.closest('.topic-card');
      if (!card || card.dataset.status === TopicStatus.LOCKED) return;

      const resourceKey = trigger.dataset.resourceKey ?? config.resourceTypes[0].key;
      onOpenResource(card.dataset.topicId, resourceKey);
    });
  }

  /**
   * Refleja en la interfaz el estado de acceso de cada tema.
   * @param {Array<{id: string, status: string, isCurrent: boolean}>} topicStates
   */
  function applyTopicStates(topicStates) {
    if (!listElement) return;

    topicStates.forEach(({ id, status, isCurrent }) => {
      const card = listElement.querySelector(`.topic-card[data-topic-id="${CSS.escape(id)}"]`);
      if (!card) return;

      const isLocked = status === TopicStatus.LOCKED;
      const isCompleted = status === TopicStatus.COMPLETED;

      card.dataset.status = status;
      card.classList.remove(...Object.values(STATE_CLASSES));
      card.classList.add(STATE_CLASSES[status]);
      card.classList.toggle('is-current', isCurrent);
      if (isCurrent) card.setAttribute('aria-current', 'step');
      else card.removeAttribute('aria-current');

      card.querySelector('[data-locked-note]').hidden = !isLocked;
      card.querySelectorAll('button').forEach((button) => {
        button.disabled = isLocked;
      });

      card.querySelector('[data-topic-status]').textContent = isCompleted
        ? config.statusLabels.completed
        : config.statusLabels.pending;
      card
        .querySelector('[data-topic-status-label]')
        .classList.toggle('status-label--completed', isCompleted);
    });
  }

  MiRed.topicCards = Object.freeze({ renderTopicCards, applyTopicStates });
})((window.MiRed = window.MiRed || {}));
