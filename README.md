# Mi red de protección — plantilla web

Sitio estático (HTML + JavaScript vanilla + Bootstrap 5.3.8) con los 7 temas del curso,
desbloqueo secuencial y progreso general, preparado para integrarse con la API de seguimiento.

## Cómo ejecutarlo

Abre `index.html` en el navegador. Para que los documentos y actividades se carguen igual
que en producción, se recomienda servir la carpeta con cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

Bootstrap 5.3.8 y las fuentes se cargan desde CDN (con verificación SRI). No hay otras dependencias.

## Estructura

```
index.html                       Maquetación, íconos SVG y plantillas <template>
css/styles.css                   Estilos personalizados (tokens, modo oscuro, responsive)
assets/img/                      Imágenes del diseño
contenido/tema-N/                Recursos de cada tema
  documento.pdf
  podcast.mp3
  actividad/index.html           Paquete multimedia (se muestra en un iframe)
js/
  config/course-config.js        Textos, duraciones y rutas de los 7 temas (fuente única)
  progress/progress-calculator.js  Cálculo del porcentaje (funciones puras)
  progress/topic-access.js         Reglas de desbloqueo secuencial (funciones puras)
  progress/course-progress.js      Coordinador: cálculo → interfaz
  ui/progress-indicator.js         Pinta la barra de progreso general
  ui/topic-cards.js                Construye las tarjetas y aplica su estado
  ui/resource-viewer.js            Visor modal de video, documento, pódcast y actividad
  ui/display-preferences.js        Tamaño de texto y modo oscuro
  integration/tracking-adapter.js  Punto de entrada de los datos de la API
  app.js                           Arranque
```

Todo el código se expone bajo un único objeto global, `window.MiRed`, para no contaminar el
ámbito global y para que funcione también abriendo el archivo directamente (sin módulos ES).

## Contenido

- Los temas 1–3 usan los textos de la imagen de referencia; los temas 4–7 tienen textos de
  ejemplo. Edita solo `js/config/course-config.js`.
- Los PDF, MP3 y actividades incluidos son de ejemplo: reemplázalos con los mismos nombres.
- Para el video, completa `videoUrl` del tema con un enlace de YouTube o Vimeo. Mientras esté
  vacío, el visor muestra "recurso aún no disponible".

## Flujo del progreso

```
respuesta API ──► trackingAdapter ──► courseProgress.updateCourseProgress(ids)
                                         ├─ progressCalculator  (normaliza y calcula %)
                                         ├─ topicAccess         (bloqueado / disponible / completado)
                                         ├─ progressIndicator   (barra y texto)
                                         └─ topicCards          (estado de cada tarjeta)
```

- Avance general = temas completados ÷ 7, redondeado a entero.
- Los identificadores repetidos (varios formatos de un mismo tema) cuentan una sola vez, y los
  que no existen en el curso se ignoran.
- El tema 1 siempre está disponible; cada tema se habilita cuando el anterior está completado.
  Un tema que el seguimiento reporta como completado nunca se muestra bloqueado.
- Sin datos de la API, el estado inicial es: 0 % y solo el tema 1 habilitado.

## Integración con la API de seguimiento

El endpoint, la autenticación y el formato de respuesta aún no están definidos, por eso el
proyecto **no** hace peticiones ni asume una estructura. Cuando se definan:

1. Obtén la respuesta (con `fetch` u otro mecanismo) en un módulo nuevo de `js/integration/`.
2. Escribe una función que, a partir de esa respuesta, devuelva los identificadores de los temas
   completados (`"tema-1"` … `"tema-7"`).
3. Entrégala al adaptador:

```js
MiRed.trackingAdapter.processTrackingResponse(respuesta, extraerTemasCompletados);
// o, si ya tienes la lista:
MiRed.trackingAdapter.applyCompletedTopicIds(['tema-1', 'tema-2']);
```

Ambas devuelven `{ completedTopicIds, percentage }`. Las funciones de cálculo y de interfaz
también pueden usarse por separado:

```js
MiRed.progressCalculator.calculateOverallPercentage(3, 7);   // 43
MiRed.progressIndicator.renderOverallProgress(43);           // solo pinta la barra
```

Para probar sin API, ejecuta en la consola del navegador:
`MiRed.trackingAdapter.applyCompletedTopicIds(['tema-1', 'tema-2'])`.

## Validación W3C y accesibilidad

El código pasa el validador W3C de HTML y CSS y cumple WCAG 2.2 nivel AA.
El detalle, el alcance y lo que corresponde al contenido de los recursos está en `ACCESIBILIDAD.md`.

## Pruebas automáticas

Requieren Node.js 21 o superior y no instalan dependencias (usan `node:test`):

```bash
npm test
```

| Archivo | Qué verifica |
| --- | --- |
| `tests/progress-calculator.test.js` | Porcentaje (0–100, redondeo, rangos inválidos) y normalización de IDs (duplicados, desconocidos, nulos) |
| `tests/topic-access.test.js` | Desbloqueo secuencial, tema actual y temas completados fuera de orden |
| `tests/tracking-integration.test.js` | Adaptador → coordinador → interfaz: que la interfaz se actualice una sola vez por cambio, que no se duplique el avance y que una respuesta inválida no altere la pantalla |
| `tests/course-config.test.js` | 7 temas, IDs únicos, 4 formatos por tema, archivos existentes, íconos definidos, URL de video válidas |

Los scripts del navegador se cargan en un contexto aislado (`tests/helpers/load-scripts.js`),
así que las pruebas usan exactamente el mismo código que la página.

Al integrar la API, agrega en `tests/` las pruebas de la función de extracción con respuestas
simuladas del formato real (válida, vacía, con formato inesperado y con errores).
