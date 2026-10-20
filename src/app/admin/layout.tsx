import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import PanelAdmin from "@/components/PanelAdmin/PanelAdmin";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No basta con que exista la cookie: la sesión tiene que seguir vigente
  // (cuenta activa y sin "cerrar sesiones" / cambio de contraseña posterior).
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  // El menú lateral, el fondo y el aviso de inactividad son comunes a todas
  // las pantallas del panel (rediseño A+C).
  return <PanelAdmin usuario={usuario}>{children}</PanelAdmin>;
}
