import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { SistemaController } from "@/controllers/sistemaController";
import { depurarRegistroAntiguo, MODULOS_REGISTRO } from "@/lib/registro";
import SistemaView from "./SistemaView";

export const metadata: Metadata = {
  title: "Sistema y registros | SITECORPAC",
  robots: { index: false, follow: false },
};

// Siempre datos frescos: es una pantalla de diagnóstico.
export const dynamic = "force-dynamic";

export default async function SistemaPage() {
  // Solo el rol administrador. Las secretarias no ven esta sección aunque
  // tengan el privilegio "usuarios".
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "administrador") redirect("/dashboard");

  await depurarRegistroAntiguo().catch(() => 0);

  const [estado, seguridad, usuarios] = await Promise.all([
    SistemaController.estado(),
    SistemaController.seguridad(),
    SistemaController.usuarios(),
  ]);

  return (
    <SistemaView
      estado={estado}
      seguridad={seguridad}
      usuarios={usuarios}
      modulos={[...MODULOS_REGISTRO]}
    />
  );
}
