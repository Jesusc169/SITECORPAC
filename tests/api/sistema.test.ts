import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET as registroGET } from "@/app/api/administrador/sistema/registro/route";
import { DELETE as desbloquear } from "@/app/api/administrador/sistema/bloqueos/route";
import { GET as historialGET, POST as historialPOST } from "@/app/api/administrador/sistema/historial/[id]/route";
import { GET as papeleraGET } from "@/app/api/administrador/sistema/papelera/route";
import { POST as restaurar, DELETE as borrarDefinitivo } from "@/app/api/administrador/sistema/papelera/[id]/route";
import { SistemaController } from "@/controllers/sistemaController";
import * as estado from "@/lib/estadoServidor";
import * as historial from "@/lib/historial";
import * as papeleraLib from "@/lib/papelera";
import { registrarActividad } from "@/lib/registro";
import { RegistroModel } from "@/models/registroModel";
import { limpiarBD, crearAdmin, crearUsuario, iniciarSesionComo, peticion, params, prisma } from "../helpers";

let admin: Awaited<ReturnType<typeof crearAdmin>>;
beforeEach(async () => {
  await limpiarBD();
  admin = await crearAdmin("Jesús");
  iniciarSesionComo(admin);
});
afterEach(() => vi.restoreAllMocks());

const reg = (q = "") => registroGET(peticion(`/api/administrador/sistema/registro${q}`));

describe("permisos de la pantalla de sistema", () => {
  it("solo el rol administrador (una secretaria con 'usuarios' no)", async () => {
    iniciarSesionComo(await crearUsuario({ permisos: ["usuarios", "noticias"] }));
    for (const r of [
      await reg(),
      await desbloquear(peticion("/x", "DELETE", { json: { ip: "1.1.1.1" } })),
      await historialGET(peticion("/x"), params(1)),
      await historialPOST(peticion("/x", "POST"), params(1)),
      await papeleraGET(peticion("/x")),
      await restaurar(peticion("/x", "POST"), params(1)),
      await borrarDefinitivo(peticion("/x", "DELETE"), params(1)),
    ]) expect(r.status).toBe(401);
  });
});

describe("GET /api/administrador/sistema/registro", () => {
  beforeEach(async () => {
    await registrarActividad({ usuario: admin, accion: "crear", modulo: "noticias", entidadId: 5, detalle: "Creó la noticia \"=SUMA(1)\"" });
    await registrarActividad({ accion: "login_fallido", modulo: "sesion", nivel: "aviso", detalle: "Correo x", request: peticion("/", "GET", {}, "200.1.1.1") });
    await registrarActividad({ accion: "error", modulo: "ferias", nivel: "error", detalle: "Crear feria: disco" });
  });

  it("pagina, filtra y marca qué filas tienen historial", async () => {
    const d = await (await reg()).json();
    expect(d).toMatchObject({ pagina: 1, porPagina: 50, total: 3 });
    expect(d.filas[0].conCambios).toBe(false);
    expect((await (await reg("?nivel=error")).json()).total).toBe(1);
    expect((await (await reg("?modulo=noticias&entidad=5")).json()).total).toBe(1);
    expect((await (await reg(`?usuario=${admin.id}`)).json()).total).toBe(1);
    expect((await (await reg("?usuario=anonimo")).json()).total).toBe(2);
    expect((await (await reg("?q=200.1.1")).json()).total).toBe(1);
    expect((await (await reg("?q=Jes")).json()).total).toBe(1);
    expect((await (await reg("?desde=2000-01-01&hasta=2099-12-31")).json()).total).toBe(3);
    expect((await (await reg("?desde=2000-01-01")).json()).total).toBe(3);
    expect((await (await reg("?hasta=2000-01-01")).json()).total).toBe(0);
    expect((await (await reg("?pagina=abc")).json()).pagina).toBe(1);
    expect((await (await reg("?pagina=2")).json()).filas).toHaveLength(0);
  });

  it("400 con filtros inventados", async () => {
    expect((await reg("?modulo=hack")).status).toBe(400);
  });

  it("CSV: con BOM, encabezados y fórmulas neutralizadas", async () => {
    const res = await reg("?formato=csv");
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toMatch(/registro-sitecorpac-\d{4}-\d{2}-\d{2}\.csv/);
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM para Excel
    const txt = await res.text();
    expect(txt).toContain('"Fecha (hora Perú)","Usuario"');
    expect(txt).toContain("—"); // filas sin usuario
    expect(txt).not.toMatch(/,"=SUMA/);
  });

  it("borra lo que tiene más de 180 días al consultar; 500 si falla", async () => {
    await prisma.registro_actividad.create({ data: { accion: "login", modulo: "sesion", fecha: new Date("2020-01-01") } });
    expect((await (await reg()).json()).total).toBe(3);
    vi.spyOn(SistemaController, "listarRegistro").mockRejectedValueOnce(new Error("x"));
    expect((await reg()).status).toBe(500);
  });
});

describe("DELETE /api/administrador/sistema/bloqueos", () => {
  it("desbloquea una IP y lo registra", async () => {
    await prisma.login_intento.create({ data: { ip: "9.9.9.9", fallos: 5, primerFalloEn: new Date(), bloqueadoHasta: new Date(Date.now() + 600000) } });
    const res = await desbloquear(peticion("/x", "DELETE", { json: { ip: " 9.9.9.9 " } }));
    expect(res.status).toBe(200);
    expect(await prisma.login_intento.count()).toBe(0);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "desbloquear_ip" } }))?.detalle).toBe("Desbloqueó la IP 9.9.9.9");
  });

  it("404 si no tenía intentos, 400 si la IP es vacía o rara, 500 si falla", async () => {
    expect((await desbloquear(peticion("/x", "DELETE", { json: { ip: "1.2.3.4" } }))).status).toBe(404);
    expect((await desbloquear(peticion("/x", "DELETE", { json: { ip: 123 } }))).status).toBe(400);
    expect((await desbloquear(peticion("/x", "DELETE", { json: { ip: "x".repeat(65) } }))).status).toBe(400);
    expect((await desbloquear(new Request("http://l/x", { method: "DELETE", body: "no-json" }))).status).toBe(400);
    vi.spyOn(SistemaController, "desbloquearIp").mockRejectedValueOnce(new Error("x"));
    expect((await desbloquear(peticion("/x", "DELETE", { json: { ip: "1.1.1.1" } }))).status).toBe(500);
  });
});

/* ---------- historial: se generan ediciones reales de cada tipo ---------- */
async function editarConHistorial(modulo: "noticias" | "ferias" | "sorteos" | "directorio", id: number, cambiar: () => Promise<unknown>) {
  const antes = await historial.instantanea(modulo, id);
  await cambiar();
  const despues = await historial.instantanea(modulo, id);
  await registrarActividad({ usuario: admin, accion: "editar", modulo, entidadId: id, detalle: "editó", antes, despues });
  return (await prisma.registro_actividad.findFirst({ where: { modulo, accion: "editar" }, orderBy: { id: "desc" } }))!;
}

describe("historial de cambios: ver y restaurar", () => {
  it("noticia: muestra los cambios y restaura textos y visibilidad", async () => {
    const n = await prisma.noticia.create({ data: { titulo: "Original", descripcion: "d", contenido: null, autor: "A", updatedAt: new Date(), noticia_imagen: { create: [{ url: "/uploads/noticias/a.jpg", orden: 1 }] }, noticia_pdf: { create: [{ url: "/uploads/noticias/pdf/a.pdf", nombre: "a.pdf" }] } } });
    const fila = await editarConHistorial("noticias", n.id, () => prisma.noticia.update({ where: { id: n.id }, data: { titulo: "Cambiada", contenido: "nuevo", activo: false } }));
    const d = await (await historialGET(peticion("/x"), params(fila.id))).json();
    // MySQL reordena las claves de los JSON: se compara sin importar el orden
    expect(d.cambios.map((c: { campo: string }) => c.campo).sort()).toEqual(["activo", "contenido", "titulo"]);
    expect(d).toMatchObject({ existe: true, puedeRestaurar: true, usuario: "Jesús" });
    expect((await historialPOST(peticion("/x", "POST"), params(fila.id))).status).toBe(200);
    expect(await prisma.noticia.findUnique({ where: { id: n.id } })).toMatchObject({ titulo: "Original", contenido: null, activo: true });
    const r = await prisma.registro_actividad.findFirst({ where: { nivel: "aviso", accion: "editar" } });
    expect(r?.detalle).toMatch(/Restauró la versión anterior de "Cambiada" \(deshizo el cambio del .+ hecho por Jesús\)/);
  });

  it("feria: restaura título, descripción, año y visibilidad (no las fechas)", async () => {
    const e = await prisma.empresa.create({ data: { nombre: "Kola", logo_url: "/x.png" } });
    const f = await prisma.evento_feria.create({ data: { titulo: "Feria", descripcion: "d", anio: 2026, evento_feria_fecha: { create: [{ fecha: new Date("2026-03-30"), hora_inicio: "9", hora_fin: "5", ubicacion: "Sede", zona: "Z" }, { fecha: new Date("2026-03-31"), hora_inicio: "9", hora_fin: "5", ubicacion: "Sede" }] }, evento_feria_empresa: { create: [{ empresa_id: e.id }] } } });
    const fila = await editarConHistorial("ferias", f.id, () => prisma.evento_feria.update({ where: { id: f.id }, data: { titulo: "Otra", anio: 2027, estado: false } }));
    await historialPOST(peticion("/x", "POST"), params(fila.id));
    expect(await prisma.evento_feria.findUnique({ where: { id: f.id } })).toMatchObject({ titulo: "Feria", anio: 2026, estado: true });
    expect(fila.antes).toMatchObject({ fechas: ["2026-03-30 9–5 · Sede (Z)", "2026-03-31 9–5 · Sede"], empresas: ["Kola"] });
  });

  it("feria con estado nulo cuenta como visible", async () => {
    const f = await prisma.evento_feria.create({ data: { titulo: "F", descripcion: "d", anio: 2026, estado: null } });
    expect((await historial.instantanea("ferias", f.id))?.estado).toBe(true);
  });

  it("sorteo: restaura la fecha y el estado", async () => {
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date("2026-12-20T00:00:00Z"), anio: 2026, sorteo_producto: { create: [{ nombre: "TV", cantidad: 2 }, { nombre: "Radio", cantidad: 1 }] } } });
    const fila = await editarConHistorial("sorteos", s.id, () => prisma.sorteo.update({ where: { id: s.id }, data: { nombre: "S2", estado: "INACTIVO", fecha_hora: new Date("2027-01-01T00:00:00Z") } }));
    expect(fila.antes).toMatchObject({ premios: ["TV ×2", "Radio"], estado: "ACTIVO" });
    await historialPOST(peticion("/x", "POST"), params(fila.id));
    const d = await prisma.sorteo.findUnique({ where: { id: s.id } });
    expect(d).toMatchObject({ nombre: "S", estado: "ACTIVO" });
    expect(d?.fecha_hora.toISOString()).toBe("2026-12-20T00:00:00.000Z");
  });

  it("sorteo con estado nulo e instantánea con fecha inválida", async () => {
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026, estado: null } });
    expect((await historial.instantanea("sorteos", s.id))?.estado).toBe("ACTIVO");
    await historial.restaurarCampos("sorteos", s.id, { nombre: "X", descripcion: "d", lugar: "L", anio: 2026, estado: "INACTIVO", fecha_hora: "no-fecha" });
    expect((await prisma.sorteo.findUnique({ where: { id: s.id } }))?.estado).toBe("INACTIVO");
  });

  it("directorio: restaura datos y periodo (fin vacío)", async () => {
    const m = await prisma.directorio.create({ data: { nombre: "Ana", cargo: "C", correo: "a@b.c", telefono: "1", periodoInicio: new Date("2025-01-01"), orden: 1 } });
    const fila = await editarConHistorial("directorio", m.id, () => prisma.directorio.update({ where: { id: m.id }, data: { cargo: "Presidenta", periodoFin: new Date("2027-01-01") } }));
    await historialPOST(peticion("/x", "POST"), params(fila.id));
    expect(await prisma.directorio.findUnique({ where: { id: m.id } })).toMatchObject({ cargo: "C", periodoFin: null });
    await historial.restaurarCampos("directorio", m.id, { nombre: "A", cargo: "C", correo: "c", telefono: "t", periodoInicio: null, periodoFin: "2030-01-01T00:00:00Z" });
    expect((await prisma.directorio.findUnique({ where: { id: m.id } }))?.periodoFin?.getUTCFullYear()).toBe(2030);
  });

  it("textos raros en una instantánea se guardan como texto", async () => {
    const n = await prisma.noticia.create({ data: { titulo: "T", descripcion: "d", autor: "A", updatedAt: new Date() } });
    await historial.restaurarCampos("noticias", n.id, { titulo: 123 as never, descripcion: null, contenido: 5 as never, autor: "A", activo: false });
    expect(await prisma.noticia.findUnique({ where: { id: n.id } })).toMatchObject({ titulo: "123", descripcion: "", contenido: "5", activo: false });
  });

  it("GET: 404 si el movimiento no tiene historial o el id es inválido", async () => {
    const r = await prisma.registro_actividad.create({ data: { accion: "login", modulo: "sesion" } });
    expect((await historialGET(peticion("/x"), params(r.id))).status).toBe(404);
    expect((await historialGET(peticion("/x"), params("abc"))).status).toBe(404);
    expect((await historialGET(peticion("/x"), params(-1))).status).toBe(404);
  });

  it("GET de un elemento ya borrado: existe=false; sin 'después' no hay diferencias", async () => {
    const r = await prisma.registro_actividad.create({ data: { accion: "editar", modulo: "noticias", entidadId: 99999, antes: { titulo: "x" } } });
    const d = await (await historialGET(peticion("/x"), params(r.id))).json();
    expect(d).toMatchObject({ existe: false, puedeRestaurar: false, cambios: [] });
    const r2 = await prisma.registro_actividad.create({ data: { accion: "editar", modulo: "usuarios", antes: { a: 1 }, despues: { a: 2 } } });
    const d2 = await (await historialGET(peticion("/x"), params(r2.id))).json();
    expect(d2.existe).toBe(false);
    expect(d2.cambios[0].restaurable).toBe(false);
  });

  it("POST: 404 sin historial, 404 si el elemento ya no existe, 500 si falla", async () => {
    const sin = await prisma.registro_actividad.create({ data: { accion: "login", modulo: "sesion" } });
    expect((await historialPOST(peticion("/x", "POST"), params(sin.id))).status).toBe(404);
    const borrado = await prisma.registro_actividad.create({ data: { accion: "editar", modulo: "noticias", entidadId: 99999, antes: { titulo: "x" } } });
    const res = await historialPOST(peticion("/x", "POST"), params(borrado.id));
    expect((await res.json()).error).toMatch(/Papelera/);
    const n = await prisma.noticia.create({ data: { titulo: "T", descripcion: "d", autor: "A", updatedAt: new Date() } });
    const ok = await prisma.registro_actividad.create({ data: { accion: "editar", modulo: "noticias", entidadId: n.id, antes: { titulo: "Vieja", descripcion: "d", autor: "A", activo: true } } });
    vi.spyOn(historial, "restaurarCampos").mockRejectedValueOnce(new Error("x"));
    expect((await historialPOST(peticion("/x", "POST"), params(ok.id))).status).toBe(500);
    vi.spyOn(historial, "diferencias").mockImplementationOnce(() => { throw new Error("x"); });
    expect((await historialGET(peticion("/x"), params(ok.id))).status).toBe(500);
  });

  it("restaurar un cambio de alguien sin usuario y de un elemento sin título usa el nombre o el número", async () => {
    const m = await prisma.directorio.create({ data: { nombre: "Ana", cargo: "C", correo: "a", telefono: "1", periodoInicio: new Date(), orden: 1 } });
    const r = await prisma.registro_actividad.create({ data: { accion: "editar", modulo: "directorio", entidadId: m.id, antes: { nombre: "Ana", cargo: "Vieja", correo: "a", telefono: "1", periodoInicio: null, periodoFin: null } } });
    await historialPOST(peticion("/x", "POST"), params(r.id));
    const ult = await prisma.registro_actividad.findFirst({ where: { nivel: "aviso" }, orderBy: { id: "desc" } });
    expect(ult?.detalle).toMatch(/de "Ana" \(deshizo el cambio del [^)]+\)$/);
    vi.spyOn(historial, "instantanea").mockResolvedValueOnce({}).mockResolvedValueOnce({});
    await historialPOST(peticion("/x", "POST"), params(r.id));
    expect((await prisma.registro_actividad.findFirst({ where: { nivel: "aviso" }, orderBy: { id: "desc" } }))?.detalle).toContain(`#${m.id}`);
  });

  it("instantánea: tipo sin historial, inexistente o error de base → null", async () => {
    expect(await historial.instantanea("usuarios", 1)).toBeNull();
    for (const m of ["noticias", "ferias", "sorteos", "directorio"] as const) expect(await historial.instantanea(m, 99999)).toBeNull();
    // un id inválido hace fallar la consulta: debe devolver null, no romper
    expect(await historial.instantanea("noticias", Number.NaN)).toBeNull();
  });
});

describe("papelera: listar, restaurar y borrar definitivamente", () => {
  it("noticia con fotos y PDFs vuelve con su mismo id; el borrado definitivo respeta archivos compartidos", async () => {
    const n = await prisma.noticia.create({ data: { titulo: "N", descripcion: "d", autor: "A", imagen: "/uploads/noticias/a.jpg", updatedAt: new Date(), noticia_imagen: { create: [{ url: "/uploads/noticias/a.jpg", orden: 1, principal: true }] }, noticia_pdf: { create: [{ url: "/uploads/noticias/pdf/a.pdf", nombre: "a.pdf", orden: null }] } } });
    await papeleraLib.moverAPapelera("noticias", n.id, admin);
    const [item] = await (await papeleraGET(peticion("/x"))).json();
    expect(item).toMatchObject({ modulo: "noticias", entidadId: n.id, titulo: "N", archivos: 2, eliminadoPor: "Jesús" });
    expect((await restaurar(peticion("/x", "POST"), params(item.id))).status).toBe(200);
    const d = await prisma.noticia.findUnique({ where: { id: n.id }, include: { noticia_imagen: true, noticia_pdf: true } });
    expect(d?.noticia_imagen[0]).toMatchObject({ url: "/uploads/noticias/a.jpg", principal: true });
    expect(d?.noticia_pdf[0].orden).toBe(1);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toBe('Restauró desde la papelera la noticia "N"');
  });

  it("feria con fechas y empresas (una empresa borrada mientras tanto se omite)", async () => {
    const e1 = await prisma.empresa.create({ data: { nombre: "A", logo_url: "/a.png" } });
    const e2 = await prisma.empresa.create({ data: { nombre: "B", logo_url: "/b.png" } });
    const f = await prisma.evento_feria.create({ data: { titulo: "F", descripcion: "d", anio: 2026, imagen_portada: "/uploads/ferias/p.jpg", created_at: null, evento_feria_imagen: { create: [{ url: "/uploads/ferias/p.jpg", orden: 1 }] }, evento_feria_fecha: { create: [{ fecha: new Date("2026-03-30"), hora_inicio: "9", hora_fin: "5", ubicacion: "S" }] }, evento_feria_empresa: { create: [{ empresa_id: e1.id }, { empresa_id: e2.id }] } } });
    await papeleraLib.moverAPapelera("ferias", f.id, null);
    await prisma.empresa.delete({ where: { id: e2.id } });
    const item = await prisma.papelera.findFirst();
    expect(item?.eliminadoPor).toBeNull();
    await restaurar(peticion("/x", "POST"), params(item!.id));
    const d = await prisma.evento_feria.findUnique({ where: { id: f.id }, include: { evento_feria_empresa: true, evento_feria_fecha: true } });
    expect(d?.evento_feria_empresa.map((x) => x.empresa_id)).toEqual([e1.id]);
    expect(d?.evento_feria_fecha).toHaveLength(1);
  });

  it("sorteo con premios y directorio", async () => {
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026, estado: "INACTIVO", creado_en: null, sorteo_imagen: { create: [{ url: "/uploads/sorteos/s.jpg", orden: 1 }] }, sorteo_producto: { create: [{ nombre: "TV", descripcion: null, cantidad: null }] } } });
    const m = await prisma.directorio.create({ data: { nombre: "Ana", cargo: "C", correo: "a", telefono: "1", fotoUrl: null, periodoInicio: new Date(), periodoFin: new Date(), orden: 2 } });
    await papeleraLib.moverAPapelera("sorteos", s.id, admin);
    await papeleraLib.moverAPapelera("directorio", m.id, admin);
    for (const it of await prisma.papelera.findMany()) await restaurar(peticion("/x", "POST"), params(it.id));
    const ds = await prisma.sorteo.findUnique({ where: { id: s.id }, include: { sorteo_producto: true } });
    expect(ds).toMatchObject({ estado: "INACTIVO" });
    expect(ds?.sorteo_producto[0]).toMatchObject({ descripcion: null, cantidad: 1 });
    expect((await prisma.directorio.findUnique({ where: { id: m.id } }))?.periodoFin).not.toBeNull();
    expect((await prisma.registro_actividad.findFirst({ where: { modulo: "directorio", accion: "crear" } }))?.detalle).toBe("Restauró desde la papelera a Ana (C) en el directorio");
  });

  it("sorteo ACTIVO, noticia sin imagen/contenido, directorio sin fin de periodo", async () => {
    const s = await prisma.sorteo.create({ data: { nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026 } });
    const n = await prisma.noticia.create({ data: { titulo: "N", descripcion: "d", autor: "A", updatedAt: new Date(), activo: false } });
    const m = await prisma.directorio.create({ data: { nombre: "B", cargo: "C", correo: "a", telefono: "1", periodoInicio: new Date(), orden: 1 } });
    await papeleraLib.moverAPapelera("sorteos", s.id);
    await papeleraLib.moverAPapelera("noticias", n.id);
    await papeleraLib.moverAPapelera("directorio", m.id);
    for (const it of await prisma.papelera.findMany()) await restaurar(peticion("/x", "POST"), params(it.id));
    expect((await prisma.sorteo.findUnique({ where: { id: s.id } }))?.estado).toBe("ACTIVO");
    expect((await prisma.noticia.findUnique({ where: { id: n.id } }))).toMatchObject({ imagen: null, contenido: null, activo: false });
    expect((await prisma.directorio.findUnique({ where: { id: m.id } }))?.periodoFin).toBeNull();
  });

  it("no restaura encima de un elemento con el mismo número (409)", async () => {
    const n = await prisma.noticia.create({ data: { titulo: "N", descripcion: "d", autor: "A", updatedAt: new Date() } });
    await papeleraLib.moverAPapelera("noticias", n.id);
    const it = (await prisma.papelera.findFirst())!;
    await prisma.noticia.create({ data: { id: n.id, titulo: "Otra", descripcion: "d", autor: "A", updatedAt: new Date() } });
    const res = await restaurar(peticion("/x", "POST"), params(it.id));
    expect(res.status).toBe(409);
    for (const [m, crear] of [
      ["ferias", () => prisma.evento_feria.create({ data: { id: 777, titulo: "F", descripcion: "d", anio: 2026 } })],
      ["sorteos", () => prisma.sorteo.create({ data: { id: 777, nombre: "S", descripcion: "d", lugar: "L", fecha_hora: new Date(), anio: 2026 } })],
      ["directorio", () => prisma.directorio.create({ data: { id: 777, nombre: "D", cargo: "C", correo: "c", telefono: "t", periodoInicio: new Date(), orden: 1 } })],
    ] as const) {
      await crear();
      const p = await prisma.papelera.create({ data: { modulo: m, entidadId: 777, titulo: "x", datos: {}, archivos: [], expiraEn: new Date(Date.now() + 1e9) } });
      expect((await restaurar(peticion("/x", "POST"), params(p.id))).status).toBe(409);
    }
  });

  it("errores de la papelera: inexistente, tipo desconocido, id inválido, 500", async () => {
    expect((await restaurar(peticion("/x", "POST"), params(999))).status).toBe(409);
    expect((await restaurar(peticion("/x", "POST"), params("x"))).status).toBe(400);
    expect((await borrarDefinitivo(peticion("/x", "DELETE"), params(999))).status).toBe(404);
    expect((await borrarDefinitivo(peticion("/x", "DELETE"), params(0))).status).toBe(400);
    const rara = await prisma.papelera.create({ data: { modulo: "usuarios", entidadId: 1, titulo: "x", datos: {}, archivos: "no-lista", expiraEn: new Date(Date.now() + 1e9) } });
    expect((await (await restaurar(peticion("/x", "POST"), params(rara.id))).json()).error).toMatch(/desconocido/);
    vi.spyOn(papeleraLib, "restaurarDePapelera").mockRejectedValueOnce(new Error("x"));
    expect((await restaurar(peticion("/x", "POST"), params(1))).status).toBe(500);
    vi.spyOn(papeleraLib, "eliminarDefinitivamente").mockRejectedValueOnce(new Error("x"));
    expect((await borrarDefinitivo(peticion("/x", "DELETE"), params(1))).status).toBe(500);
    vi.spyOn(papeleraLib, "listarPapelera").mockRejectedValueOnce(new Error("x"));
    expect((await papeleraGET(peticion("/x"))).status).toBe(500);
  });

  it("borrado definitivo: registra cuántos archivos borró; entradas con 'archivos' raros", async () => {
    const p = await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 1, titulo: "Vieja", datos: {}, archivos: "no-lista", expiraEn: new Date(Date.now() + 1e9) } });
    const res = await borrarDefinitivo(peticion("/x", "DELETE"), params(p.id));
    expect(await res.json()).toEqual({ ok: true, archivosBorrados: 0 });
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))?.detalle).toBe('Borró definitivamente de la papelera "Vieja" (0 archivo(s) eliminados del servidor)');
    expect(await papeleraLib.listarPapelera()).toEqual([]);
    await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 2, titulo: "x", datos: {}, archivos: "raro", expiraEn: new Date(Date.now() + 1e9) } });
    expect((await papeleraLib.listarPapelera())[0].archivos).toBe(0);
  });

  it("al listar se vacía lo vencido; si falla una, sigue con las demás", async () => {
    await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 1, titulo: "Vencida", datos: {}, archivos: ["/uploads/../../x", "/logo.jpg"], expiraEn: new Date("2020-01-01") } });
    expect(await (await papeleraGET(peticion("/x"))).json()).toEqual([]);
    await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 1, titulo: "V2", datos: {}, archivos: [], expiraEn: new Date("2020-01-01") } });
    await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 2, titulo: "V3", datos: {}, archivos: [], expiraEn: new Date("2020-01-01") } });
    const vistos: number[] = [];
    const borrar = async (id: number) => {
      vistos.push(id);
      if (vistos.length === 1) throw new Error("falla la primera");
    };
    expect(await papeleraLib.depurarPapelera(borrar)).toBe(2);
    expect(vistos).toHaveLength(2);
  });

  it("mover a la papelera algo que no existe → null", async () => {
    for (const m of ["noticias", "ferias", "sorteos", "directorio"] as const) expect(await papeleraLib.moverAPapelera(m, 99999)).toBeNull();
  });
});

describe("resumen, seguridad y usuarios del panel de sistema", () => {
  it("estado: junta todo y calcula alertas (sin salir a internet)", async () => {
    vi.spyOn(estado, "estadoCertificado").mockResolvedValue({ dominio: "sitecorpac.com", venceEl: null, diasRestantes: 5, emisor: null, error: null });
    vi.spyOn(estado, "estadoAlertas").mockResolvedValue({ instaladas: true, ultimaRevision: new Date().toISOString(), destinatario: "x", resumenDiario: true, ultimoCorreo: null });
    vi.spyOn(estado, "estadoRespaldos").mockResolvedValue({ disponible: true, carpeta: "/x", cantidad: 1, bytesTotal: 1, ultimo: { nombre: "a", fecha: new Date().toISOString(), bytes: 1 } });
    await prisma.login_intento.create({ data: { ip: "1.1.1.1", fallos: 5, primerFalloEn: new Date(), bloqueadoHasta: new Date(Date.now() + 600000) } });
    await prisma.login_intento.create({ data: { ip: "2.2.2.2", fallos: 1, primerFalloEn: new Date() } });
    await registrarActividad({ accion: "error", modulo: "sistema", nivel: "error", detalle: "x" });
    const e = await SistemaController.estado();
    expect(e.alertas.map((a) => a.texto).join(" | ")).toMatch(/certificado.*5 días.*error\(es\).*1 IP/);
    expect(e.baseDatos.totales.usuarios).toBe(1);
    expect(e.papelera.dias).toBe(30);
    expect(e.ultimosErrores[0].fecha).toMatch(/Z$/);
  });

  it("estado: si no se puede medir la base, el tamaño queda null", async () => {
    vi.spyOn(estado, "estadoCertificado").mockResolvedValue({ dominio: "x", venceEl: null, diasRestantes: 80, emisor: null, error: null });
    vi.spyOn(RegistroModel, "tamanoBaseDatos").mockRejectedValueOnce(new Error("sin permiso"));
    vi.spyOn(papeleraLib, "depurarPapelera").mockRejectedValueOnce(new Error("x"));
    expect((await SistemaController.estado()).baseDatos.bytes).toBeNull();
  });

  it("seguridad: intentos e IPs bloqueadas", async () => {
    await prisma.login_intento.create({ data: { ip: "1.1.1.1", fallos: 5, primerFalloEn: new Date(), bloqueadoHasta: new Date(Date.now() + 600000) } });
    await prisma.login_intento.create({ data: { ip: "3.3.3.3", fallos: 5, primerFalloEn: new Date(), bloqueadoHasta: new Date(Date.now() - 1000) } });
    await registrarActividad({ accion: "login_fallido", modulo: "sesion" });
    const s = await SistemaController.seguridad();
    expect(s.fallidos24h).toBe(1);
    expect(s.intentos.find((i) => i.ip === "1.1.1.1")?.bloqueada).toBe(true);
    expect(s.intentos.find((i) => i.ip === "3.3.3.3")?.bloqueada).toBe(false);
  });

  it("usuarios: último inicio de sesión y cambios de los últimos 30 días", async () => {
    const s = await crearUsuario({ nombre: "Katty", permisos: ["noticias"] });
    await prisma.user.update({ where: { id: s.id }, data: { permisos: "no-es-lista" } });
    await registrarActividad({ usuario: admin, accion: "login", modulo: "sesion" });
    await registrarActividad({ usuario: admin, accion: "editar", modulo: "noticias" });
    const lista = await SistemaController.usuarios();
    expect(lista.find((u) => u.id === admin.id)).toMatchObject({ cambios30d: 1 });
    expect(lista.find((u) => u.id === admin.id)?.ultimoLogin).not.toBeNull();
    expect(lista.find((u) => u.id === s.id)).toMatchObject({ ultimoLogin: null, ultimaActividad: null, cambios30d: 0, permisos: [] });
  });
});
