import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync } from "fs";
import path from "path";
import { GET, POST } from "@/app/api/administrador/noticias/route";
import { PUT, DELETE } from "@/app/api/administrador/noticias/[id]/route";
import { NoticiasController } from "@/controllers/noticiasController";
import * as registro from "@/lib/registro";
import {
  limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, peticion, params, prisma, imagenPng, archivo,
} from "../helpers";
import { etiquetasInvalidadas } from "../setup";

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});
afterEach(() => vi.restoreAllMocks());

const enDisco = (url: string) => existsSync(path.join(process.cwd(), "public", url));
const pdf = (nombre = "doc.pdf", bytes = 10) => archivo(nombre, "application/pdf", "x".repeat(bytes));

async function crear(form: Record<string, string | File | (string | File)[]>) {
  return POST(peticion("/x", "POST", { form: { titulo: "Noticia", descripcion: "desc", ...form } }));
}

async function crearConFotos(n: number, extra: Record<string, string | File | (string | File)[]> = {}) {
  const fotos = await Promise.all(Array.from({ length: n }, (_, i) => imagenPng(`f${i}.png`)));
  const res = await crear({ imagenes: fotos, ...extra });
  return (await res.json()) as { id: number; noticia_imagen: { id: number; url: string; orden: number; principal: boolean }[]; noticia_pdf: { id: number; url: string }[]; imagen: string };
}

describe("POST /api/administrador/noticias", () => {
  it("401 sin permiso de noticias", async () => {
    iniciarSesionComo(await crearUsuario({ permisos: ["ferias"] }));
    expect((await crear({})).status).toBe(401);
    expect((await GET()).status).toBe(401);
  });

  it("crea con fotos (principal elegida) y documentos; guarda archivos y registra", async () => {
    const fotos = [await imagenPng("a.png"), await imagenPng("b.png", 2000)];
    const res = await crear({ imagenes: fotos, imagenPrincipalIndex: "1", pdfs: [pdf(), archivo("vacio.pdf", "application/pdf", "")], autor: "  Prensa ", activo: "false" });
    expect(res.status).toBe(201);
    const n = await res.json();
    expect(n.noticia_imagen).toHaveLength(2);
    expect(n.noticia_imagen.find((i: { principal: boolean }) => i.principal).orden).toBe(2);
    expect(n.imagen).toBe(n.noticia_imagen[1].url);
    expect(n.noticia_pdf).toHaveLength(1); // el PDF vacío se ignora
    expect(n.autor).toBe("Prensa");
    expect(n.activo).toBe(false);
    for (const u of [n.imagen, n.noticia_pdf[0].url]) expect(enDisco(u)).toBe(true);
    expect(etiquetasInvalidadas).toContain("noticias");
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toContain("no visible en el sitio");
  });

  it("sin fotos ni campos opcionales usa valores por defecto", async () => {
    const res = await POST(peticion("/x", "POST", { form: { titulo: "  Solo título  " } }));
    const n = await res.json();
    expect(n).toMatchObject({ titulo: "Solo título", autor: "SITECORPAC", imagen: null, descripcion: "", activo: true });
  });

  it("el índice de la principal se ajusta al rango", async () => {
    const n = await crearConFotos(2, { imagenPrincipalIndex: "9" });
    expect(n.noticia_imagen[1].principal).toBe(true);
  });

  it.each([
    ["sin título", { titulo: "  " }, "El título es obligatorio"],
    ["más de 5 documentos", { pdfs: Array.from({ length: 6 }, () => pdf()) }, "Máximo 5 documentos"],
    ["documento de tipo no permitido", { pdfs: archivo("x.html", "text/html") }, "no es un tipo de archivo permitido"],
    ["documento muy grande", { pdfs: pdf("g.pdf", 15 * 1024 * 1024 + 1) }, "debe ser menor a 15MB"],
    ["archivo que no es imagen", { imagenes: archivo("x.svg", "image/svg+xml", "<svg/>") }, "Solo se permiten imágenes"],
  ])("400 %s", async (_n, form, msg) => {
    const res = await crear(form as never);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain(msg);
  });

  it("400 con más de 5 fotos o una foto de más de 10MB", async () => {
    const fotos = await Promise.all(Array.from({ length: 6 }, () => imagenPng()));
    expect((await crear({ imagenes: fotos })).status).toBe(400);
    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" });
    const res = await crear({ imagenes: grande });
    expect((await res.json()).message).toContain("10MB");
  });

  it("GET lista para el panel (incluye ocultas)", async () => {
    await crear({ activo: "false" });
    expect(await (await GET()).json()).toHaveLength(1);
  });

  it("500 si falla al guardar / listar", async () => {
    vi.spyOn(NoticiasController, "crearNoticiaCompleta").mockRejectedValueOnce(new Error("disco lleno"));
    expect((await crear({})).status).toBe(500);
    vi.spyOn(NoticiasController, "obtenerNoticiasAdmin").mockRejectedValueOnce(new Error("x"));
    expect((await GET()).status).toBe(500);
  });
});

describe("PUT /api/administrador/noticias/[id]", () => {
  const editar = (id: number | string, form: Record<string, string | File | (string | File)[]> = {}) =>
    PUT(peticion("/x", "PUT", { form: { titulo: "Editada", descripcion: "d", contenido: "c", autor: "A", ...form } }), params(id));

  it("401 / 400 id / 404 inexistente", async () => {
    expect((await editar("abc")).status).toBe(400);
    expect((await editar(999)).status).toBe(404);
    iniciarSesionComo(await crearUsuario());
    expect((await editar(1)).status).toBe(401);
  });

  it("edita textos y guarda el historial antes/después", async () => {
    const n = await crearConFotos(0);
    const res = await editar(n.id, { activo: "false", contenido: "" });
    expect(res.status).toBe(200);
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.antes).toMatchObject({ titulo: "Noticia", activo: true });
    expect(r?.despues).toMatchObject({ titulo: "Editada", activo: false, contenido: null });
  });

  it("borra fotos (también del disco), reordena y la principal pasa a la siguiente", async () => {
    const n = await crearConFotos(3);
    const [a, b, c] = n.noticia_imagen;
    await editar(n.id, { imagenesEliminar: JSON.stringify([a.id, 99999]) });
    const d = await prisma.noticia.findUnique({ where: { id: n.id }, include: { noticia_imagen: { orderBy: { orden: "asc" } } } });
    expect(d?.noticia_imagen.map((i) => i.id)).toEqual([b.id, c.id]);
    expect(d?.noticia_imagen.map((i) => i.orden)).toEqual([1, 2]);
    expect(d?.imagen).toBe(b.url);
    expect(enDisco(a.url)).toBe(false);
  });

  it("agrega fotos nuevas y elige una nueva como principal", async () => {
    const n = await crearConFotos(1);
    await editar(n.id, { imagenes: [await imagenPng("n1.png"), await imagenPng("n2.png")], imagenPrincipalNuevaIndex: "1" });
    const d = await prisma.noticia.findUnique({ where: { id: n.id }, include: { noticia_imagen: { orderBy: { orden: "asc" } } } });
    expect(d?.noticia_imagen).toHaveLength(3);
    expect(d?.noticia_imagen[2].principal).toBe(true);
    expect(d?.imagen).toBe(d?.noticia_imagen[2].url);
  });

  it("elige una existente como principal", async () => {
    const n = await crearConFotos(2);
    await editar(n.id, { imagenPrincipalId: String(n.noticia_imagen[1].id) });
    expect((await prisma.noticia.findUnique({ where: { id: n.id } }))?.imagen).toBe(n.noticia_imagen[1].url);
  });

  it("quitar todas las fotos deja la noticia sin imagen", async () => {
    const n = await crearConFotos(1);
    await editar(n.id, { imagenesEliminar: JSON.stringify([n.noticia_imagen[0].id]) });
    expect((await prisma.noticia.findUnique({ where: { id: n.id } }))?.imagen).toBeNull();
  });

  it("listas mal escritas se ignoran", async () => {
    const n = await crearConFotos(1);
    expect((await editar(n.id, { imagenesEliminar: "{no", pdfsEliminar: "[x" })).status).toBe(200);
  });

  it("documentos: quita, agrega con el orden siguiente y valida", async () => {
    const n = await crearConFotos(0, { pdfs: [pdf("a.pdf"), pdf("b.pdf")] });
    const [pa] = n.noticia_pdf;
    await editar(n.id, { pdfsEliminar: JSON.stringify([pa.id]), pdfs: [pdf("c.pdf"), archivo("vacio.pdf", "application/pdf", "")] });
    const docs = await prisma.noticia_pdf.findMany({ where: { noticia_id: n.id }, orderBy: { orden: "asc" } });
    expect(docs.map((x) => x.nombre)).toEqual(["b.pdf", "c.pdf"]);
    expect(docs[1].orden).toBe(3);
    expect(enDisco(pa.url)).toBe(false);
  });

  it("orden nulo de un documento cuenta como 0", async () => {
    const n = await crearConFotos(0, { pdfs: pdf("a.pdf") });
    await prisma.noticia_pdf.updateMany({ where: { noticia_id: n.id }, data: { orden: null } });
    await editar(n.id, { pdfs: pdf("b.pdf") });
    expect((await prisma.noticia_pdf.findFirst({ where: { nombre: "b.pdf" } }))?.orden).toBe(1);
  });

  it.each([
    ["más de 5 fotos", async () => ({ imagenes: await Promise.all(Array.from({ length: 6 }, () => imagenPng())) }), "Máximo 5 fotos"],
    ["foto que no es imagen", async () => ({ imagenes: archivo("x.gif", "image/svg+xml", "x") }), "Solo se permiten imágenes"],
    ["foto de más de 10MB", async () => ({ imagenes: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" }) }), "10MB"],
    ["más de 5 documentos", async () => ({ pdfs: Array.from({ length: 6 }, () => pdf()) }), "Máximo 5 documentos"],
    ["documento no permitido", async () => ({ pdfs: archivo("x.exe", "application/octet-stream") }), "no es un tipo de archivo permitido"],
    ["documento de más de 15MB", async () => ({ pdfs: pdf("g.pdf", 15 * 1024 * 1024 + 1) }), "15MB"],
  ])("400 %s", async (_n, armar, msg) => {
    const n = await crearConFotos(0);
    const res = await editar(n.id, (await armar()) as never);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain(msg);
  });

  it("500 si falla", async () => {
    vi.spyOn(NoticiasController, "actualizarNoticiaCompleta").mockRejectedValueOnce(new Error("x"));
    expect((await editar(1)).status).toBe(500);
  });

  it("400 si se deja sin título", async () => {
    const n = await crearConFotos(0);
    expect((await editar(n.id, { titulo: "   " })).status).toBe(400);
  });

  it("campos vacíos del formulario (antes daba 500)", async () => {
    const n = await crearConFotos(0);
    const res = await PUT(peticion("/x", "PUT", { form: { titulo: "T" } }), params(n.id));
    expect(res.status).toBe(200);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).toContain('"T"');
  });
});

describe("DELETE /api/administrador/noticias/[id]", () => {
  it("401 / 400 / 404", async () => {
    expect((await DELETE(peticion("/x", "DELETE"), params("x"))).status).toBe(400);
    expect((await DELETE(peticion("/x", "DELETE"), params(999))).status).toBe(404);
    iniciarSesionComo(await crearUsuario());
    expect((await DELETE(peticion("/x", "DELETE"), params(1))).status).toBe(401);
  });

  it("va a la papelera: deja de existir pero sus archivos siguen en disco", async () => {
    const n = await crearConFotos(1, { pdfs: pdf() });
    expect((await DELETE(peticion("/x", "DELETE"), params(n.id))).status).toBe(200);
    expect(await prisma.noticia.findUnique({ where: { id: n.id } })).toBeNull();
    const p = await prisma.papelera.findFirst();
    expect(p).toMatchObject({ modulo: "noticias", entidadId: n.id, titulo: "Noticia" });
    expect(p?.archivos).toHaveLength(2);
    expect(enDisco(n.imagen)).toBe(true);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))?.detalle).toContain("papelera");
  });

  it("si no se pudo leer el título usa el número; 500 si falla", async () => {
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(NoticiasController, "eliminarNoticiaCompleta").mockResolvedValueOnce(true);
    await DELETE(peticion("/x", "DELETE"), params(42));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))?.detalle).toContain("#42");
    vi.spyOn(NoticiasController, "eliminarNoticiaCompleta").mockRejectedValueOnce(new Error("x"));
    expect((await DELETE(peticion("/x", "DELETE"), params(42))).status).toBe(500);
  });
});

describe("Lecturas públicas de noticias", () => {
  it("solo muestran las visibles, ordenadas por fecha; el detalle trae fotos y PDFs", async () => {
    const vis = await crearConFotos(1, { pdfs: pdf() });
    await crear({ titulo: "Oculta", activo: "false" });
    expect((await NoticiasController.obtenerNoticias()).map((x) => x.titulo)).toEqual(["Noticia"]);
    expect(await NoticiasController.obtenerUltimasNoticias()).toHaveLength(1);
    expect(await NoticiasController.obtenerUltimasNoticias(0)).toHaveLength(0);
    const det = await NoticiasController.obtenerNoticiaPorId(vis.id);
    expect(det?.noticia_imagen).toHaveLength(1);
    expect(det?.noticia_pdf).toHaveLength(1);
    const oculta = await prisma.noticia.findFirst({ where: { titulo: "Oculta" } });
    expect(await NoticiasController.obtenerNoticiaPorId(oculta!.id)).toBeNull();
  });
});

describe("casos de borde de noticias", () => {
  it("guarda el contenido cuando viene", async () => {
    const n = await (await crear({ contenido: "Texto largo" })).json();
    expect(n.contenido).toBe("Texto largo");
  });
});
