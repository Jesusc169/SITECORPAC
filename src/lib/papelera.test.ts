import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/invalidarCache", () => ({ invalidarCache: vi.fn() }));
vi.mock("fs/promises", () => ({ unlink: vi.fn().mockResolvedValue(undefined) }));

// prisma de mentira, con lo justo para eliminarDefinitivamente()
const db = vi.hoisted(() => {
  const vacio = () => vi.fn().mockResolvedValue([]);
  return {
    papelera: { findUnique: vi.fn(), delete: vi.fn(), findMany: vacio() },
    noticia: { findMany: vacio() },
    noticia_imagen: { findMany: vacio() },
    noticia_pdf: { findMany: vacio() },
    evento_feria: { findMany: vacio() },
    evento_feria_imagen: { findMany: vacio() },
    sorteo: { findMany: vacio() },
    sorteo_imagen: { findMany: vacio() },
    directorio: { findMany: vacio() },
  };
});
vi.mock("@/lib/prisma", () => ({ default: db }));

import { unlink } from "fs/promises";
import { rutaArchivoSegura, eliminarDefinitivamente, esModuloPapelera } from "./papelera";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rutaArchivoSegura", () => {
  it("solo acepta archivos subidos dentro de /uploads o /images/uploads", () => {
    expect(rutaArchivoSegura("/uploads/noticias/a.jpg")).toContain("uploads");
    expect(rutaArchivoSegura("/images/uploads/noticias/a.jpg")).toContain("uploads");
  });

  it("rechaza rutas que intentan salir de la carpeta", () => {
    expect(rutaArchivoSegura("/uploads/../../.env")).toBeNull();
    expect(rutaArchivoSegura("/logo_site.jpg")).toBeNull();
    expect(rutaArchivoSegura("/uploads\\..\\x")).toBeNull();
    expect(rutaArchivoSegura("uploads/a.jpg")).toBeNull();
  });
});

describe("eliminarDefinitivamente", () => {
  it("no borra un archivo que otra feria (duplicada) sigue usando", async () => {
    db.papelera.findUnique.mockResolvedValue({
      id: 4,
      modulo: "ferias",
      titulo: "Feria",
      entidadId: 9,
      archivos: ["/uploads/ferias/compartida.jpg", "/uploads/ferias/propia.jpg"],
    });
    db.evento_feria_imagen.findMany.mockResolvedValueOnce([{ url: "/uploads/ferias/compartida.jpg" }]);

    const r = await eliminarDefinitivamente(4);

    expect(r.archivosBorrados).toBe(1);
    expect(unlink).toHaveBeenCalledTimes(1);
    expect((unlink as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("propia.jpg");
    expect(db.papelera.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it("tampoco borra un archivo que está en otra entrada de la papelera", async () => {
    db.papelera.findUnique.mockResolvedValue({
      id: 5,
      modulo: "noticias",
      titulo: "N",
      entidadId: 1,
      archivos: ["/uploads/noticias/x.jpg"],
    });
    db.papelera.findMany.mockResolvedValueOnce([{ archivos: ["/uploads/noticias/x.jpg"] }]);

    const r = await eliminarDefinitivamente(5);
    expect(r.archivosBorrados).toBe(0);
    expect(unlink).not.toHaveBeenCalled();
  });
});

describe("esModuloPapelera", () => {
  it("usuarios no va a la papelera (se desactivan)", () => {
    expect(esModuloPapelera("noticias")).toBe(true);
    expect(esModuloPapelera("usuarios")).toBe(false);
  });
});
