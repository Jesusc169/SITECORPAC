import Sidebar, { type UsuarioPanel } from "@/components/Sidebar/Sidebar";
import InactivityGuard from "@/components/InactivityGuard/InactivityGuard";
import panel from "@/styles/PanelAdmin.module.css";
import "@/styles/panel.css";

/**
 * Marco de todas las pantallas internas (rediseño A+C): menú lateral,
 * contenido sobre fondo celeste muy claro y el aviso de inactividad.
 * Lo ponen app/admin/layout.tsx y app/dashboard/page.tsx; cada pantalla solo
 * dibuja su contenido.
 */
export default function PanelAdmin({
  usuario,
  children,
}: Readonly<{ usuario: UsuarioPanel; children: React.ReactNode }>) {
  return (
    <div className={`${panel.panel} panelAdmin`}>
      <a href="#contenido" className="saltar-contenido">
        Saltar al contenido
      </a>
      <Sidebar usuario={{ nombre: usuario.nombre, rol: usuario.rol, permisos: usuario.permisos }} />
      <main id="contenido" className={panel.contenido}>
        <div className={panel.contenidoIn}>{children}</div>
      </main>
      <InactivityGuard />
    </div>
  );
}
