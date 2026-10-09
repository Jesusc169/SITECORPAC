import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, POST } from "@/app/api/administrador/ferias/route";
import { GET as GETuno, PUT, DELETE } from "@/app/api/administrador/ferias/[id]/route";
import { POST as DUPLICAR } from "@/app/api/administrador/ferias/[id]/duplicar/route";
import { GET as publicas } from "@/app/api/ferias/route";
import { GET as empresas } from "@/app/api/administrador/empresas/route";
import { FeriaController } from "@/controllers/feriaController";
import { EmpresaController } from "@/controllers/empresaController";
import * as registro from "@/lib/registro";
import {
  limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, cerrarSesion, peticion, params, prisma, imagenPng, archivo,
} from "../helpers";

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});
afterEach(() => vi.restoreAllMocks());

const FECHAS = JSON.stringify([
  { fecha: "2026-03-30", hora_inicio: "09:00", hora_fin: "17:00", ubicacion: "Sede", zona: "Lima" },
  { fecha: "2026-03-31", hora_inicio: "09:00", hora_fin: "13:00", ubicacion: "Aeropuerto" },
]);

const empresa = (nombre: string) => prisma.empresa.create({ data: { nombre, logo_url: "/uploads/empresas/x.png" } });

async function crearFeria(form: Record<string, string | File | (string | File)[]> = {}) {
  const res = await POST(peticion("/x", "POST", { form: { titulo: "Feria Colinda", descripcion: "Precios bajos", anio: "2026", fechas: FECHAS, ...form } }));
  return res;
}

describe("POST /api/administrador/ferias", () => {
  it("401 sin permiso de ferias", async () => {
    iniciarSesionComo(await crearUsuario({ permisos: ["noticias"] }));
    expect((await crearFeria()).status).toBe(401);
    expect((await GET()).status).toBe(401);
    expect((await GETuno(peticion("/x"), params(1))).status).toBe(401);
    expect((await PUT(peticion("/x", "PUT", { form: {} }), params(1))).status).toBe(401);
    expect((await DELETE(peticion("/x", "DELETE"), params(1))).status).toBe(401);
    expect((await DUPLICAR(peticion("/x", "POST"), params(1))).status).toBe(401);
  });

  it("crea con fotos, fechas y empresas; registra", async () => {
    const e = await empresa("Kola Real");
    const res = await crearFeria({ imagenes: [await imagenPng("a.png"), await imagenPng("b.png")], imagenPrincipalIndex: "1", empresas: JSON.stringify([e.id]), estado: "false" });
    expect(res.status).toBe(201);
    const f = await res.json();
    expect(f.evento_feria_imagen).toHaveLength(2);
    expect(f.imagen_portada).toBe(f.evento_feria_imagen[1].url);
    expect(f.evento_feria_fecha).toHaveLength(2);
    expect(f.evento_feria_fecha[1].zona).toBeNull();
    expect(f.evento_feria_empresa[0].empresa.nombre).toBe("Kola Real");
    expect(f.estado).toBe(false);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toBe('Creó la feria "Feria Colinda" (no visible en el sitio)');
  });

  it("sin fotos, empresas ni fechas", async () => {
    const res = await POST(peticion("/x", "POST", { form: { titulo: "T", descripcion: "D", anio: "2026" } }));
    const f = await res.json();
    expect(f).toMatchObject({ imagen_portada: null, estado: true });
  });

  it("índice de portada fuera de rango se ajusta", async () => {
    const f = await (await crearFeria({ imagenes: await imagenPng(), imagenPrincipalIndex: "7" })).json();
    expect(f.evento_feria_imagen[0].principal).toBe(true);
  });

  it.each([
    ["sin título", { titulo: " " }, "Datos incompletos"],
    ["sin año", { anio: "" }, "Datos incompletos"],
  ])("400 %s", async (_n, form, msg) => {
    const res = await crearFeria(form);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(msg);
  });

  it("400 con más de 5 fotos, una foto de más de 10MB o un archivo que no es imagen", async () => {
    expect((await crearFeria({ imagenes: await Promise.all(Array.from({ length: 6 }, () => imagenPng())) })).status).toBe(400);
    expect((await crearFeria({ imagenes: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" }) })).status).toBe(400);
    expect((await crearFeria({ imagenes: archivo("x.svg", "image/svg+xml") })).status).toBe(400);
  });

  it("500 si falla", async () => {
    vi.spyOn(FeriaController, "crearFeria").mockRejectedValueOnce(new Error("x"));
    expect((await crearFeria()).status).toBe(500);
    vi.spyOn(FeriaController, "obtenerFeriasAdmin").mockRejectedValueOnce(new Error("x"));
    expect((await GET()).status).toBe(500);
  });

  it("GET lista para el panel y GET por id", async () => {
    const f = await (await crearFeria()).json();
    expect(await (await GET()).json()).toHaveLength(1);
    expect((await (await GETuno(peticion("/x"), params(f.id))).json()).titulo).toBe("Feria Colinda");
    expect((await GETuno(peticion("/x"), params(9999))).status).toBe(404);
  });
});

describe("PUT /api/administrador/ferias/[id]", () => {
  const editar = (id: number, form: Record<string, string | File | (string | File)[]> = {}) =>
    PUT(peticion("/x", "PUT", { form: { titulo: "Feria editada", descripcion: "Nueva", fechas: FECHAS, ...form } }), params(id));

  it("edita textos, año, empresas y fechas; guarda historial", async () => {
    const e1 = await empresa("A");
    const e2 = await empresa("B");
    const f = await (await crearFeria({ empresas: JSON.stringify([e1.id]) })).json();
    const res = await editar(f.id, { anio: "2027", empresas: JSON.stringify([e2.id]), fechas: JSON.stringify([]), estado: "false" });
    expect(res.status).toBe(200);
    const d = await prisma.evento_feria.findUnique({ where: { id: f.id }, include: { evento_feria_empresa: true, evento_feria_fecha: true } });
    expect(d).toMatchObject({ titulo: "Feria editada", anio: 2027, estado: false });
    expect(d?.evento_feria_empresa.map((x) => x.empresa_id)).toEqual([e2.id]);
    expect(d?.evento_feria_fecha).toHaveLength(0);
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.detalle).toBe('Editó la feria "Feria editada" (no visible en el sitio)');
    expect(r?.antes).toMatchObject({ titulo: "Feria Colinda", empresas: ["A"] });
    expect(r?.despues).toMatchObject({ titulo: "Feria editada", empresas: ["B"] });
  });

  it("sin año ni empresas ni fechas en el formulario conserva el año", async () => {
    const f = await (await crearFeria()).json();
    await PUT(peticion("/x", "PUT", { form: { titulo: "T", descripcion: "D" } }), params(f.id));
    expect((await prisma.evento_feria.findUnique({ where: { id: f.id } }))?.anio).toBe(2026);
  });

  it("fotos: borra, reordena, agrega y elige la principal", async () => {
    const f = await (await crearFeria({ imagenes: [await imagenPng(), await imagenPng(), await imagenPng()] })).json();
    const [a, b, c] = f.evento_feria_imagen;
    await editar(f.id, { imagenesEliminar: JSON.stringify([a.id]), imagenes: await imagenPng("n.png"), imagenPrincipalId: String(c.id) });
    const d = await prisma.evento_feria.findUnique({ where: { id: f.id }, include: { evento_feria_imagen: { orderBy: { orden: "asc" } } } });
    expect(d?.evento_feria_imagen.map((i) => i.orden)).toEqual([1, 2, 3]);
    expect(d?.evento_feria_imagen[0].id).toBe(b.id);
    expect(d?.imagen_portada).toBe(c.url);
    await editar(f.id, { imagenes: await imagenPng("m.png"), imagenPrincipalNuevaIndex: "0" });
    const d2 = await prisma.evento_feria.findUnique({ where: { id: f.id }, include: { evento_feria_imagen: { orderBy: { orden: "asc" } } } });
    expect(d2?.imagen_portada).toBe(d2?.evento_feria_imagen[3].url);
  });

  it("quitar todas las fotos deja la feria sin portada; lista mal escrita se ignora", async () => {
    const f = await (await crearFeria({ imagenes: await imagenPng() })).json();
    expect((await editar(f.id, { imagenesEliminar: "{x" })).status).toBe(200);
    await editar(f.id, { imagenesEliminar: JSON.stringify([f.evento_feria_imagen[0].id]) });
    expect((await prisma.evento_feria.findUnique({ where: { id: f.id } }))?.imagen_portada).toBeNull();
  });

  it.each([
    ["año inválido", async () => ({ anio: "1999" }), "año"],
    ["sin título (antes daba 500)", async () => ({ titulo: "" }), "Datos incompletos"],
    ["más de 5 fotos", async () => ({ imagenes: await Promise.all(Array.from({ length: 6 }, () => imagenPng())) }), "Máximo 5"],
    ["foto de más de 10MB", async () => ({ imagenes: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", { type: "image/png" }) }), "10MB"],
    ["archivo que no es imagen", async () => ({ imagenes: archivo("x.svg", "image/svg+xml") }), ""],
  ])("400 %s", async (_n, armar, msg) => {
    const f = await (await crearFeria()).json();
    const res = await editar(f.id, (await armar()) as never);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(msg);
  });

  it("404 si no existe y 500 si falla", async () => {
    expect((await editar(9999)).status).toBe(404);
    vi.spyOn(FeriaController, "actualizarFeria").mockRejectedValueOnce(new Error("x"));
    expect((await editar(1)).status).toBe(500);
  });
});

describe("duplicar y eliminar ferias", () => {
  it("duplica con '(Copia)', año actual, fechas, empresas y la MISMA portada", async () => {
    const e = await empresa("A");
    const f = await (await crearFeria({ imagenes: await imagenPng(), empresas: JSON.stringify([e.id]) })).json();
    const res = await DUPLICAR(peticion("/x", "POST"), params(f.id));
    const { nuevaFeria } = await res.json();
    expect(nuevaFeria.titulo).toBe("Feria Colinda (Copia)");
    expect(nuevaFeria.anio).toBe(new Date().getFullYear());
    expect(nuevaFeria.imagen_portada).toBe(f.imagen_portada);
    expect(nuevaFeria.evento_feria_fecha).toHaveLength(2);
    expect(nuevaFeria.evento_feria_empresa).toHaveLength(1);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "duplicar" } }))?.detalle).toContain('"Feria Colinda"');
  });

  it("duplicar una feria sin portada", async () => {
    const f = await (await crearFeria()).json();
    const { nuevaFeria } = await (await DUPLICAR(peticion("/x", "POST"), params(f.id))).json();
    expect(nuevaFeria.imagen_portada).toBeNull();
  });

  it("duplicar: 400 id, 404 inexistente, 500 error, '#id' si no se pudo leer el nombre", async () => {
    expect((await DUPLICAR(peticion("/x", "POST"), params("x"))).status).toBe(400);
    expect((await DUPLICAR(peticion("/x", "POST"), params(999))).status).toBe(404);
    vi.spyOn(FeriaController, "duplicarFeria").mockResolvedValueOnce({ id: 5 } as never);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    await DUPLICAR(peticion("/x", "POST"), params(77));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "duplicar" } }))?.detalle).toContain("#77");
    vi.spyOn(FeriaController, "duplicarFeria").mockRejectedValueOnce(new Error("x"));
    expect((await DUPLICAR(peticion("/x", "POST"), params(77))).status).toBe(500);
  });

  it("eliminar manda a la papelera; borrar la ORIGINAL no rompe la copia", async () => {
    const f = await (await crearFeria({ imagenes: await imagenPng() })).json();
    const { nuevaFeria } = await (await DUPLICAR(peticion("/x", "POST"), params(f.id))).json();
    expect((await DELETE(peticion("/x", "DELETE"), params(f.id))).status).toBe(200);
    expect(await prisma.evento_feria.findUnique({ where: { id: f.id } })).toBeNull();
    expect((await prisma.evento_feria.findUnique({ where: { id: nuevaFeria.id } }))?.imagen_portada).toBe(f.imagen_portada);
    expect(await prisma.papelera.count()).toBe(1);
  });

  it("eliminar: '#id' si no se pudo leer el título; 500 si falla", async () => {
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(FeriaController, "eliminarFeria").mockResolvedValueOnce(null);
    await DELETE(peticion("/x", "DELETE"), params(88));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))?.detalle).toContain("#88");
    vi.spyOn(FeriaController, "eliminarFeria").mockRejectedValueOnce(new Error("x"));
    expect((await DELETE(peticion("/x", "DELETE"), params(88))).status).toBe(500);
  });
});

describe("lecturas públicas y empresas", () => {
  it("/api/ferias: solo visibles, filtro por año y paginación", async () => {
    await crearFeria({ titulo: "2026" });
    await crearFeria({ titulo: "2025", anio: "2025" });
    await crearFeria({ titulo: "Oculta", estado: "false" });
    cerrarSesion();
    const todas = await (await publicas(peticion("/api/ferias"))).json();
    expect(todas.map((f: { titulo: string }) => f.titulo).sort()).toEqual(["2025", "2026"]);
    const de2025 = await (await publicas(peticion("/api/ferias?anio=2025"))).json();
    expect(de2025.map((f: { titulo: string }) => f.titulo)).toEqual(["2025"]);
    expect(await (await publicas(peticion("/api/ferias?anio=abc&page=2"))).json()).toEqual([]);
    vi.spyOn(FeriaController, "obtenerFeriasPublicas").mockRejectedValueOnce(new Error("x"));
    expect((await publicas(peticion("/api/ferias"))).status).toBe(500);
  });

  it("/api/administrador/empresas: con sesión, ordenadas por nombre", async () => {
    await empresa("Zeta");
    await empresa("Alfa");
    expect((await (await empresas()).json()).map((e: { nombre: string }) => e.nombre)).toEqual(["Alfa", "Zeta"]);
    vi.spyOn(EmpresaController, "obtenerEmpresasParaSelector").mockRejectedValueOnce(new Error("x"));
    expect((await empresas()).status).toBe(500);
    cerrarSesion();
    expect((await empresas()).status).toBe(401);
  });
});
