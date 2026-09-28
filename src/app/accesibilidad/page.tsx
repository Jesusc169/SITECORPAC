import type { Metadata } from "next";
import PaginaLegal from "@/components/PaginaLegal/PaginaLegal";
import { INSTITUCION } from "@/lib/datosInstitucionales";

export const metadata: Metadata = {
  title: "Accesibilidad | SITECORPAC",
  description:
    "Compromiso de accesibilidad del sitio web del SITECORPAC y cómo reportar barreras.",
};

const SECCIONES = [
  { id: "compromiso", titulo: "Nuestro compromiso" },
  { id: "hecho", titulo: "Qué hemos hecho" },
  { id: "limitaciones", titulo: "Limitaciones conocidas" },
  { id: "reportar", titulo: "Cómo reportar un problema" },
];

export default function AccesibilidadPage() {
  return (
    <PaginaLegal
      titulo="Accesibilidad"
      resumen="Queremos que todos los trabajadores puedan usar este sitio, incluidas las personas con discapacidad. Si algo no te funciona, avísanos y lo corregimos."
      secciones={SECCIONES}
    >
      <h2 id="compromiso">1. Nuestro compromiso</h2>
      <p>
        El SITECORPAC busca que su sitio cumpla las Pautas de Accesibilidad
        para el Contenido Web (WCAG) 2.1, nivel AA, en línea con la Ley N.°
        29973, Ley General de la Persona con Discapacidad.
      </p>

      <h2 id="hecho">2. Qué hemos hecho</h2>
      <ul>
        <li>
          Todo el sitio se puede recorrer con el teclado (tecla Tab), y el
          elemento activo siempre se ve resaltado.
        </li>
        <li>
          Un enlace &quot;Saltar al contenido principal&quot; permite evitar el
          menú en cada página.
        </li>
        <li>
          Las imágenes tienen texto alternativo, y las que son solo decorativas
          se marcan para que el lector de pantalla las omita.
        </li>
        <li>
          Los botones que solo muestran un ícono tienen un nombre que el lector
          de pantalla anuncia.
        </li>
        <li>
          Los colores del texto cumplen el contraste mínimo de WCAG AA.
        </li>
        <li>
          El carrusel de noticias se detiene al pasar el mouse o el foco del
          teclado, y no se mueve solo si tu equipo tiene activada la opción de
          reducir el movimiento.
        </li>
        <li>
          Revisamos las páginas públicas con la herramienta automática axe-core
          y con pruebas manuales de teclado.
        </li>
      </ul>

      <h2 id="limitaciones">3. Limitaciones conocidas</h2>
      <ul>
        <li>
          Algunas noticias se publican como afiches (imágenes con texto). Su
          texto alternativo es el título de la noticia; el detalle completo
          está en la descripción escrita de la noticia.
        </li>
        <li>
          Algunos documentos PDF publicados (estatuto, leyes, comunicados)
          pueden ser escaneados y no leerse con lector de pantalla. Si
          necesitas alguno en un formato accesible, pídelo y te lo enviamos.
        </li>
      </ul>

      <h2 id="reportar">4. Cómo reportar un problema</h2>
      <p>
        Si encuentras una barrera de accesibilidad, escríbenos a{" "}
        <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a> o por
        WhatsApp al {INSTITUCION.telefono}. Indica la página y qué problema
        tuviste. Te responderemos y te daremos la información por otro medio
        mientras lo corregimos.
      </p>
    </PaginaLegal>
  );
}
