import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync } from "fs";
import path from "path";
import { GET, POST } from "@/app/api/administrador/directorio/route";
import { PUT, DELETE } from "@/app/api/administrador/directorio/[id]/route";
import { GET as publico } from "@/app/api/directorio/route";
import { DirectorioController } from "@/controllers/directorioController";
import * as registro from "@/lib/registro";
import { limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, cerrarSesion, peticion, prisma, imagenPng, archivo } from "../helpers";

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});
afterEach(() => vi.restoreAllMocks());

const enDisco = (url: string) => existsSync(path.join(process.cwd(), "public", url));
const ruta = (id: number | string) => `/api/administrador/directorio/${id}`;

const agregar = (form: Record<string, string | File> = {}) =>
  POST(peticion("/api/administrador/directorio", "POST", { form: { nombre: "Ana Pérez", cargo: "Secretaria General", correo: "ana@corpac.pe", telefono: "999", periodoInicio: "2025-01-01", periodoFin: "2027-12-31", ...form } }));

describe("POST /api/administrador/directorio", () => {
  it("401 sin permiso de directorio", async () => {
    iniciarSesionComo(await crearUsuario({ permisos: ["noticias"] }));
    expect((await agregar()).status).toBe(401);
    expect((await GET()).status).toBe(401);
    expect((await PUT(peticion(ruta(1), "PUT", { form: {} }))).status).toBe(401);
    expect((await DELETE(peticion(ruta(1), "DELETE"))).status).toBe(401);
  });

  it("agrega con foto, fechas a mediodía local y orden al final; registra", async () => {
    const r1 = await (await agregar({ foto: await imagenPng("ana.png") })).json();
    const r2 = await (await agregar({ nombre: "Luis", periodoFin: "" })).json();
    expect(r1.fotoUrl).toMatch(/^\/uploads\/directorio\//);
    expect(enDisco(r1.fotoUrl)).toBe(true);
    expect(new Date(r1.periodoInicio).getHours()).toBe(12);
    expect([r1.orden, r2.orden]).toEqual([1, 2]);
    expect(r2.periodoFin).toBeNull();
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toBe("Agregó a Ana Pérez (Secretaria General) al directorio");
  });

  it("sin teléfono se guarda vacío (antes daba 500)", async () => {
    const res = await POST(peticion("/x", "POST", { form: { nombre: "A", cargo: "B", correo: "c@d.e", periodoInicio: "2025-01-01" } }));
    expect(res.status).toBe(201);
    expect((await res.json()).telefono).toBe("");
  });

  it("400 si faltan datos o la foto no es imagen; 500 si falla", async () => {
    expect((await agregar({ correo: "" })).status).toBe(400);
    expect((await agregar({ foto: archivo("x.svg", "image/svg+xml") })).status).toBe(400);
    vi.spyOn(DirectorioController, "crearMiembro").mockRejectedValueOnce(new Error("x"));
    expect((await agregar()).status).toBe(500);
  });

  it("GET para el panel ordenado; 500 si falla", async () => {
    await agregar({ nombre: "Uno" });
    await agregar({ nombre: "Dos" });
    expect((await (await GET()).json()).map((m: { nombre: string }) => m.nombre)).toEqual(["Uno", "Dos"]);
    vi.spyOn(DirectorioController, "obtenerDirectorio").mockRejectedValueOnce(new Error("x"));
    expect((await GET()).status).toBe(500);
  });
});

describe("PUT /api/administrador/directorio/[id]", () => {
  it("cambia solo lo que llega; nueva foto reemplaza y borra la anterior", async () => {
    const m = await (await agregar({ foto: await imagenPng() })).json();
    const res = await PUT(peticion(ruta(m.id), "PUT", { form: { cargo: "Presidenta", foto: await imagenPng("nueva.png"), periodoInicio: "2026-02-01", periodoFin: "2028-02-01" } }));
    const d = await res.json();
    expect(d).toMatchObject({ nombre: "Ana Pérez", cargo: "Presidenta" });
    expect(d.fotoUrl).not.toBe(m.fotoUrl);
    expect(enDisco(m.fotoUrl)).toBe(false);
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.detalle).toBe("Editó a Ana Pérez (Presidenta) en el directorio (nueva foto)");
    expect(r?.antes).toMatchObject({ cargo: "Secretaria General" });
  });

  it("todos los campos de texto, sin foto", async () => {
    const m = await (await agregar()).json();
    await PUT(peticion(ruta(m.id), "PUT", { form: { nombre: "N", cargo: "C", correo: "x@y.z", telefono: "1" } }));
    expect(await prisma.directorio.findUnique({ where: { id: m.id } })).toMatchObject({ nombre: "N", cargo: "C", correo: "x@y.z", telefono: "1", fotoUrl: null });
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).not.toContain("nueva foto");
  });

  it("400 id, 404 inexistente, 400 foto inválida, 500, '#id'", async () => {
    expect((await PUT(peticion(ruta("abc"), "PUT", { form: {} }))).status).toBe(400);
    expect((await PUT(peticion(ruta(999), "PUT", { form: {} }))).status).toBe(404);
    const m = await (await agregar()).json();
    expect((await PUT(peticion(ruta(m.id), "PUT", { form: { foto: archivo("x.svg", "image/svg+xml") } }))).status).toBe(400);
    vi.spyOn(DirectorioController, "actualizarMiembro").mockResolvedValueOnce({} as never);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    await PUT(peticion(ruta(55), "PUT", { form: {} }));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar", entidadId: 55 } }))?.detalle).toContain("#55");
    vi.spyOn(DirectorioController, "actualizarMiembro").mockRejectedValueOnce(new Error("x"));
    expect((await PUT(peticion(ruta(55), "PUT", { form: {} }))).status).toBe(500);
  });
});

describe("DELETE /api/administrador/directorio/[id]", () => {
  it("papelera (la foto sigue en disco), 400, 404, '#id', 500", async () => {
    const m = await (await agregar({ foto: await imagenPng() })).json();
    expect((await DELETE(peticion(ruta(m.id), "DELETE"))).status).toBe(200);
    expect(enDisco(m.fotoUrl)).toBe(true);
    expect((await prisma.papelera.findFirst())?.titulo).toBe("Ana Pérez (Secretaria General)");
    expect((await DELETE(peticion(ruta("x"), "DELETE"))).status).toBe(400);
    expect((await DELETE(peticion(ruta(999), "DELETE"))).status).toBe(404);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(DirectorioController, "eliminarMiembro").mockResolvedValueOnce("x");
    await DELETE(peticion(ruta(33), "DELETE"));
    expect((await prisma.registro_actividad.findFirst({ where: { entidadId: 33 } }))?.detalle).toContain("#33");
    vi.spyOn(DirectorioController, "eliminarMiembro").mockRejectedValueOnce(new Error("x"));
    expect((await DELETE(peticion(ruta(33), "DELETE"))).status).toBe(500);
  });
});

describe("/api/directorio (público)", () => {
  it("forma pública con nombres de campo propios; 500", async () => {
    await agregar();
    cerrarSesion();
    const [m] = await (await publico()).json();
    expect(m).toMatchObject({ nombre: "Ana Pérez", email: "ana@corpac.pe", telefono: "999", foto: null, orden: 1 });
    expect(m.fechaInicio).toBeTruthy();
    vi.spyOn(DirectorioController, "obtenerDirectorioPublico").mockRejectedValueOnce(new Error("x"));
    expect((await publico()).status).toBe(500);
  });
});
