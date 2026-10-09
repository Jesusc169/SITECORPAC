import { NextResponse } from "next/server";
import { EmpresaController } from "@/controllers/empresaController";
import { obtenerUsuarioActual } from "@/lib/auth";

export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual) {
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
