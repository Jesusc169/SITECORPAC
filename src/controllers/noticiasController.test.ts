import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/noticiaModel", () => ({
  NoticiaModel: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerTodas: vi.fn(),
    eliminarImagenes: vi.fn(),
    reordenarImagen: vi.fn(),
    crearImagen: vi.fn(),
    marcarImagenPrincipal: vi.fn(),
    eliminarPdfs: vi.fn(),
    crearPdf: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

vi.mock("@/lib/archivosNoticia", () => ({
  esImagenValida: vi.fn(() => true),
  esDocumentoPermitido: vi.fn(() => true),
  guardarImagenNoticia: vi.fn(async (_file: any, i: number) => `/images/uploads/noticias/foto-${i}.jpg`),
  borrarImagenNoticia: vi.fn(),
  guardarDocumentoNoticia: vi.fn(async (_file: any, i: number) => `/uploads/noticias/doc-${i}.pdf`),
  borrarDocumentoNoticia: vi.fn(),
  MAX_IMAGEN_BYTES: 10 * 1024 * 1024,
  MAX_DOCUMENTO_BYTES: 15 * 1024 * 1024,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

import { NoticiaModel } from "@/models/noticiaModel";
import { esImagenValida, esDocumentoPermitido } from "@/lib/archivosNoticia";
import { NoticiasController, NoticiaValidationError } from "./noticiasController";

function fakeFile(size: number, type = "image/jpeg", name = "foto.jpg") {
  return { size, type, name } as unknown as File;
}

const inputBase = {
  titulo: "Asamblea general",
  descripcion: "resumen",
  contenido: null,
  autor: "Secretaría",
  imagenFiles: [] as File[],
  imagenPrincipalIndex: 0,
  pdfFiles: [] as File[],
};

beforeEach(() => {
  vi.clearAllMocks();
  (esImagenValida as any).mockReturnValue(true);
  (esDocumentoPermitido as any).mockReturnValue(true);
  (NoticiaModel.crear as any).mockResolvedValue({ id: 1 });
});

describe("NoticiasController.crearNoticiaCompleta", () => {
  it("exige título", async () => {
    await expect(
      NoticiasController.crearNoticiaCompleta({ ...inputBase, titulo: "  " })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza más de 5 documentos", async () => {
    const pdfFiles = Array.from({ length: 6 }, () => fakeFile(1024, "application/pdf", "doc.pdf"));
    await expect(
      NoticiasController.crearNoticiaCompleta({ ...inputBase, pdfFiles })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza más de 5 fotos", async () => {
    const imagenFiles = Array.from({ length: 6 }, () => fakeFile(1024));
    await expect(
      NoticiasController.crearNoticiaCompleta({ ...inputBase, imagenFiles })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza un archivo de imagen que no es una imagen válida", async () => {
    (esImagenValida as any).mockReturnValue(false);
    await expect(
      NoticiasController.crearNoticiaCompleta({ ...inputBase, imagenFiles: [fakeFile(1024)] })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza una imagen mayor a 10MB", async () => {
    await expect(
      NoticiasController.crearNoticiaCompleta({
        ...inputBase,
        imagenFiles: [fakeFile(11 * 1024 * 1024)],
      })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza un documento con tipo no permitido", async () => {
    (esDocumentoPermitido as any).mockReturnValue(false);
    await expect(
      NoticiasController.crearNoticiaCompleta({
        ...inputBase,
        pdfFiles: [fakeFile(1024, "application/zip", "malware.zip")],
      })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("rechaza un documento mayor a 15MB", async () => {
    await expect(
      NoticiasController.crearNoticiaCompleta({
        ...inputBase,
        pdfFiles: [fakeFile(16 * 1024 * 1024, "application/pdf", "grande.pdf")],
      })
    ).rejects.toThrow(NoticiaValidationError);
  });

  it("crea la noticia cuando los datos son válidos", async () => {
    await expect(
      NoticiasController.crearNoticiaCompleta({
        ...inputBase,
        imagenFiles: [fakeFile(1024)],
      })
    ).resolves.toEqual({ id: 1 });
    expect(NoticiaModel.crear).toHaveBeenCalledTimes(1);
  });
});
