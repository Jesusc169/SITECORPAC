import { NextResponse } from "next/server";
import { EmpresaController } from "@/controllers/empresaController";
import { verificarSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await verificarSesion();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const empresas = await EmpresaController.obtenerEmpresasParaSelector();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}
