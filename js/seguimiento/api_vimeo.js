/**
 * Seguimiento del reproductor de video de Vimeo (Vimeo Player SDK).
 *
 * - seguimiento_reproductor_video(idIframe, contexto): inicia el seguimiento.
 *   `contexto` se copia a cada evento: { topicId, idSesion, recurso }, donde
 *   `recurso` ('video' | 'podcast') distingue el avance de cada pestaña.
 * - detener_seguimiento_video(): libera el reproductor y sus listeners.
 *
 * Cada acción relevante se emite como evento `seguimiento:video` en `window`
 * para que la capa de integración (tracking-adapter / API futura) lo consuma.
 */
let player = null;

function detener_seguimiento_video() {
  if (!player) return;
  try {
    player.off('play');
    player.off('pause');
    player.off('seeked');
    player.off('ended');
    player.destroy();
  } catch (e) {
    // El iframe pudo haberse retirado del DOM antes; no es un error.
  }
  player = null;
}

function seguimiento_reproductor_video(idIframe, contexto = {}) {
  const iframe = document.getElementById(idIframe);
  if (!iframe || !window.Vimeo) return;

  // Evita reproductores/listeners duplicados al reabrir el video.
  detener_seguimiento_video();

  const actual = new Vimeo.Player(iframe);
  player = actual;

  const datos = {
    duracionVideo: 0,
    posicionPausaVideo: 0,
    cantPlay: 0,
    cantPausa: 0,
    cantmanipulacionLineaTiempo: 0,
  };

  function emitir(tipo, extra = {}) {
    window.dispatchEvent(
      new CustomEvent('seguimiento:video', {
        detail: { ...contexto, tipo, ...datos, ...extra },
      })
    );
  }

  actual.getDuration().then(function (duration) {
    datos.duracionVideo = duration;
  });

  actual.on('play', function () {
    datos.cantPlay++;
    emitir('play');
  });

  actual.on('pause', function () {
    datos.cantPausa++;
    actual.getCurrentTime().then(function (seconds) {
      datos.posicionPausaVideo = seconds;
      emitir('pause', { posicion: seconds });
    });
  });

  // Adelantar o atrasar la línea de tiempo.
  actual.on('seeked', function (data) {
    datos.cantmanipulacionLineaTiempo++;
    emitir('seeked', { posicion: data && data.seconds });
  });

  // Vista completa del video.
  actual.on('ended', function () {
    emitir('ended');
  });
}
