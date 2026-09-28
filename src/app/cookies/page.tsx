import type { Metadata } from "next";
import Link from "next/link";
import PaginaLegal from "@/components/PaginaLegal/PaginaLegal";
import styles from "@/components/PaginaLegal/PaginaLegal.module.css";
import { INSTITUCION } from "@/lib/datosInstitucionales";

export const metadata: Metadata = {
  title: "Política de cookies | SITECORPAC",
  description: "Qué cookies usa el sitio web del SITECORPAC y para qué.",
};

const SECCIONES = [
  { id: "que-son", titulo: "Qué es una cookie" },
  { id: "cuales", titulo: "Qué cookies usa este sitio" },
  { id: "no-usamos", titulo: "Qué no usamos" },
  { id: "consentimiento", titulo: "Por qué no te pedimos aceptar cookies" },
  { id: "control", titulo: "Cómo borrar o bloquear cookies" },
  { id: "cambios", titulo: "Cambios" },
];

export default function CookiesPage() {
  return (
    <PaginaLegal
      titulo="Política de cookies"
      resumen="En pocas palabras: si solo visitas el sitio, no se guarda ninguna cookie en tu navegador. La única cookie que existe es la de inicio de sesión del personal que administra el sitio. No usamos cookies de publicidad ni de estadísticas."
      secciones={SECCIONES}
    >
      <h2 id="que-son">1. Qué es una cookie</h2>
      <p>
        Una cookie es un pequeño archivo que un sitio web guarda en tu
        navegador para recordar algo, por ejemplo, que ya iniciaste sesión.
      </p>

      <h2 id="cuales">2. Qué cookies usa este sitio</h2>
      {/* tabIndex: en celular la tabla se desplaza de lado; así también se
          puede desplazar con las flechas del teclado. */}
      <div
        className={styles.tablaScroll}
        tabIndex={0}
        role="region"
        aria-label="Tabla de cookies (se puede desplazar)"
      >
        <table>
          <caption>Cookies de este sitio</caption>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Tipo</th>
              <th scope="col">Para qué sirve</th>
              <th scope="col">Duración</th>
              <th scope="col">A quién se le crea</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <code>token</code>
              </th>
              <td>Propia, técnica (estrictamente necesaria)</td>
              <td>
                Mantener abierta la sesión del panel de administración y
                comprobar los permisos de quien lo usa. Es inaccesible para
                otros programas de la página (httpOnly) y solo viaja cifrada.
              </td>
              <td>8 horas, o hasta cerrar sesión.</td>
              <td>
                Solo al personal autorizado, al iniciar sesión. A los
                visitantes no se les crea.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="no-usamos">3. Qué no usamos</h2>
      <ul>
        <li>Cookies de publicidad o de seguimiento.</li>
        <li>
          Herramientas de estadísticas como Google Analytics, ni el píxel de
          Facebook.
        </li>
        <li>Videos, mapas o botones de redes sociales incrustados que creen cookies de terceros.</li>
      </ul>
      <p>
        Los enlaces a WhatsApp y Facebook son enlaces normales: esas empresas
        solo pueden crear sus propias cookies si haces clic y entras a su
        sitio.
      </p>

      <h2 id="consentimiento">4. Por qué no te pedimos aceptar cookies</h2>
      <p>
        La única cookie del sitio es indispensable para el servicio que pide
        quien inicia sesión (entrar al panel de administración). Por eso no
        requiere consentimiento, según el numeral 5 del artículo 14 de la Ley
        N.° 29733. Si algún día añadimos cookies que no sean indispensables
        (por ejemplo, de estadísticas), te pediremos permiso antes de
        activarlas y actualizaremos esta página.
      </p>

      <h2 id="control">5. Cómo borrar o bloquear cookies</h2>
      <p>
        Puedes borrar o bloquear las cookies desde la configuración de tu
        navegador, en la sección de privacidad. Si bloqueas la cookie{" "}
        <code>token</code>, no podrás iniciar sesión en el panel, pero el resto
        del sitio funcionará igual.
      </p>

      <h2 id="cambios">6. Cambios</h2>
      <p>
        Si cambiamos las cookies que usamos, lo indicaremos en esta página. Para
        cualquier consulta escribe a{" "}
        <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a>. Más
        información en la <Link href="/privacidad">Política de privacidad</Link>.
      </p>
    </PaginaLegal>
  );
}
