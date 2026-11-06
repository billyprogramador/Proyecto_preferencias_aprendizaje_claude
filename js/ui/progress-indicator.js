/**
 * Indicador visual del progreso general. Solo manipula el DOM; no calcula.
 */
(function (MiRed) {
  'use strict';

  const SELECTORS = Object.freeze({
    bar: '[data-overall-progress-bar]',
    fill: '[data-overall-progress-fill]',
    value: '[data-overall-progress-value]',
  });

  /**
   * Pinta el porcentaje de avance general en la barra y en el texto.
   * @param {number} percentage  entero entre 0 y 100
   * @param {ParentNode} [root=document]
   */
  function renderOverallProgress(percentage, root = document) {
    const bar = root.querySelector(SELECTORS.bar);
    const fill = root.querySelector(SELECTORS.fill);
    const value = root.querySelector(SELECTORS.value);
    if (!bar || !fill || !value) return;

    const text = `${percentage} %`;
    fill.style.width = `${percentage}%`;
    bar.setAttribute('aria-valuenow', String(percentage));
    bar.setAttribute('aria-valuetext', text);
    value.textContent = text;
  }

  MiRed.progressIndicator = Object.freeze({ renderOverallProgress });
})((window.MiRed = window.MiRed || {}));
