import { NextResponse } from "next/server";
import { FeriaController, FeriaValidationError } from "@/controllers/feriaController";
import { ArchivoInvalidoError } from "@/lib/validacionArchivos";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { leerVisible } from "@/lib/visibilidad";
import { registrarActividad, registrarError, idDe, textoVisible } from "@/lib/registro";

/* =========================
   GET – LISTAR FERIAS
========================= */
export async function GET() {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ferias = await FeriaController.obtenerFeriasAdmin();
    return NextResponse.json(ferias);
  } catch (error) {
    await registrarError("ferias", "Listar ferias", error);
    return NextResponse.json(
      { error: "Error al listar ferias" },
      { status: 500 }
    );
  }
}

/* =========================
   POST – CREAR FERIA FULL
========================= */
export async function POST(req: Request) {
  try {
    const usuarioActual = await obtenerUsuarioActual();
    if (!usuarioActual || !tienePermiso(usuarioActual, "ferias")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const imagenPrincipalIndexRaw = formData.get("imagenPrincipalIndex");

    const feria = await FeriaController.crearFeria({
      titulo: formData.get("titulo")?.toString(),
      descripcion: formData.get("descripcion")?.toString(),
      anio: Number(formData.get("anio")),
      imagenFiles: formData.getAll("imagenes") as File[],
      imagenPrincipalIndex: imagenPrincipalIndexRaw ? Number(imagenPrincipalIndexRaw) : 0,
      empresas: JSON.parse((formData.get("empresas") as string) || "[]"),
      fechas: JSON.parse((formData.get("fechas") as string) || "[]"),
      estado: leerVisible(formData, "estado"),
    });

    await registrarActividad({
      usuario: usuarioActual,
      accion: "crear",
      modulo: "ferias",
      entidadId: idDe(feria),
      detalle: `Creó la feria "${feria.titulo}" (${textoVisible(feria.estado)})`,
      request: req,
    });

    return NextResponse.json(feria, { status: 201 });
  } catch (error) {
    if (error instanceof FeriaValidationError || error instanceof ArchivoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await registrarError("ferias", "Crear feria", error, req);
    return NextResponse.json(
      { error: "Error al crear feria" },
      { status: 500 }
    );
  }
}
