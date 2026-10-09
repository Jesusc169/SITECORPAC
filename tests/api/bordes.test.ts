/**
 * Casos de borde que faltaban: formularios incompletos, datos raros guardados
 * en la base y errores poco comunes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT as feriaPUT } from "@/app/api/administrador/ferias/[id]/route";
import { POST as feriaPOST } from "@/app/api/administrador/ferias/route";
import { POST as sorteoPOST } from "@/app/api/administrador/sorteos/route";
import { PUT as sorteoPUT } from "@/app/api/administrador/sorteos/[id]/route";
import { GET as registroGET } from "@/app/api/administrador/sistema/registro/route";
import { SistemaController } from "@/controllers/sistemaController";
import * as papeleraLib from "@/lib/papelera";
import { mensajeDeError, nombreEntidad, registrarActividad } from "@/lib/registro";
import { limpiarBD, crearAdmin, iniciarSesionComo, peticion, params, prisma } from "../helpers";

beforeEach(async () => {
  await limpiarBD();
  iniciarSesionComo(await crearAdmin());
});

describe("formularios incompletos → 400 (no 500)", () => {
  it("feria editada sin descripción", async () => {
    const f = await (await feriaPOST(peticion("/x", "POST", { form: { titulo: "F", descripcion: "d", anio: "2026" } }))).json();
    expect((await feriaPUT(peticion("/x", "PUT", { form: { titulo: "F" } }), params(f.id))).status).toBe(400);
  });

  it("sorteo editado sin nombre, descripción o fecha", async () => {
    const s = await (await sorteoPOST(peticion("/x", "POST", { json: { nombre: "S", lugar: "L" } }))).json();
    for (const falta of ["nombre", "descripcion", "fecha_hora"]) {
      const form: Record<string, string> = { nombre: "N", descripcion: "d", lugar: "L", fecha_hora: "2026-01-01T10:00:00-05:00" };
      delete form[falta];
      expect((await sorteoPUT(new NextRequest(peticion("/x", "PUT", { form })), params(s.id))).status).toBe(400);
    }
  });

  it("sorteo creado sin lugar (multipart y JSON)", async () => {
    expect((await sorteoPOST(peticion("/x", "POST", { form: { nombre: "S" } }))).status).toBe(400);
    expect((await sorteoPOST(peticion("/x", "POST", { json: { nombre: "S" } }))).status).toBe(400);
  });

  it("sorteo creado sin cabecera Content-Type se lee como JSON", async () => {
    const cuerpo = new TextEncoder().encode(JSON.stringify({ nombre: "Sin cabecera", lugar: "L" }));
    const req = new Request("http://l/x", { method: "POST", body: cuerpo });
    expect(req.headers.get("content-type")).toBeNull();
    expect((await (await sorteoPOST(req)).json()).nombre).toBe("Sin cabecera");
  });

  it("premios 'null' o sin nombre", async () => {
    const s = await (await sorteoPOST(peticion("/x", "POST", { form: { nombre: "S", lugar: "L", premios: "null" } }))).json();
    expect(s.sorteo_producto).toEqual([]);
    const s2 = await (await sorteoPOST(peticion("/x", "POST", { form: { nombre: "S", lugar: "L", premios: JSON.stringify([{ cantidad: 0 }]) } }))).json();
    expect(s2.sorteo_producto[0]).toMatchObject({ nombre: "", cantidad: 1 });
  });
});

describe("registro y resumen con datos incompletos", () => {
  it("CSV con filas sin detalle ni IP", async () => {
    await registrarActividad({ accion: "login", modulo: "sesion" });
    const txt = await (await registroGET(peticion("/x?formato=csv"))).text();
    expect(txt.split("\r\n")[1]).toMatch(/"login","sesion","info","",""$/);
  });

  it("fecha imposible en el filtro (13/45) se ignora", async () => {
    await registrarActividad({ accion: "login", modulo: "sesion" });
    expect((await (await registroGET(peticion("/x?desde=2026-13-45"))).json()).total).toBe(1);
  });

  it("intento fallido sin bloqueo", async () => {
    await prisma.login_intento.create({ data: { ip: "4.4.4.4", fallos: 1, primerFalloEn: new Date() } });
    expect((await SistemaController.seguridad()).intentos[0]).toMatchObject({ bloqueadoHasta: null, bloqueada: false });
  });

  it("nombreEntidad: tipo sin nombre o consulta que falla → null", async () => {
    expect(await nombreEntidad("sesion", 1)).toBeNull();
    expect(await nombreEntidad("noticias", Number.NaN)).toBeNull();
  });

  it("mensajeDeError: error sin mensaje y objeto circular", () => {
    expect(mensajeDeError(new TypeError(""))).toBe("TypeError");
    const circular: Record<string, unknown> = {};
    circular.yo = circular;
    expect(mensajeDeError(circular)).toBe("[object Object]");
  });
});

describe("papelera con datos incompletos", () => {
  it("restaura aunque falten listas o la portada en lo guardado", async () => {
    const p = await prisma.papelera.create({ data: { modulo: "ferias", entidadId: 4321, titulo: "F", archivos: [], expiraEn: new Date(Date.now() + 1e9),
      datos: { id: 4321, titulo: "F", descripcion: "d", anio: 2026, estado: true, created_at: null } } });
    await papeleraLib.restaurarDePapelera(p.id);
    expect(await prisma.evento_feria.findUnique({ where: { id: 4321 } })).toMatchObject({ titulo: "F", imagen_portada: null });
  });

  it("borrado definitivo: archivo que ya no está en disco; otra entrada con 'archivos' raro", async () => {
    await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 1, titulo: "Otra", datos: {}, archivos: "raro", expiraEn: new Date(Date.now() + 1e9) } });
    const p = await prisma.papelera.create({ data: { modulo: "noticias", entidadId: 2, titulo: "N", datos: {}, archivos: ["/uploads/noticias/no-existe.jpg"], expiraEn: new Date(Date.now() + 1e9) } });
    expect((await papeleraLib.eliminarDefinitivamente(p.id)).archivosBorrados).toBe(0);
  });
});

describe("premios que no son una lista", () => {
  it("por JSON con premios en texto se ignoran", async () => {
    const s = await (await sorteoPOST(peticion("/x", "POST", { json: { nombre: "S", lugar: "L", premios: "TV" } }))).json();
    expect(s.sorteo_producto).toEqual([]);
  });
});
