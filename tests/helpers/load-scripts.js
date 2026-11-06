/**
 * Carga los scripts del navegador (patrón IIFE sobre window.MiRed) dentro de
 * un contexto aislado de Node, sin DOM real ni dependencias externas.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * @param {string[]} relativePaths  scripts en el orden en que los carga index.html
 * @param {object} [preset]         módulos simulados que se colocan en MiRed antes de cargar
 * @returns {object} el objeto MiRed resultante
 */
function loadScripts(relativePaths, preset = {}) {
  const window = { MiRed: { ...preset } };
  const context = vm.createContext({ window, console, URL });

  relativePaths.forEach((relativePath) => {
    const filePath = path.join(PROJECT_ROOT, relativePath);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
  });

  return window.MiRed;
}

/** Convierte valores creados dentro del contexto aislado en valores comparables. */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { PROJECT_ROOT, loadScripts, plain };
