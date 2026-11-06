/**
 * Integridad de la configuración del curso y de los archivos de contenido.
 */
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadScripts, PROJECT_ROOT, plain } = require('./helpers/load-scripts');

const { courseConfig, resourceViewer } = loadScripts([
  'js/config/course-config.js',
  'js/ui/resource-viewer.js',
]);
const { topics, resourceTypes } = courseConfig;
const indexHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

describe('course-config', () => {
  test('publica exactamente 7 temas numerados del 1 al 7', () => {
    assert.equal(topics.length, 7);
    topics.forEach((topic, index) => {
      assert.equal(topic.number, index + 1);
      assert.equal(topic.id, `tema-${index + 1}`);
    });
  });

  test('los identificadores son únicos', () => {
    assert.equal(new Set(topics.map((topic) => topic.id)).size, topics.length);
  });

  test('cada tema tiene título, descripción y duración válidos', () => {
    topics.forEach((topic) => {
      assert.ok(topic.title.trim(), `${topic.id}: título vacío`);
      assert.ok(topic.description.trim(), `${topic.id}: descripción vacía`);
      assert.ok(Number.isInteger(topic.durationMinutes) && topic.durationMinutes > 0);
    });
  });

  test('cada tema define los 4 formatos', () => {
    const keys = plain(resourceTypes.map((type) => type.key));
    assert.deepEqual(keys, ['video', 'document', 'podcast', 'multimedia']);
    topics.forEach((topic) => {
      assert.deepEqual(Object.keys(topic.resources).sort(), [...keys].sort(), topic.id);
    });
  });

  test('los archivos locales de cada tema existen', () => {
    topics.forEach((topic) => {
      ['document', 'multimedia'].forEach((key) => {
        const src = topic.resources[key].src;
        assert.ok(fs.existsSync(path.join(PROJECT_ROOT, src)), `No existe ${src}`);
      });
    });
  });

  test('las URL de video y pódcast configuradas son de YouTube o Vimeo', () => {
    topics.forEach((topic) => {
      ['video', 'podcast'].forEach((key) => {
        const url = topic.resources[key].url;
        if (!url) return;
        assert.ok(
          resourceViewer.toVideoEmbedUrl(url),
          `${topic.id}: URL de ${key} no reconocida`
        );
      });
    });
  });

  test('cada ícono usado existe en index.html', () => {
    const icons = [
      ...topics.map((topic) => topic.icon),
      ...resourceTypes.map((type) => type.icon),
    ];
    icons.forEach((icon) => {
      assert.ok(indexHtml.includes(`<symbol id="${icon}"`), `Falta el ícono ${icon}`);
    });
  });

  test('la configuración no se puede modificar en tiempo de ejecución', () => {
    assert.ok(Object.isFrozen(courseConfig));
    assert.ok(Object.isFrozen(topics));
    assert.ok(Object.isFrozen(topics[0].resources));
  });
});

describe('toVideoEmbedUrl', () => {
  const embed = resourceViewer.toVideoEmbedUrl;

  test('convierte enlaces de YouTube', () => {
    const expected = 'https://www.youtube-nocookie.com/embed/abc123';
    assert.equal(embed('https://www.youtube.com/watch?v=abc123'), expected);
    assert.equal(embed('https://youtu.be/abc123'), expected);
    assert.equal(embed('https://www.youtube.com/embed/abc123'), expected);
    assert.equal(embed('https://www.youtube.com/shorts/abc123'), expected);
  });

  test('convierte enlaces de Vimeo', () => {
    assert.equal(embed('https://vimeo.com/12345'), 'https://player.vimeo.com/video/12345');
    assert.equal(
      embed('https://player.vimeo.com/video/12345'),
      'https://player.vimeo.com/video/12345'
    );
  });

  test('rechaza valores vacíos, inválidos o de otros sitios', () => {
    ['', null, undefined, 'no es url', 'https://ejemplo.com/video', 'javascript:alert(1)'].forEach(
      (value) => assert.equal(embed(value), null, String(value))
    );
  });
});
