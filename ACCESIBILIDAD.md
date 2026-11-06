# Validación W3C y accesibilidad (WCAG 2.2 AA)

Alcance: la plantilla (`index.html`, `css/`, `js/`) y el **contenedor** que muestra los recursos
(visor modal, iframes y reproductor de audio). El contenido de los recursos (videos, PDF,
pódcast y paquetes multimedia) es responsabilidad del equipo de contenidos; ver la última sección.

## Validación de código W3C

| Verificación | Herramienta | Resultado |
| --- | --- | --- |
| HTML estático (`index.html`, actividades de ejemplo) | Nu Html Checker (validador oficial W3C), con SVG | 0 errores, 0 avisos |
| HTML generado por JavaScript (tarjetas y visor abierto) | Nu Html Checker sobre el DOM renderizado | 0 errores, 0 avisos |
| `css/styles.css` | Nu Html Checker, modo CSS | 0 errores |

Bootstrap 5.3.8 se usa desde CDN sin modificar y no forma parte de esta validación.

## WCAG 2.2 nivel AA

Revisión automática con axe-core 4.14 (etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`)
en 24 estados: modo claro y oscuro, escritorio y móvil, estado inicial, con progreso y con el visor
abierto en cada formato. **0 violaciones.** Además se hicieron las verificaciones manuales siguientes.

| Criterio | Cómo se cumple / se verificó |
| --- | --- |
| 1.1.1 Contenido no textual | Íconos decorativos con `aria-hidden`; botones de solo ícono con `aria-label`. |
| 1.3.1 Información y relaciones | Encabezados jerárquicos (h1 → h2), lista ordenada de temas, pestañas con roles `tablist`/`tab`/`tabpanel`, barra con `role="progressbar"`. |
| 1.4.1 Uso del color | Estados comunicados también con texto ("Pendiente", "Completado", aviso de bloqueo) y `aria-current` en el tema actual. |
| 1.4.2 Control del audio | Ningún recurso se reproduce solo: el iframe no concede `autoplay`, el audio usa controles nativos y el contenido se descarta al cerrar el visor. |
| 1.4.3 Contraste mínimo | Todo el texto ≥ 4.5:1 (claro y oscuro). Texto sobre la ilustración del hero medido por muestreo de píxeles en 8 anchos: mínimo 5.77:1. |
| 1.4.4 Cambio de tamaño del texto | Unidades `rem`; los botones A+/A− llegan a 137.5 % sin desplazamiento horizontal. |
| 1.4.10 Reflujo | Sin desplazamiento horizontal a 320 px de ancho (equivale a 400 % de zoom). |
| 1.4.11 Contraste no textual | Indicador de foco ≥ 3:1 en todos los fondos (naranja oscuro, blanco sobre fondos oscuros, naranja claro en modo oscuro). |
| 1.4.12 Espaciado del texto | Con interlineado 1.5, espaciado de letras 0.12 y de palabras 0.16, nada se recorta ni desborda. |
| 2.1.1 / 2.1.2 Teclado, sin trampas | Todo se opera con teclado. El visor retiene el foco mientras está abierto y se cierra con Escape. Las pestañas admiten flechas, Inicio y Fin. |
| 2.4.1 Evitar bloques | Enlace "Saltar a los temas" visible al recibir el foco. |
| 2.4.3 Orden del foco | Orden lógico; al cerrar el visor el foco vuelve al botón que lo abrió. |
| 2.4.7 Foco visible | Contorno de 3 px en todos los controles, incluidos los de Bootstrap (`.btn`, `.btn-close`, `.nav-link`). |
| 2.4.11 Foco no oculto | No hay encabezados fijos ni capas que tapen el elemento con foco. |
| 2.5.3 Etiqueta en el nombre | El nombre accesible empieza con el texto visible ("Entrar a Unidad 1…", "Video: Unidad 1"). |
| 2.5.8 Tamaño del objetivo | Todos los controles miden al menos 24 × 24 px (los del pie, 44 px de alto). |
| 3.1.1 Idioma | `lang="es"`. |
| 4.1.2 Nombre, función y valor | Botones nativos, `aria-pressed` en modo oscuro (su nombre no cambia), `aria-disabled` implícito con `disabled`. |
| 4.1.3 Mensajes de estado | El progreso se anuncia en una región `aria-live`: "Progreso general del curso: 29 %". |

Criterios de 2.2 que no aplican a esta plantilla: 2.5.7 Movimientos de arrastre (no hay arrastre),
3.2.6 Ayuda consistente (no hay mecanismo de ayuda), 3.3.7 Entrada redundante y 3.3.8 Autenticación
accesible (no hay formularios ni inicio de sesión).

## El contenedor de los recursos

El visor garantiza, para cualquier recurso que se cargue:

- Cada iframe tiene un `title` descriptivo ("Video: Fundamentos y principios").
- El reproductor de audio tiene nombre accesible y controles nativos operables con teclado.
- Nada se reproduce automáticamente y todo se detiene al cerrar el visor.
- Los iframes permiten pantalla completa y el documento y la actividad tienen además un enlace
  "Abrir … en una pestaña nueva" (útil en móviles que no muestran PDF incrustados).
- Si un recurso no está configurado, se muestra un mensaje de texto en lugar de un marco vacío.

## Responsabilidad del contenido (equipo de contenidos)

Para que el curso completo cumpla WCAG 2.2 AA, cada recurso debe cumplir por su cuenta:

- **Video:** subtítulos sincronizados (1.2.2) y audiodescripción o alternativa (1.2.5).
- **Pódcast:** transcripción en texto (1.2.1).
- **PDF:** documento etiquetado, con orden de lectura, idioma y textos alternativos (PDF/UA).
- **Actividad interactiva:** el paquete debe cumplir WCAG 2.2 AA por sí mismo (teclado, foco,
  contraste, nombres accesibles) y declarar `lang="es"`.

## Cómo repetir la verificación

- HTML: https://validator.w3.org/nu/ (para el DOM generado: en el navegador, copiar el HTML
  del inspector y usar la opción "text input").
- CSS: https://jigsaw.w3.org/css-validator/
- Accesibilidad: extensión axe DevTools o Lighthouse, más las pruebas manuales de la tabla.
