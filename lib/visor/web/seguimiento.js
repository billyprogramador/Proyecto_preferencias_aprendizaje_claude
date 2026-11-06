
let idSesionPDF = null;
let pdfViewerApp = null;

const paginasVistas = new Set();
const registroPaginas = {};

let paginaActual = null;
let inicioTiempo = null;

// Iniciar el conteo si el documento está visible.
function iniciarTiempoPagina() {
    if (
        paginaActual !== null &&
        inicioTiempo === null &&
        !document.hidden
    ) {
        inicioTiempo = performance.now();
    }
}

// Acumular el tiempo transcurrido y pausar.
function pausarTiempoPagina() {
    if (paginaActual !== null && inicioTiempo !== null) {
        const segundos = (performance.now() - inicioTiempo) / 1000;

        registroPaginas[paginaActual].segundos += segundos;
        inicioTiempo = null;
    }
}

// Preparar los datos acumulados.
function obtenerDatosAvancePDF({ reanudar = true, finalizada = false } = {}) {
    pausarTiempoPagina();

    const registro = Object.fromEntries(
        Object.entries(registroPaginas).map(([pagina, datos]) => [
            pagina,
            { ...datos }
        ])
    );

    const totalVistas = paginasVistas.size;
    const totalPaginas = pdfViewerApp.pagesCount; //revisar

    const datosAvance = {
        totalPaginas,
        paginasDistintas: totalVistas,
        porcentaje: totalPaginas > 0
            ? Math.round((totalVistas / totalPaginas) * 100)
            : 0,
        paginas: registro,
        finalizada,
        idSesion: idSesionPDF
    };

    if (reanudar) {
        iniciarTiempoPagina();
    }

    return datosAvance;
}

// Preparar y guardar el avance.
// La implementación de la API queda pendiente.
function guardarAvancePDF(datosAvance) {
    // Pendiente: enviar datosAvance a la API.
}

// Registrar el cambio de página.
function registrarPagina(PDFViewerApplicationObjeto) {
    pdfViewerApp = PDFViewerApplicationObjeto;
    const numeroPagina = PDFViewerApplicationObjeto.page;
    const totalPaginas = PDFViewerApplicationObjeto.pagesCount;

    if (numeroPagina === paginaActual) {
        return;
    }

    // Acumular el tiempo de la página anterior.
    pausarTiempoPagina();

    paginaActual = numeroPagina;

    if (!registroPaginas[numeroPagina]) {
        registroPaginas[numeroPagina] = {
            visitas: 0,
            segundos: 0
        };
    }

    registroPaginas[numeroPagina].visitas++;
    paginasVistas.add(numeroPagina);

    iniciarTiempoPagina();

    // Guardar el avance después de cada cambio de página.
    guardarAvancePDF(obtenerDatosAvancePDF());

    console.log("Página actual:", numeroPagina);
    console.log("Páginas vistas:", paginasVistas.size);
    console.log("Total de páginas:", totalPaginas);
}

// Pausar y guardar al ocultar la pestaña.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pausarTiempoPagina();

        guardarAvancePDF(
            obtenerDatosAvancePDF({ reanudar: false })
        );
    } else {
        iniciarTiempoPagina();
    }
});

// Guardar periódicamente cada 60 segundos.
setInterval(() => {
    if (!document.hidden && paginaActual !== null) {
        guardarAvancePDF(obtenerDatosAvancePDF());
    }
}, 60000);

// Llamar desde la plantilla cuando se cierre el modal.
//No cerrar el modal hasta que se compruebe el guardado.
function finalizarSeguimientoPDF() {
    pausarTiempoPagina();

    guardarAvancePDF(
        obtenerDatosAvancePDF({
            reanudar: false,
            finalizada: true
        })
    );
}

//limpia los datos de segumiento para que se guarde una nueva sessión
function limpiarSeguimientoPDF() {
  // Aquí reinicias los contadores e inicias
  // Pausar el conteo anterior.
  pausarTiempoPagina(); //REVISAR YA DEBERIA ESTAR PAUSADO

  // Reiniciar los datos acumulados de la sesión.
  paginasVistas.clear();

  Object.keys(registroPaginas).forEach(function (pagina) {
      delete registroPaginas[pagina];
  });

  paginaActual = null;
  inicioTiempo = null;

  // Iniciar Seguimiento de esta sesssión
  if (pdfViewerApp && pdfViewerApp.page > 0) {
      registrarPagina(pdfViewerApp);
  }
}
//coneción con padre para obtener la sessión id del recurso
window.addEventListener("message", function (event) {
    if (
        event.source !== window.parent ||
        event.origin !== window.location.origin
    ) {
        return;
    }

    if (
      event.data?.tipo !== "RESPUESTA_SESION_PDF" &&
        event.data?.tipo !== "FINALIZAR_SESION_PDF"
    ) {
        return;
    }


    switch (event.data.tipo) {
        case "RESPUESTA_SESION_PDF":
            idSesionPDF = event.data.idSesion;
            console.log("idSesionPDF "+idSesionPDF);
            limpiarSeguimientoPDF();
            break;

        case "FINALIZAR_SESION_PDF":
            finalizarSeguimientoPDF();
            break;
    }

});

window.addEventListener("message", function (event) {
    if (
        event.source !== window.parent ||
        event.origin !== window.location.origin
    ) {
        return;
    }

    if (event.data?.tipo === "SOLICITAR_SESION_PDF") {
        window.parent.postMessage({
            tipo: "SOLICITAR_SESION_PDF"
        }, window.location.origin);
    }
});
