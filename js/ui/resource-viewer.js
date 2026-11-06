/**
 * Visor de recursos de un tema (video, documento, pódcast y actividad interactiva).
 * Usa el modal de Bootstrap. El contenido de cada formato se carga solo cuando
 * se selecciona y se descarta al cerrar, para no reproducir medios en segundo plano.
 */
(function (MiRed) {
  'use strict';

  /** @type {bootstrap.Modal | null} */
  let modal = null;
  let elements = null;
  let config = null;
  let activeTopic = null;
  /** Elemento que abrió el visor; recibe de nuevo el foco al cerrarlo (WCAG 2.4.3). */
  let returnFocusTo = null;

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------

  /**
   * Convierte un enlace de YouTube o Vimeo en su URL de inserción.
   * @param {string} url
   * @returns {string | null}
   */
  function toVideoEmbedUrl(url) {
    if (!url) return null;
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (host === 'youtu.be' && segments[0]) {
      return `https://www.youtube-nocookie.com/embed/${segments[0]}`;
    }
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const id =
        parsed.searchParams.get('v') ||
        (['embed', 'shorts', 'live'].includes(segments[0]) ? segments[1] : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com' && /^\d+$/.test(segments[0] ?? '')) {
      return `https://player.vimeo.com/video/${segments[0]}`;
    }
    if (host === 'player.vimeo.com') return parsed.href;
    return null;
  }

  function createElement(tag, attributes = {}, text) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    if (text) element.textContent = text;
    return element;
  }

  const VIDEO_IFRAME_ID = 'video-tema';
  const PDF_IFRAME_ID = 'pdf-tema';
  const PDF_VIEWER_PATH = 'lib/visor/web/viewer.html';

  /** Identifica cada interacción con un recurso (una apertura = una sesión). */
  let activeSessionId = null;

  /** URL del visor PDF.js; el PDF debe ser del mismo origen que el visor. */
  function toPdfViewerUrl(pdfSrc) {
    const absolutePdf = new URL(pdfSrc, document.baseURI).href;
    return `${PDF_VIEWER_PATH}?file=${encodeURIComponent(absolutePdf)}`;
  }

  /** Pide al visor que guarde el avance final de la sesión PDF en curso. */
  function finalizePdfSession() {
    const frame = document.getElementById(PDF_IFRAME_ID);
    frame?.contentWindow?.postMessage({ tipo: 'FINALIZAR_SESION_PDF' }, window.location.origin);
  }

  /** Atiende la solicitud de sesión que el visor PDF envía al cargar. */
  function handleViewerMessage(event) {
    if (event.origin !== window.location.origin) return;
    const frame = document.getElementById(PDF_IFRAME_ID);
    if (!frame || event.source !== frame.contentWindow) return;
    if (event.data?.tipo === 'SOLICITAR_SESION_PDF') {
      frame.contentWindow.postMessage(
        { tipo: 'RESPUESTA_SESION_PDF', idSesion: activeSessionId },
        window.location.origin
      );
    }
  }

  function stopVideoTracking() {
    if (typeof detener_seguimiento_video === 'function') detener_seguimiento_video();
  }

  function createFrame(src, title, extraClass, id) {
    const wrapper = createElement('div', { class: `resource-frame ${extraClass}` });
    wrapper.append(
      createElement('iframe', {
        ...(id ? { id } : {}),
        src,
        title,
        loading: 'lazy',
        // Sin "autoplay": ningún recurso se reproduce solo (WCAG 1.4.2).
        allow: 'encrypted-media; fullscreen; picture-in-picture',
        allowfullscreen: '',
        referrerpolicy: 'strict-origin-when-cross-origin',
      })
    );
    return wrapper;
  }

  function createOpenLink(href, label) {
    const link = createElement('a', {
      class: 'btn-resource-link',
      href,
      target: '_blank',
      rel: 'noopener',
    });
    link.append(document.createTextNode(label));
    link.insertAdjacentHTML(
      'beforeend',
      '<svg class="icon" aria-hidden="true"><use href="#icon-external"/></svg>'
    );
    return link;
  }

  function createEmptyState(label) {
    return createElement(
      'p',
      { class: 'resource-empty' },
      `El recurso "${label}" de este tema aún no está disponible.`
    );
  }

  // ---------------------------------------------------------------------------
  // Renderizado por formato
  // ---------------------------------------------------------------------------

  const renderers = Object.freeze({
    video(resource, type, topic) {
      const embedUrl = toVideoEmbedUrl(resource.url);
      if (!embedUrl) return [createEmptyState(type.label)];
      return [
        createFrame(embedUrl, `${type.label}: ${topic.title}`, 'ratio ratio-16x9', VIDEO_IFRAME_ID),
      ];
    },

    document(resource, type, topic) {
      if (!resource.src) return [createEmptyState(type.label)];
      return [
        createFrame(
          toPdfViewerUrl(resource.src),
          `${type.label}: ${topic.title}`,
          'resource-frame--document',
          PDF_IFRAME_ID
        ),
        // Se abre el PDF original: en otra pestaña no hay sesión ni seguimiento.
        createOpenLink(resource.src, 'Abrir el documento en una pestaña nueva'),
      ];
    },

    podcast(resource, type, topic) {
      if (!resource.src) return [createEmptyState(type.label)];
      const audio = createElement('audio', {
        class: 'w-100',
        'aria-label': `${type.label}: ${topic.title}`,
        controls: '',
        preload: 'metadata',
        src: resource.src,
      });
      audio.append(document.createTextNode('Tu navegador no puede reproducir este audio.'));
      const wrapper = createElement('div', { class: 'resource-audio' });
      wrapper.append(audio);
      return [wrapper];
    },

    multimedia(resource, type, topic) {
      if (!resource.src) return [createEmptyState(type.label)];
      return [
        createFrame(resource.src, `${type.label}: ${topic.title}`, 'ratio ratio-16x9'),
        createOpenLink(resource.src, 'Abrir la actividad en una pestaña nueva'),
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // Pestañas
  // ---------------------------------------------------------------------------

  function getTabs() {
    return [...elements.tabs.querySelectorAll('[role="tab"]')];
  }

  function selectResource(resourceKey, { focus = false } = {}) {
    const type = config.resourceTypes.find((item) => item.key === resourceKey);
    if (!type || !activeTopic) return;

    getTabs().forEach((tab) => {
      const isSelected = tab.dataset.resourceKey === resourceKey;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      if (isSelected) {
        elements.panel.setAttribute('aria-labelledby', tab.id);
        if (focus) tab.focus();
      }
    });

    const resource = activeTopic.resources[resourceKey] ?? {};
    finalizePdfSession();
    stopVideoTracking();
    activeSessionId = crypto.randomUUID();
    elements.panel.replaceChildren(...renderers[resourceKey](resource, type, activeTopic));

    // El seguimiento solo aplica a videos de Vimeo (el SDK no soporta YouTube).
    if (resourceKey === 'video') {
      const iframe = document.getElementById(VIDEO_IFRAME_ID);
      if (iframe && new URL(iframe.src).hostname === 'player.vimeo.com') {
        seguimiento_reproductor_video(VIDEO_IFRAME_ID, {
          topicId: activeTopic.id,
          idSesion: activeSessionId,
        });
      }
    }

    // El visor PDF responde con SOLICITAR_SESION_PDF y recibe el idSesion.
    if (resourceKey === 'document') {
      const frame = document.getElementById(PDF_IFRAME_ID);
      frame?.addEventListener('load', () => {
        frame.contentWindow.postMessage({ tipo: 'SOLICITAR_SESION_PDF' }, window.location.origin);
      });
    }
  }

  function buildTabs() {
    const tabs = config.resourceTypes.map((type) => {
      const tab = createElement('button', {
        type: 'button',
        class: `nav-link resource-tab resource-tab--${type.key}`,
        role: 'tab',
        id: `resource-tab-${type.key}`,
        'aria-controls': 'resource-panel',
      });
      tab.dataset.resourceKey = type.key;
      tab.insertAdjacentHTML(
        'afterbegin',
        `<span class="resource-tab__icon"><svg aria-hidden="true"><use href="#${type.icon}"/></svg></span>`
      );
      tab.append(document.createTextNode(type.label));
      return tab;
    });
    elements.tabs.replaceChildren(...tabs);
  }

  function handleTabKeydown(event) {
    const tabs = getTabs();
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;

    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let nextIndex = null;
    if (event.key in moves) nextIndex = (index + moves[event.key] + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    selectResource(tabs[nextIndex].dataset.resourceKey, { focus: true });
  }

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------

  /**
   * @param {object} options
   * @param {HTMLElement} options.modalElement
   * @param {typeof MiRed.courseConfig} options.courseConfig
   */
  function initResourceViewer({ modalElement, courseConfig }) {
    config = courseConfig;
    modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    elements = {
      eyebrow: modalElement.querySelector('[data-viewer-eyebrow]'),
      title: modalElement.querySelector('[data-viewer-title]'),
      tabs: modalElement.querySelector('[data-viewer-tabs]'),
      panel: modalElement.querySelector('[data-viewer-panel]'),
    };

    buildTabs();
    elements.tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) selectResource(tab.dataset.resourceKey);
    });
    elements.tabs.addEventListener('keydown', handleTabKeydown);

    window.addEventListener('message', handleViewerMessage);

    // Antes de ocultar: el iframe aún existe y puede guardar su avance final.
    modalElement.addEventListener('hide.bs.modal', finalizePdfSession);

    modalElement.addEventListener('hidden.bs.modal', () => {
      stopVideoTracking();
      activeSessionId = null;
      elements.panel.replaceChildren();
      activeTopic = null;
      if (returnFocusTo?.isConnected) returnFocusTo.focus();
      returnFocusTo = null;
    });
  }

  /**
   * Abre el visor de un tema en el formato indicado.
   * @param {string} topicId
   * @param {string} resourceKey
   */
  function openResource(topicId, resourceKey) {
    const topic = config.topics.find((item) => item.id === topicId);
    if (!topic) return;

    activeTopic = topic;
    returnFocusTo = document.activeElement;
    elements.eyebrow.textContent = `${config.topicLabel} ${topic.number}`;
    elements.title.textContent = topic.title;
    selectResource(resourceKey);
    modal.show();
  }

  MiRed.resourceViewer = Object.freeze({ initResourceViewer, openResource, toVideoEmbedUrl });
})((window.MiRed = window.MiRed || {}));
