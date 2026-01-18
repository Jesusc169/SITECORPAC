import { NextRequest, NextResponse } from "next/server";
import { NoticiasModel } from "../model/NoticiasModel";

export class NoticiasController {
  // 🔹 Obtener todas las noticias
  static async obtenerNoticias(req: NextRequest) {
    try {
      const noticias = await NoticiasModel.obtenerTodas();
      return NextResponse.json(noticias, { status: 200 });
    } catch (error: any) {
      console.error("Error al obtener noticias:", error);
      return NextResponse.json(
        { error: "Error al obtener noticias" },
        { status: 500 }
      );
    }
  }

  // 🔹 Crear una nueva noticia
  static async crearNoticia(req: NextRequest) {
    try {
      const body = await req.json();

      // Validación básica
      if (!body.titulo || !body.descripcion || !body.autor) {
        return NextResponse.json(
          { error: "Faltan campos obligatorios" },
          { status: 400 }
        );
      }

      const nuevaNoticia = await NoticiasModel.crear({
        titulo: body.titulo,
        descripcion: body.descripcion,
        autor: body.autor,
        contenido: body.contenido || null,
        imagen: body.imagen || null,
      });

      return NextResponse.json(nuevaNoticia, { status: 201 });
    } catch (error: any) {
      console.error("Error al crear noticia:", error);
      return NextResponse.json(
        { error: "Error al crear la noticia" },
        { status: 500 }
      );
    }
  }
}
