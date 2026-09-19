import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/feriaModel", () => ({
  FeriaModel: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerTodas: vi.fn(),
    eliminarImagenes: vi.fn(),
    reordenarImagen: vi.fn(),
    crearImagen: vi.fn(),
    marcarImagenPrincipal: vi.fn(),
    actualizar: vi.fn(),
    reemplazarEmpresas: vi.fn(),
    reemplazarFechas: vi.fn(),
    eliminarRelaciones: vi.fn(),
    eliminar: vi.fn(),
  },
}));

vi.mock("@/lib/archivosFeria", () => ({
  guardarImagenFeria: vi.fn(async (_file: any, i: number) => `/images/uploads/ferias/foto-${i}.jpg`),
  borrarImagenFeria: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

import { FeriaModel } from "@/models/feriaModel";
import { FeriaController, FeriaValidationError } from "./feriaController";

function fakeFile(size: number, type = "image/jpeg", name = "foto.jpg") {
  return { size, type, name } as unknown as File;
}

const inputBase = {
  titulo: "Feria laboral 2026",
  descripcion: "resumen",
  anio: 2026,
  imagenFiles: [] as File[],
  imagenPrincipalIndex: 0,
  empresas: [] as number[],
  fechas: [] as any[],
};

beforeEach(() => {
  vi.clearAllMocks();
  (FeriaModel.crear as any).mockResolvedValue({ id: 1 });
});

describe("FeriaController.crearFeria", () => {
  it("rechaza datos incompletos (sin título)", async () => {
    await expect(
      FeriaController.crearFeria({ ...inputBase, titulo: "" })
    ).rejects.toThrow(FeriaValidationError);
  });

  it("rechaza datos incompletos (sin descripción)", async () => {
    await expect(
      FeriaController.crearFeria({ ...inputBase, descripcion: "" })
    ).rejects.toThrow(FeriaValidationError);
  });

  it("rechaza más de 5 fotos", async () => {
    const imagenFiles = Array.from({ length: 6 }, () => fakeFile(1024));
    await expect(
      FeriaController.crearFeria({ ...inputBase, imagenFiles })
    ).rejects.toThrow(FeriaValidationError);
  });

  it("rechaza una imagen mayor a 10MB", async () => {
    await expect(
      FeriaController.crearFeria({ ...inputBase, imagenFiles: [fakeFile(11 * 1024 * 1024)] })
    ).rejects.toThrow(FeriaValidationError);
  });

  it("crea la feria cuando los datos son válidos", async () => {
    await expect(
      FeriaController.crearFeria({ ...inputBase, imagenFiles: [fakeFile(1024)] })
    ).resolves.toEqual({ id: 1 });
    expect(FeriaModel.crear).toHaveBeenCalledTimes(1);
  });
});
