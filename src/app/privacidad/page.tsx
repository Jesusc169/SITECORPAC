import type { Metadata } from "next";
import Link from "next/link";
import PaginaLegal from "@/components/PaginaLegal/PaginaLegal";
import styles from "@/components/PaginaLegal/PaginaLegal.module.css";
import { INSTITUCION } from "@/lib/datosInstitucionales";

export const metadata: Metadata = {
  title: "Política de privacidad | SITECORPAC",
  description:
    "Cómo el SITECORPAC trata los datos personales en su sitio web, conforme a la Ley N.° 29733 y su Reglamento.",
};

const SECCIONES = [
  { id: "responsable", titulo: "Quién es responsable de tus datos" },
  { id: "alcance", titulo: "A qué se aplica esta política" },
  { id: "datos", titulo: "Qué datos tratamos, para qué y por cuánto tiempo" },
  { id: "sensibles", titulo: "Datos sensibles, directorio y fotografías" },
  { id: "destinatarios", titulo: "Con quién se comparten" },
  { id: "internacional", titulo: "Transferencia internacional (servidor)" },
  { id: "seguridad", titulo: "Cómo protegemos los datos" },
  { id: "derechos", titulo: "Tus derechos y cómo ejercerlos" },
  { id: "menores", titulo: "Menores de edad" },
  { id: "cambios", titulo: "Cambios a esta política" },
];

export default function PrivacidadPage() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      resumen="En pocas palabras: este sitio es informativo. Los visitantes no se registran ni llenan formularios, así que casi no recogemos datos de ti. Los únicos datos que se guardan son los técnicos del servidor, las cuentas del personal que administra el sitio, los datos de los dirigentes que aparecen en el Directorio y las fotos de actividades. Puedes pedirnos en cualquier momento que te digamos qué datos tenemos tuyos, que los corrijamos o que los borremos."
      secciones={SECCIONES}
    >
      <h2 id="responsable">1. Quién es responsable de tus datos</h2>
      <dl>
        <dt>Responsable</dt>
        <dd>{INSTITUCION.razonSocial}</dd>
        <dt>RUC</dt>
        <dd>{INSTITUCION.ruc}</dd>
        <dt>Domicilio</dt>
        <dd>{INSTITUCION.domicilio}</dd>
        <dt>Contacto para datos personales</dt>
        <dd>
          <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a>
        </dd>
      </dl>
      <p>
        Tratamos los datos personales conforme a la Ley N.° 29733, Ley de
        Protección de Datos Personales, y su Reglamento, aprobado por Decreto
        Supremo N.° 016-2024-JUS.
      </p>

      <h2 id="alcance">2. A qué se aplica esta política</h2>
      <p>
        Esta política cubre el sitio web {INSTITUCION.sitio.replace("https://", "")} y
        su panel de administración. No cubre el padrón de afiliados ni los
        trámites que se hacen en la oficina del sindicato, que tienen sus
        propios procedimientos. Tampoco cubre lo que compartas en WhatsApp,
        Facebook o por correo electrónico: esas plataformas tienen sus propias
        políticas de privacidad.
      </p>

      <h2 id="datos">3. Qué datos tratamos, para qué y por cuánto tiempo</h2>
      {/* tabIndex: en celular la tabla se desplaza de lado; así también se
          puede desplazar con las flechas del teclado. */}
      <div
        className={styles.tablaScroll}
        tabIndex={0}
        role="region"
        aria-label="Tabla de datos que se tratan (se puede desplazar)"
      >
        <table>
          <caption>Datos que se tratan a través de este sitio web</caption>
          <thead>
            <tr>
              <th scope="col">Quién</th>
              <th scope="col">Qué datos</th>
              <th scope="col">Para qué</th>
              <th scope="col">Cuánto tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Cualquier visitante</th>
              <td>
                Dirección IP, fecha y hora, página solicitada y tipo de
                navegador (registros técnicos del servidor).
              </td>
              <td>
                Que el sitio funcione, detectar fallas y protegerlo de ataques.
              </td>
              <td>
                Se eliminan automáticamente a los 15 días.
              </td>
            </tr>
            <tr>
              <th scope="row">Quien intenta iniciar sesión</th>
              <td>Dirección IP y número de intentos fallidos.</td>
              <td>
                Bloquear temporalmente los intentos de adivinar contraseñas.
              </td>
              <td>
                Se borran al iniciar sesión correctamente; los demás se
                depuran automáticamente después de 24 horas.
              </td>
            </tr>
            <tr>
              <th scope="row">Personal que administra el sitio</th>
              <td>
                Nombre, correo, contraseña (guardada cifrada, nadie puede
                leerla), rol y permisos. Una cookie de sesión mientras está
                conectado.
              </td>
              <td>Dar acceso al panel de administración y controlar permisos.</td>
              <td>
                Mientras la cuenta esté activa. La cookie de sesión vence a las
                8 horas o al cerrar sesión.
              </td>
            </tr>
            <tr>
              <th scope="row">Personal que administra el sitio (registro de actividad)</th>
              <td>
                Nombre, fecha y hora, acción realizada en el panel (crear,
                editar o eliminar contenido, iniciar o cerrar sesión) y
                dirección IP. También los intentos fallidos de inicio de sesión
                con el correo usado.
              </td>
              <td>
                Saber quién hizo cada cambio, resolver problemas y detectar
                accesos indebidos. Solo lo ve el administrador del sistema.
              </td>
              <td>
                Se elimina automáticamente a los 180 días.
              </td>
            </tr>
            <tr>
              <th scope="row">Dirigentes del Directorio</th>
              <td>Nombre, cargo, correo, teléfono, foto y periodo del cargo.</td>
              <td>
                Que los afiliados sepan quiénes son sus representantes y cómo
                contactarlos.
              </td>
              <td>
                Mientras ejerzan el cargo o mientras no retiren su
                consentimiento.
              </td>
            </tr>
            <tr>
              <th scope="row">Personas en fotos de actividades</th>
              <td>Imagen en fotografías de noticias, ferias y sorteos.</td>
              <td>Informar sobre las actividades del sindicato.</td>
              <td>
                Mientras la publicación siga en el sitio, o hasta que la
                persona pida que se retire.
              </td>
            </tr>
            <tr>
              <th scope="row">Quien nos escribe</th>
              <td>
                Los datos que tú mismo envíes por correo o WhatsApp (nombre,
                número, mensaje).
              </td>
              <td>Responder tu consulta.</td>
              <td>El tiempo necesario para atenderla.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Además, la base de datos del sitio tiene copias de seguridad diarias que
        se conservan 30 días. Por eso, un dato borrado puede seguir en esas
        copias hasta 30 días, sin estar publicado ni en uso, y después
        desaparece.
      </p>
      <p>
        No usamos tus datos para publicidad, no los vendemos y no tomamos
        decisiones automatizadas ni elaboramos perfiles sobre ti.
      </p>

      <h2 id="sensibles">4. Datos sensibles, directorio y fotografías</h2>
      <p>
        Para la ley, la afiliación sindical es un dato sensible. Por eso tenemos
        estos cuidados:
      </p>
      <ul>
        <li>
          <strong>Directorio:</strong> publicamos los datos de un dirigente solo
          con su consentimiento por escrito. Si eres dirigente y quieres que se
          quite o cambie algún dato (por ejemplo, tu teléfono), escríbenos.
        </li>
        <li>
          <strong>Fotos de actividades:</strong> se publican fotos de eventos
          públicos del sindicato, de acuerdo con el artículo 15 del Código
          Civil. Si apareces en una foto y no quieres que siga publicada,
          escríbenos indicando cuál es y la retiraremos.
        </li>
        <li>
          Este sitio <strong>no</strong> publica el padrón de afiliados ni
          ningún listado de afiliados.
        </li>
      </ul>

      <h2 id="destinatarios">5. Con quién se comparten</h2>
      <p>
        No compartimos datos personales con terceros para sus propios fines.
        Solo intervienen:
      </p>
      <ul>
        <li>
          <strong>Hostinger International Ltd.</strong>, empresa que nos
          alquila el servidor donde funciona el sitio. Solo presta el
          alojamiento; los datos se guardan por encargo nuestro.
        </li>
        <li>
          Las autoridades que lo exijan con base en una ley o una orden
          judicial.
        </li>
      </ul>
      <p>
        El sitio tiene enlaces a WhatsApp y Facebook. Si haces clic, sales de
        nuestro sitio y se aplican las políticas de esas empresas.
      </p>

      <h2 id="internacional">6. Transferencia internacional (servidor)</h2>
      <p>
        El servidor del sitio está en Estados Unidos. Eso significa que los
        datos descritos en la sección 3 se guardan fuera del Perú (esto se
        llama flujo transfronterizo). El proveedor protege el servidor y
        nosotros controlamos quién accede a él.
      </p>

      <h2 id="seguridad">7. Cómo protegemos los datos</h2>
      <ul>
        <li>Toda la comunicación con el sitio viaja cifrada (HTTPS).</li>
        <li>
          Las contraseñas se guardan cifradas con un algoritmo que no permite
          recuperarlas.
        </li>
        <li>
          El panel de administración exige usuario y contraseña, bloquea los
          intentos repetidos y da a cada persona solo los permisos que
          necesita.
        </li>
        <li>La base de datos tiene copias de seguridad diarias.</li>
      </ul>
      <p>
        Si ocurre un incidente de seguridad que afecte datos personales, lo
        comunicaremos a la Autoridad Nacional de Protección de Datos
        Personales en los plazos que exige la ley y, cuando corresponda, a las
        personas afectadas.
      </p>

      <h2 id="derechos">8. Tus derechos y cómo ejercerlos</h2>
      <p>Respecto de tus datos personales, puedes pedir:</p>
      <ul>
        <li>
          <strong>Información:</strong> saber qué hacemos con tus datos.
        </li>
        <li>
          <strong>Acceso:</strong> que te digamos qué datos tuyos tenemos.
        </li>
        <li>
          <strong>Rectificación:</strong> que corrijamos o actualicemos datos
          equivocados.
        </li>
        <li>
          <strong>Cancelación:</strong> que borremos tus datos cuando ya no
          sean necesarios o retires tu consentimiento.
        </li>
        <li>
          <strong>Oposición:</strong> que dejemos de usar tus datos para un fin
          determinado.
        </li>
      </ul>
      <p>
        También puedes retirar tu consentimiento en cualquier momento, sin dar
        explicaciones y de forma gratuita.
      </p>
      <h3>Cómo hacerlo</h3>
      <ol>
        <li>
          Escribe a <a href={`mailto:${INSTITUCION.correo}`}>{INSTITUCION.correo}</a>{" "}
          con el asunto &quot;Datos personales&quot;, o preséntalo por escrito en
          nuestro domicilio.
        </li>
        <li>
          Indica tu nombre, qué derecho quieres ejercer y un documento que te
          identifique (DNI o carné de extranjería). Si lo haces en nombre de
          otra persona, adjunta el documento que te autoriza.
        </li>
        <li>Es gratuito.</li>
      </ol>
      <h3>Plazos de respuesta (días hábiles)</h3>
      <ul>
        <li>Derecho de información: 8 días.</li>
        <li>Derecho de acceso: 20 días.</li>
        <li>Rectificación, cancelación u oposición: 10 días.</li>
      </ul>
      <p>
        Si no respondemos a tiempo o no estás de acuerdo con la respuesta,
        puedes presentar un reclamo ante la Autoridad Nacional de Protección
        de Datos Personales del Ministerio de Justicia y Derechos Humanos.
      </p>

      <h2 id="menores">9. Menores de edad</h2>
      <p>
        Este sitio está dirigido a trabajadores de CORPAC y no está pensado
        para menores de edad. Si en una foto de actividades aparece un menor,
        su padre, madre o tutor puede pedir que se retire.
      </p>

      <h2 id="cambios">10. Cambios a esta política</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión en esta misma
        página con su fecha de actualización. Para el uso de cookies, consulta
        la <Link href="/cookies">Política de cookies</Link>.
      </p>
    </PaginaLegal>
  );
}
