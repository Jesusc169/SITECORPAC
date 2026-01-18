// src/controllers/EventoFeria.controller.ts
import { NextResponse } from "next/server";
import { EventoFeriaModel } from "@/models/EventoFeria.model";

export class EventoFeriaController {
  /* =========================
     LISTAR FERIAS
     ========================= */
  static async list(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const anio = searchParams.get("anio");

      const ferias = await EventoFeriaModel.listar(
        anio ? Number(anio) : undefined
      );

      return NextResponse.json(ferias);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Error listando ferias" },
        { status: 500 }
      );
    }
  }

  /* =========================
     OBTENER FERIA POR ID
     ========================= */
  static async getById(id: number) {
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const feria = await EventoFeriaModel.obtenerPorId(id);

    if (!feria) {
      return NextResponse.json(
        { error: "Feria no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(feria);
  }

  /* =========================
     ACTUALIZAR
     ========================= */
  static async update(id: number, data: any) {
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const feria = await EventoFeriaModel.actualizar(id, data);
    return NextResponse.json(feria);
  }

  /* =========================
     ELIMINAR
     ========================= */
  static async delete(id: number) {
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    await EventoFeriaModel.eliminar(id);
    return NextResponse.json({ ok: true });
  }
}
