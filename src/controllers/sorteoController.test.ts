import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/sorteoModel", () => ({
  SorteoModel: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerTodos: vi.fn(),
    obtenerActivos: vi.fn(),
    eliminarImagenes: vi.fn(),
    reordenarImagen: vi.fn(),
    crearImagen: vi.fn(),
    marcarImagenPrincipal: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

vi.mock("@/lib/archivosSorteo", () => ({
  guardarImagenSorteo: vi.fn(async (_file: any, i: number) => `/images/uploads/sorteos/foto-${i}.jpg`),
  borrarImagenSorteo: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

import { SorteoModel } from "@/models/sorteoModel";
import { SorteoController, SorteoValidationError } from "./sorteoController";

function fakeFile(size: number, type = "image/jpeg", name = "foto.jpg") {
  return { size, type, name } as unknown as File;
}

const inputBase = {
  nombre: "Sorteo del día del trabajador",
  descripcion: "resumen",
  lugar: "Lima",
  anio: 2026,
  estado: "ACTIVO" as const,
  fecha_hora: new Date("2026-05-01T10:00:00Z"),
  premios: [],
  imagenFiles: [] as File[],
  imagenPrincipalIndex: 0,
  imagenUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  (SorteoModel.crear as any).mockResolvedValue({ id: 1 });
});

describe("SorteoController.crearSorteo", () => {
  it("rechaza más de 5 fotos", async () => {
    const imagenFiles = Array.from({ length: 6 }, () => fakeFile(1024));
    await expect(
      SorteoController.crearSorteo({ ...inputBase, imagenFiles })
    ).rejects.toThrow(SorteoValidationError);
  });

  it("rechaza una imagen mayor a 10MB", async () => {
    await expect(
      SorteoController.crearSorteo({ ...inputBase, imagenFiles: [fakeFile(11 * 1024 * 1024)] })
    ).rejects.toThrow(SorteoValidationError);
  });

  it("crea el sorteo con una foto subida por multipart", async () => {
    await expect(
      SorteoController.crearSorteo({ ...inputBase, imagenFiles: [fakeFile(1024)] })
    ).resolves.toEqual({ id: 1 });
    expect(SorteoModel.crear).toHaveBeenCalledTimes(1);
  });

  it("usa la URL directa cuando no llega ninguna foto por multipart (flujo JSON)", async () => {
    await SorteoController.crearSorteo({ ...inputBase, imagenUrl: "/images/uploads/sorteos/existente.jpg" });
    expect(SorteoModel.crear).toHaveBeenCalledWith(
      expect.objectContaining({ imagen: "/images/uploads/sorteos/existente.jpg" })
    );
  });
});
