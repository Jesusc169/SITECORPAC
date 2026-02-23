import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export const runtime = "nodejs";

/* =====================================
   GET → Listar noticias
===================================== */
export async function GET() {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    console.error("ERROR GET NOTICIAS:", error);

    return NextResponse.json(
      { message: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}

/* =====================================
   POST → Crear noticia
===================================== */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const titulo = formData.get("titulo")?.toString().trim() || "";
    const descripcion = formData.get("descripcion")?.toString().trim() || "";
    const contenido = formData.get("contenido")?.toString() || null;
    const autor = formData.get("autor")?.toString().trim() || "SITECORPAC";
    const imagenFile = formData.get("imagen") as File | null;

    // Validación mínima (sin romper tu lógica)
    if (!titulo) {
      return NextResponse.json(
        { message: "El título es obligatorio" },
        { status: 400 }
      );
    }

    let imagenPath: string | null = null;

    /* =============================
       Guardar imagen si existe
    ============================== */
    if (imagenFile && imagenFile.size > 0) {
      // Validación tipo
      if (!imagenFile.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "Solo se permiten imágenes" },
          { status: 400 }
        );
      }

      // Validación tamaño (2MB)
      if (imagenFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { message: "La imagen debe ser menor a 2MB" },
          { status: 400 }
        );
      }

      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nombreArchivo = `noticia-${Date.now()}-${imagenFile.name.replace(
        /\s+/g,
        "_"
      )}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "images",
        "uploads",
        "noticias"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, nombreArchivo);
      await writeFile(filePath, buffer);

      imagenPath = `/images/uploads/noticias/${nombreArchivo}`;
    }

    const now = new Date();

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        descripcion,
        contenido,
        autor,
        imagen: imagenPath,
        fecha: now,
        updatedAt: now,
      },
    });

    return NextResponse.json(nuevaNoticia, { status: 201 });

  } catch (error) {
    console.error("ERROR CREANDO NOTICIA:", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}