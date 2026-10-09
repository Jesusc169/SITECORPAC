import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/administrador/sorteos/route";
import { GET as GETuno, PUT, DELETE } from "@/app/api/administrador/sorteos/[id]/route";
import { POST as DUPLICAR } from "@/app/api/administrador/sorteos/[id]/duplicar/route";
import { GET as publicos } from "@/app/api/sorteos/route";
import { SorteoController } from "@/controllers/sorteoController";
import * as registro from "@/lib/registro";
import {
  limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, cerrarSesion, peticion, params, prisma, imagenPng, archivo,
} from "../helpers";

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});
afterEach(() => vi.restoreAllMocks());

const PREMIOS = JSON.stringify([{ nombre: "TV", descripcion: "55 pulgadas", cantidad: 2 }, { nombre: "Radio" }]);
const nreq = (r: Request) => new NextRequest(r);

const crearMultipart = (form: Record<string, string | File | (string | File)[]> = {}) =>
  POST(peticion("/x", "POST", { form: { nombre: "Sorteo Navidad", descripcion: "Para afiliados", lugar: "Sede", anio: "2026", fecha_hora: "2026-12-20T19:00:00-05:00", premios: PREMIOS, ...form } }));

describe("POST /api/administrador/sorteos", () => {
  it("401 sin permiso de sorteos (todas las rutas)", async () => {
    iniciarSesionComo(await crearUsuario({ permisos: ["ferias"] }));
    expect((await crearMultipart()).status).toBe(401);
    expect((await GET()).status).toBe(401);
    expect((await GETuno(nreq(peticion("/x")), params(1))).status).toBe(401);
    expect((await PUT(nreq(peticion("/x", "PUT", { form: {} })), params(1))).status).toBe(401);
    expect((await DELETE(nreq(peticion("/x", "DELETE")), params(1))).status).toBe(401);
    expect((await DUPLICAR(peticion("/x", "POST"), params(1))).status).toBe(401);
  });

  it("multipart: crea con fotos, premios normalizados y registra", async () => {
    const res = await crearMultipart({ imagenes: [await imagenPng(), await imagenPng()], imagenPrincipalIndex: "1", estado: "INACTIVO" });
    const s = await res.json();
    expect(s.sorteo_imagen).toHaveLength(2);
    expect(s.imagen).toBe(s.sorteo_imagen[1].url);
    expect(s.estado).toBe("INACTIVO");
    expect(s.sorteo_producto.map((p: { nombre: string; cantidad: number; descripcion: string }) => [p.nombre, p.cantidad, p.descripcion])).toEqual([["TV", 2, "55 pulgadas"], ["Radio", 1, ""]]);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toBe('Creó el sorteo "Sorteo Navidad" (no visible en el sitio)');
  });

  it("multipart mínimo: usa 'titulo', año y fecha actuales, sin premios", async () => {
    const res = await POST(peticion("/x", "POST", { form: { titulo: "Por título", lugar: "Sede" } }));
    const s = await res.json();
    expect(s).toMatchObject({ nombre: "Por título", descripcion: "", anio: new Date().getFullYear(), estado: "ACTIVO", sorteo_producto: [] });
  });

  it("multipart sin nombre ni título", async () => {
    const s = await (await POST(peticion("/x", "POST", { form: { lugar: "Sede" } }))).json();
    expect(s.nombre).toBe("");
  });

  it("JSON: crea con imagen por URL y todos los campos", async () => {
    const res = await POST(peticion("/x", "POST", { json: { nombre: "Por JSON", descripcion: "d", lugar: "Sede", anio: 2025, estado: "INACTIVO", fecha_hora: "2025-07-28T10:00:00-05:00", premios: [{ nombre: "Canasta", cantidad: "3" }], imagen: "/uploads/sorteos/x.jpg" } }));
    const s = await res.json();
    expect(s).toMatchObject({ nombre: "Por JSON", anio: 2025, estado: "INACTIVO", imagen: "/uploads/sorteos/x.jpg" });
    expect(s.sorteo_imagen[0]).toMatchObject({ url: "/uploads/sorteos/x.jpg", principal: true });
  });

  it("JSON mínimo: valores por defecto y fecha inválida → ahora", async () => {
    const s = await (await POST(peticion("/x", "POST", { json: { titulo: "T", lugar: "L", fecha_hora: "no-es-fecha" } }))).json();
    expect(s).toMatchObject({ nombre: "T", descripcion: "", estado: "ACTIVO", imagen: null, anio: new Date().getFullYear() });
    expect(Math.abs(new Date(s.fecha_hora).getTime() - Date.now())).toBeLessThan(60_000);
    const s2 = await (await POST(peticion("/x", "POST", { json: { lugar: "L" } }))).json();
    expect(s2.nombre).toBe("");
  });

  it("si llega foto y URL, gana la foto", async () => {
    const s = await (await crearMultipart({ imagenes: await imagenPng(), imagenPrincipalIndex: "9" })).json();
    expect(s.imagen).toMatch(/^\/uploads\/sorteos\//);
  });

  it.each([
    ["sin lugar", { lugar: " " }, "Indica el lugar"],
    ["lugar muy largo", { lugar: "x".repeat(151) }, "150"],
  ])("400 %s", async (_n, form, msg) => {
    const res = await crearMultipart(form);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(msg);
  });

  it("400 por fotos: más de 5, más de 10MB o no imagen", async () => {
    expect((await crearMultipart({ imagenes: await Promise.all(Array.from({ length: 6 }, () => imagenPng())) })).status).toBe(400);
    expect((await crearMultipart({ imagenes: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" }) })).status).toBe(400);
    expect((await crearMultipart({ imagenes: archivo("x.svg", "image/svg+xml") })).status).toBe(400);
  });

  it("500 si falla; GET lista para el panel", async () => {
    await crearMultipart();
    expect(await (await GET()).json()).toHaveLength(1);
    vi.spyOn(SorteoController, "crearSorteo").mockRejectedValueOnce(new Error("x"));
    expect((await crearMultipart()).status).toBe(500);
    vi.spyOn(SorteoController, "obtenerSorteosAdmin").mockRejectedValueOnce(new Error("x"));
    expect((await GET()).status).toBe(500);
  });
});

describe("GET/PUT /api/administrador/sorteos/[id]", () => {
  const editar = (id: number | string, form: Record<string, string | File | (string | File)[]> = {}) =>
    PUT(nreq(peticion("/x", "PUT", { form: { nombre: "Editado", descripcion: "d2", lugar: "Aeropuerto", fecha_hora: "2026-12-24T20:00:00-05:00", anio: "2026", premios: PREMIOS, ...form } })), params(id));

  it("GET por id: 400, 404, 200 y 500", async () => {
    const s = await (await crearMultipart()).json();
    expect((await GETuno(nreq(peticion("/x")), params("0"))).status).toBe(400);
    expect((await GETuno(nreq(peticion("/x")), params(999))).status).toBe(404);
    expect((await (await GETuno(nreq(peticion("/x")), params(s.id))).json()).nombre).toBe("Sorteo Navidad");
    vi.spyOn(SorteoController, "obtenerSorteoPorId").mockRejectedValueOnce(new Error("x"));
    expect((await GETuno(nreq(peticion("/x")), params(s.id))).status).toBe(500);
  });

  it("edita y guarda el historial (con premios)", async () => {
    const s = await (await crearMultipart()).json();
    const res = await editar(s.id, { estado: "INACTIVO", premios: JSON.stringify([{ nombre: "Moto", cantidad: 1 }]) });
    expect(res.status).toBe(200);
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.detalle).toBe('Editó el sorteo "Editado" (no visible en el sitio)');
    expect(r?.antes).toMatchObject({ premios: ["TV ×2", "Radio"] });
    expect(r?.despues).toMatchObject({ premios: ["Moto"], lugar: "Aeropuerto", estado: "INACTIVO" });
  });

  it("sin año usa el de la fecha; premios mal escritos → sin premios", async () => {
    const s = await (await crearMultipart()).json();
    await editar(s.id, { anio: "", premios: "{x", fecha_hora: "2027-01-05T10:00:00-05:00" });
    const d = await prisma.sorteo.findUnique({ where: { id: s.id }, include: { sorteo_producto: true } });
    expect(d?.anio).toBe(2027);
    expect(d?.sorteo_producto).toHaveLength(0);
  });

  it("sin premios en el formulario", async () => {
    const s = await (await crearMultipart()).json();
    const res = await PUT(nreq(peticion("/x", "PUT", { form: { nombre: "N", descripcion: "d", lugar: "L", fecha_hora: "2026-01-01T10:00:00-05:00" } })), params(s.id));
    expect(res.status).toBe(200);
  });

  it("fotos: borra, reordena, agrega y elige la principal", async () => {
    const s = await (await crearMultipart({ imagenes: [await imagenPng(), await imagenPng(), await imagenPng()] })).json();
    const [a, b, c] = s.sorteo_imagen;
    await editar(s.id, { imagenesEliminar: JSON.stringify([a.id]), imagenes: await imagenPng(), imagenPrincipalId: String(c.id) });
    const d = await prisma.sorteo.findUnique({ where: { id: s.id }, include: { sorteo_imagen: { orderBy: { orden: "asc" } } } });
    expect(d?.sorteo_imagen.map((i) => i.orden)).toEqual([1, 2, 3]);
    expect(d?.sorteo_imagen[0].id).toBe(b.id);
    expect(d?.imagen).toBe(c.url);
    await editar(s.id, { imagenes: await imagenPng(), imagenPrincipalNuevaIndex: "0", imagenesEliminar: "{mal" });
    const d2 = await prisma.sorteo.findUnique({ where: { id: s.id }, include: { sorteo_imagen: { orderBy: { orden: "asc" } } } });
    expect(d2?.imagen).toBe(d2?.sorteo_imagen[3].url);
  });

  it("quitar todas las fotos deja el sorteo sin imagen", async () => {
    const s = await (await crearMultipart({ imagenes: await imagenPng() })).json();
    await editar(s.id, { imagenesEliminar: JSON.stringify([s.sorteo_imagen[0].id]) });
    expect((await prisma.sorteo.findUnique({ where: { id: s.id } }))?.imagen).toBeNull();
  });

  it.each([
    ["faltan campos", async () => ({ lugar: "" }), "Campos obligatorios"],
    ["lugar muy largo", async () => ({ lugar: "x".repeat(151) }), "150"],
    ["más de 5 fotos", async () => ({ imagenes: await Promise.all(Array.from({ length: 6 }, () => imagenPng())) }), "Máximo 5"],
    ["foto de más de 10MB", async () => ({ imagenes: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" }) }), "10MB"],
    ["archivo que no es imagen", async () => ({ imagenes: archivo("x.svg", "image/svg+xml") }), ""],
  ])("400 %s", async (_n, armar, msg) => {
    const s = await (await crearMultipart()).json();
    const res = await editar(s.id, (await armar()) as never);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(msg);
  });

  it("400 id inválido, 404 inexistente, 500 error", async () => {
    expect((await editar("x")).status).toBe(400);
    expect((await editar(999)).status).toBe(404);
    vi.spyOn(SorteoController, "actualizarSorteo").mockRejectedValueOnce(new Error("x"));
    expect((await editar(1)).status).toBe(500);
  });
});

describe("duplicar y eliminar sorteos", () => {
  it("duplica con '(Copia)', ACTIVO, mismos premios e imagen", async () => {
    const s = await (await crearMultipart({ imagenes: await imagenPng(), estado: "INACTIVO" })).json();
    await prisma.sorteo_producto.updateMany({ where: { sorteo_id: s.id, nombre: "Radio" }, data: { descripcion: null, cantidad: null } });
    const n = await (await DUPLICAR(peticion("/x", "POST"), params(s.id))).json();
    expect(n).toMatchObject({ nombre: "Sorteo Navidad (Copia)", estado: "ACTIVO", imagen: s.imagen });
    expect(n.sorteo_producto.find((p: { nombre: string }) => p.nombre === "Radio")).toMatchObject({ descripcion: "", cantidad: 1 });
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "duplicar" } }))?.detalle).toContain('"Sorteo Navidad"');
  });

  it("duplicar: 400, 404, '#id', 500", async () => {
    expect((await DUPLICAR(peticion("/x", "POST"), params("0"))).status).toBe(400);
    expect((await DUPLICAR(peticion("/x", "POST"), params(999))).status).toBe(404);
    vi.spyOn(SorteoController, "duplicarSorteo").mockResolvedValueOnce({ id: 3 } as never);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    await DUPLICAR(peticion("/x", "POST"), params(66));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "duplicar" } }))?.detalle).toContain("#66");
    vi.spyOn(SorteoController, "duplicarSorteo").mockRejectedValueOnce(new Error("x"));
    expect((await DUPLICAR(peticion("/x", "POST"), params(66))).status).toBe(500);
  });

  it("eliminar → papelera; 400; '#id'; 500", async () => {
    const s = await (await crearMultipart()).json();
    expect((await DELETE(nreq(peticion("/x", "DELETE")), params(s.id))).status).toBe(200);
    expect(await prisma.papelera.count()).toBe(1);
    expect((await DELETE(nreq(peticion("/x", "DELETE")), params("x"))).status).toBe(400);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(SorteoController, "eliminarSorteo").mockResolvedValueOnce(null);
    await DELETE(nreq(peticion("/x", "DELETE")), params(44));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar", entidadId: 44 } }))?.detalle).toContain("#44");
    vi.spyOn(SorteoController, "eliminarSorteo").mockRejectedValueOnce(new Error("x"));
    expect((await DELETE(nreq(peticion("/x", "DELETE")), params(44))).status).toBe(500);
  });
});

describe("/api/sorteos (público)", () => {
  it("solo ACTIVO, filtro por año, 500", async () => {
    await crearMultipart({ nombre: "A" });
    await crearMultipart({ nombre: "B", anio: "2025" });
    await crearMultipart({ nombre: "Oculto", estado: "INACTIVO" });
    cerrarSesion();
    expect((await (await publicos(peticion("/api/sorteos"))).json()).map((s: { nombre: string }) => s.nombre).sort()).toEqual(["A", "B"]);
    expect((await (await publicos(peticion("/api/sorteos?anio=2025"))).json()).map((s: { nombre: string }) => s.nombre)).toEqual(["B"]);
    expect(await (await publicos(peticion("/api/sorteos?anio=25"))).json()).toHaveLength(2);
    vi.spyOn(SorteoController, "obtenerSorteosPublicos").mockRejectedValueOnce(new Error("x"));
    expect((await publicos(peticion("/api/sorteos"))).status).toBe(500);
  });
});
