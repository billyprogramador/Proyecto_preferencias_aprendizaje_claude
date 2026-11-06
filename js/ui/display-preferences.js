/**
 * Preferencias de visualización: tamaño del texto y modo oscuro.
 * Se recuerdan en el navegador del usuario (si el almacenamiento está disponible).
 */
(function (MiRed) {
  'use strict';

  const STORAGE_KEY = 'miRed.displayPreferences';
  const FONT_SCALES = Object.freeze([0.875, 1, 1.125, 1.25, 1.375]);
  const DEFAULT_SCALE_INDEX = 1;
  const Theme = Object.freeze({ LIGHT: 'light', DARK: 'dark' });

  const state = { scaleIndex: DEFAULT_SCALE_INDEX, theme: Theme.LIGHT };

  function readStoredPreferences() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
      return {};
    }
  }

  function storePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Almacenamiento no disponible: la preferencia dura solo esta visita. */
    }
  }

  function clampScaleIndex(index) {
    return Math.min(Math.max(Number(index) || 0, 0), FONT_SCALES.length - 1);
  }

  function applyFontScale() {
    document.documentElement.style.fontSize = `${FONT_SCALES[state.scaleIndex] * 100}%`;

    document.querySelectorAll('[data-action="font-increase"]').forEach((button) => {
      button.disabled = state.scaleIndex === FONT_SCALES.length - 1;
    });
    document.querySelectorAll('[data-action="font-decrease"]').forEach((button) => {
      button.disabled = state.scaleIndex === 0;
    });
  }

  function applyTheme() {
    const isDark = state.theme === Theme.DARK;
    document.documentElement.setAttribute('data-bs-theme', state.theme);

    document.querySelectorAll('[data-action="theme-toggle"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
    });
    // El nombre del botón no cambia: su estado lo comunica aria-pressed.
    document.querySelectorAll('[data-theme-icon]').forEach((use) => {
      use.setAttribute('href', isDark ? '#icon-sun' : '#icon-moon');
    });
  }

  const actions = Object.freeze({
    'font-increase': () => {
      state.scaleIndex = clampScaleIndex(state.scaleIndex + 1);
      applyFontScale();
    },
    'font-decrease': () => {
      state.scaleIndex = clampScaleIndex(state.scaleIndex - 1);
      applyFontScale();
    },
    'theme-toggle': () => {
      state.theme = state.theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
      applyTheme();
    },
  });

  function initDisplayPreferences() {
    const stored = readStoredPreferences();
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    state.scaleIndex = clampScaleIndex(stored.scaleIndex ?? DEFAULT_SCALE_INDEX);
    state.theme = Object.values(Theme).includes(stored.theme)
      ? stored.theme
      : prefersDark ? Theme.DARK : Theme.LIGHT;

    applyFontScale();
    applyTheme();

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      const action = button && actions[button.dataset.action];
      if (!action) return;
      action();
      storePreferences();
    });
  }

  MiRed.displayPreferences = Object.freeze({ initDisplayPreferences });
})((window.MiRed = window.MiRed || {}));
