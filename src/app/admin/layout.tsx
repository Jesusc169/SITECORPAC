import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import InactivityGuard from "@/components/InactivityGuard/InactivityGuard";

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

  return (
    <>
      {children}
      <InactivityGuard />
    </>
  );
}
