import type { Metadata } from "next";
import Link from "next/link";
import PaginaLegal from "@/components/PaginaLegal/PaginaLegal";
import { INSTITUCION } from "@/lib/datosInstitucionales";

export const metadata: Metadata = {
  title: "Términos y condiciones | SITECORPAC",
  description: "Condiciones de uso del sitio web del SITECORPAC.",
};

const SECCIONES = [
  { id: "quienes", titulo: "Quiénes somos" },
  { id: "aceptacion", titulo: "Aceptación" },
  { id: "finalidad", titulo: "Para qué sirve este sitio" },
  { id: "informacion", titulo: "Sobre la información publicada" },
  { id: "uso", titulo: "Uso correcto del sitio" },
  { id: "panel", titulo: "Panel de administración" },
  { id: "propiedad", titulo: "Propiedad intelectual" },
  { id: "enlaces", titulo: "Enlaces a otros sitios" },
  { id: "responsabilidad", titulo: "Responsabilidad" },
  { id: "datos", titulo: "Datos personales y cookies" },
  { id: "cambios", titulo: "Cambios" },
  { id: "ley", titulo: "Ley aplicable" },
];

export default function TerminosPage() {
  return (
    <PaginaLegal
      titulo="Términos y condiciones"
      resumen="En pocas palabras: este es el sitio informativo del sindicato. Puedes consultarlo y compartir su contenido citando la fuente. Para trámites, fechas y montos oficiales, confirma siempre con la oficina del SITECORPAC. No intentes entrar al panel de administración sin autorización."
      secciones={SECCIONES}
    >
      <h2 id="quienes">1. Quiénes somos</h2>
      <p>
        Este sitio pertenece al {INSTITUCION.razonSocial} ({INSTITUCION.nombreCorto}),
        RUC {INSTITUCION.ruc}, con domicilio en {INSTITUCION.domicilio}. Contacto:{" "}
        <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a>.
      </p>

      <h2 id="aceptacion">2. Aceptación</h2>
      <p>
        Al usar este sitio aceptas estos términos. Si no estás de acuerdo con
        ellos, te pedimos no usarlo.
      </p>

      <h2 id="finalidad">3. Para qué sirve este sitio</h2>
      <p>
        El sitio informa sobre el sindicato: su historia, su directorio, sus
        noticias y actividades (ferias y sorteos), los trámites que ofrece a sus
        afiliados (préstamos y beneficio por fallecimiento) y la legislación
        laboral relacionada. Es gratuito y no requiere registro.
      </p>

      <h2 id="informacion">4. Sobre la información publicada</h2>
      <ul>
        <li>
          Procuramos que la información esté completa y actualizada, pero puede
          contener errores o quedar desactualizada. Los requisitos, fechas y
          montos de trámites, ferias y sorteos deben confirmarse con la oficina
          del sindicato: lo que se indique ahí prevalece sobre el sitio.
        </li>
        <li>
          La sección de legislación laboral es un resumen con fines de
          difusión. No es asesoría legal. Los textos oficiales son los
          publicados en el diario oficial El Peruano.
        </li>
        <li>
          Las bases y condiciones de cada sorteo son las que fije el sindicato
          para ese sorteo.
        </li>
      </ul>

      <h2 id="uso">5. Uso correcto del sitio</h2>
      <p>Al usar el sitio te comprometes a no:</p>
      <ul>
        <li>
          Intentar acceder a zonas restringidas, cuentas ajenas o la base de
          datos sin autorización.
        </li>
        <li>
          Interferir con el funcionamiento del sitio (por ejemplo, con
          programas que lo saturen o busquen vulnerabilidades sin permiso).
        </li>
        <li>
          Copiar datos personales publicados, como los del Directorio, para
          usarlos en fines distintos a contactar al sindicato (por ejemplo,
          publicidad).
        </li>
      </ul>
      <p>
        El acceso no autorizado a sistemas informáticos es un delito según la
        Ley N.° 30096, Ley de Delitos Informáticos.
      </p>

      <h2 id="panel">6. Panel de administración</h2>
      <p>
        El panel lo usa únicamente el personal autorizado del sindicato. Cada
        cuenta es personal: su titular debe mantener su contraseña en reserva
        y es responsable de lo que se publique con ella. El sindicato puede
        suspender o eliminar cuentas en cualquier momento.
      </p>

      <h2 id="propiedad">7. Propiedad intelectual</h2>
      <p>
        El logotipo, los textos, las fotografías y el diseño del sitio
        pertenecen al SITECORPAC o a sus autores, y están protegidos por el
        Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor. Puedes
        compartir las noticias y comunicados citando al SITECORPAC como
        fuente. No puedes usar el logotipo ni el nombre del sindicato para
        hacerte pasar por él.
      </p>
      <p>
        Las normas legales citadas (Constitución, leyes, convenios de la OIT)
        son de dominio público. Los logotipos de cooperativas y empresas
        aliadas pertenecen a sus respectivos titulares.
      </p>

      <h2 id="enlaces">8. Enlaces a otros sitios</h2>
      <p>
        El sitio incluye enlaces a WhatsApp, Facebook y otras páginas. No controlamos esos sitios y no respondemos por su contenido
        ni por cómo tratan tus datos.
      </p>

      <h2 id="responsabilidad">9. Responsabilidad</h2>
      <p>
        Hacemos lo razonable para que el sitio esté disponible y sea seguro,
        pero puede tener interrupciones por mantenimiento o causas ajenas a
        nosotros. El SITECORPAC no responde por daños derivados de decisiones
        tomadas solo con base en la información del sitio sin confirmarla con
        la oficina, salvo en los casos en que la ley no permite excluir esa
        responsabilidad.
      </p>

      <h2 id="datos">10. Datos personales y cookies</h2>
      <p>
        El tratamiento de datos personales se rige por nuestra{" "}
        <Link href="/privacidad">Política de privacidad</Link> y el uso de
        cookies por la <Link href="/cookies">Política de cookies</Link>.
      </p>

      <h2 id="cambios">11. Cambios</h2>
      <p>
        Podemos actualizar estos términos. La versión vigente es siempre la
        publicada en esta página, con su fecha de actualización.
      </p>

      <h2 id="ley">12. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Perú.
        Cualquier controversia se resolverá ante los jueces y tribunales del
        Callao.
      </p>
    </PaginaLegal>
  );
}
