import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GET, POST } from "@/app/api/administrador/usuarios/route";
import { PUT, DELETE, PATCH } from "@/app/api/administrador/usuarios/[id]/route";
import { UsuarioController } from "@/controllers/usuarioController";
import * as registro from "@/lib/registro";
import { GET as me } from "@/app/api/administrador/me/route";
import {
  limpiarBD, crearUsuario, crearAdmin, iniciarSesionComo, cerrarSesion, peticion, params, prisma,
} from "../helpers";
import { cookiesDePrueba } from "../setup";

beforeEach(limpiarBD);
afterEach(() => vi.restoreAllMocks());

const secretariaConUsuarios = () => crearUsuario({ nombre: "Sec", permisos: ["usuarios"] });

describe("GET/POST /api/administrador/usuarios", () => {
  it("401 sin sesión o sin el permiso 'usuarios'", async () => {
    expect((await GET()).status).toBe(401);
    expect((await POST(peticion("/x", "POST", { json: {} }))).status).toBe(401);
    iniciarSesionComo(await crearUsuario({ permisos: ["noticias"] }));
    expect((await GET()).status).toBe(401);
  });

  it("lista sin contraseñas", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const lista = await (await GET()).json();
    expect(lista).toHaveLength(1);
    expect(lista[0].password).toBeUndefined();
    expect(lista[0].activo).toBe(true);
  });

  it("crea una cuenta y lo registra", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const res = await POST(peticion("/x", "POST", { json: { nombre: "Nueva", email: "NUEVA@test.local", password: "12345678", rol: "secretaria", permisos: ["noticias"] } }));
    expect(res.status).toBe(201);
    expect((await prisma.user.findUnique({ where: { email: "nueva@test.local" } }))?.rol).toBe("secretaria");
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "crear" } });
    expect(r?.detalle).toContain("Nueva <NUEVA@test.local> con rol secretaria");
  });

  it("si no mandan rol, el registro dice secretaria", async () => {
    iniciarSesionComo(await crearAdmin());
    await POST(peticion("/x", "POST", { json: { nombre: "Sin", email: "sin@test.local", password: "12345678" } }));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toContain("rol secretaria");
  });

  it("cuerpo vacío → 400 (antes daba 500)", async () => {
    iniciarSesionComo(await crearAdmin());
    expect((await POST(peticion("/x", "POST", { json: null }))).status).toBe(400);
    const a = await crearAdmin("Otro");
    expect((await PUT(peticion("/x", "PUT", { json: null }), params(a.id))).status).toBe(400);
  });

  it("400 con datos inválidos (contraseña corta)", async () => {
    iniciarSesionComo(await crearAdmin());
    const res = await POST(peticion("/x", "POST", { json: { nombre: "A", email: "a@test.local", password: "corta" } }));
    expect(res.status).toBe(400);
  });

  it("500 si falla la base de datos", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(UsuarioController, "obtenerUsuarios").mockRejectedValueOnce(new Error("bd caída"));
    expect((await GET()).status).toBe(500);
    expect((await prisma.registro_actividad.findFirst({ where: { nivel: "error" } }))?.detalle).toContain("bd caída");
  });

  it("registro con valores por defecto si el cuerpo no trae nombre/correo", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(UsuarioController, "crearUsuario").mockResolvedValueOnce({ id: 99 } as never);
    await POST(peticion("/x", "POST", { json: {} }));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "crear" } }))?.detalle).toContain(" <> con rol secretaria");
  });
});

describe("PUT /api/administrador/usuarios/[id]", () => {
  it("401 sin permiso, 400 con id inválido", async () => {
    expect((await PUT(peticion("/x", "PUT", { json: {} }), params(1))).status).toBe(401);
    iniciarSesionComo(await crearAdmin());
    expect((await PUT(peticion("/x", "PUT", { json: {} }), params("abc"))).status).toBe(400);
  });

  it("edita rol y permisos y lo detalla en el registro", async () => {
    const a = await crearAdmin();
    const s = await crearUsuario({ nombre: "Katty" });
    iniciarSesionComo(a);
    const res = await PUT(peticion("/x", "PUT", { json: { nombre: "Katty", rol: "secretaria", permisos: [] } }), params(s.id));
    expect(res.status).toBe(200);
    expect((await res.json()).sesionVersion).toBeUndefined();
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.detalle).toContain("rol secretaria; permisos: ninguno");
  });

  it("solo nombre: el registro no lista cambios", async () => {
    const a = await crearAdmin();
    const s = await crearUsuario({ nombre: "Katty" });
    iniciarSesionComo(a);
    await PUT(peticion("/x", "PUT", { json: { nombre: "Katty M" } }), params(s.id));
    const r = await prisma.registro_actividad.findFirst({ where: { accion: "editar" } });
    expect(r?.detalle).toMatch(/Editó la cuenta de Katty M <.+>$/);
  });

  it("cambiar la contraseña de OTRO cierra sus sesiones; la del admin sigue", async () => {
    const a = await crearAdmin();
    const s = await crearUsuario({ permisos: ["noticias"] });
    iniciarSesionComo(a);
    const res = await PUT(peticion("/x", "PUT", { json: { nombre: s.nombre, permisos: ["noticias"], password: "otra-clave-123" } }), params(s.id));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect((await prisma.user.findUnique({ where: { id: s.id } }))?.sesionVersion).toBe(1);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).toContain("cambió la contraseña");
  });

  it("cambiar la PROPIA contraseña firma una cookie nueva válida", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const res = await PUT(peticion("/x", "PUT", { json: { nombre: a.nombre, rol: "administrador", password: "otra-clave-123" } }), params(a.id));
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/token=/);
    cookiesDePrueba.set("token", cookie.split(";")[0].split("=")[1]);
    expect((await me()).status).toBe(200);
  });

  it("una secretaria con 'usuarios' NO puede tocar al administrador", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(await secretariaConUsuarios());
    const res = await PUT(peticion("/x", "PUT", { json: { nombre: "X", password: "hackeado-123" } }), params(a.id));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Solo un administrador/);
  });

  it("500 si falla al guardar", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    vi.spyOn(UsuarioController, "actualizarUsuario").mockRejectedValueOnce(new Error("x"));
    expect((await PUT(peticion("/x", "PUT", { json: { nombre: "a" } }), params(a.id))).status).toBe(500);
  });

  it("si la cuenta ya no tiene nombre legible, usa el número", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    vi.spyOn(UsuarioController, "actualizarUsuario").mockResolvedValueOnce({ sesionVersion: 0 } as never);
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    await PUT(peticion("/x", "PUT", { json: { nombre: "a" } }), params(777));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).toContain("#777");
  });
});

describe("DELETE /api/administrador/usuarios/[id]", () => {
  it("401 / 400 / no puede borrarse a sí mismo", async () => {
    expect((await DELETE(peticion("/x", "DELETE"), params(1))).status).toBe(401);
    const a = await crearAdmin();
    iniciarSesionComo(a);
    expect((await DELETE(peticion("/x", "DELETE"), params("0"))).status).toBe(400);
    expect((await DELETE(peticion("/x", "DELETE"), params(a.id))).status).toBe(400);
  });

  it("elimina a otro usuario y lo registra como aviso", async () => {
    iniciarSesionComo(await crearAdmin());
    const s = await crearUsuario({ nombre: "Astrid" });
    expect((await DELETE(peticion("/x", "DELETE"), params(s.id))).status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: s.id } })).toBeNull();
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))).toMatchObject({ nivel: "aviso" });
  });

  it("si no existe → 400 'Usuario no encontrado'", async () => {
    iniciarSesionComo(await crearAdmin());
    const res = await DELETE(peticion("/x", "DELETE"), params(9999));
    expect((await res.json()).error).toBe("Usuario no encontrado");
  });

  it("registro con el número si no se pudo leer el nombre", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(UsuarioController, "eliminarUsuario").mockResolvedValueOnce({} as never);
    await DELETE(peticion("/x", "DELETE"), params(555));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "eliminar" } }))?.detalle).toContain("#555");
  });

  it("500 si falla", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(UsuarioController, "eliminarUsuario").mockRejectedValueOnce(new Error("x"));
    expect((await DELETE(peticion("/x", "DELETE"), params(5))).status).toBe(500);
  });
});

describe("PATCH /api/administrador/usuarios/[id] (desactivar, activar, cerrar sesiones)", () => {
  it("401 / 400 id / 400 acción desconocida", async () => {
    expect((await PATCH(peticion("/x", "PATCH", { json: {} }), params(1))).status).toBe(401);
    iniciarSesionComo(await crearAdmin());
    expect((await PATCH(peticion("/x", "PATCH", { json: {} }), params("x"))).status).toBe(400);
    const s = await crearUsuario();
    expect((await PATCH(peticion("/x", "PATCH", { json: { accion: "volar" } }), params(s.id))).status).toBe(400);
  });

  it("cuerpo no JSON → acción no válida", async () => {
    iniciarSesionComo(await crearAdmin());
    const s = await crearUsuario();
    const req = new Request("http://localhost/x", { method: "PATCH", body: "xx" });
    expect((await PATCH(req, params(s.id))).status).toBe(400);
  });

  it("desactivar corta sus sesiones y reactivar la deja entrar", async () => {
    const a = await crearAdmin();
    const s = await crearUsuario({ nombre: "Katty" });
    iniciarSesionComo(a);
    expect((await PATCH(peticion("/x", "PATCH", { json: { accion: "desactivar" } }), params(s.id))).status).toBe(200);
    const d = await prisma.user.findUnique({ where: { id: s.id } });
    expect(d).toMatchObject({ activo: false, sesionVersion: 1 });
    iniciarSesionComo(s);
    expect((await me()).status).toBe(401);
    iniciarSesionComo(a);
    await PATCH(peticion("/x", "PATCH", { json: { accion: "activar" } }), params(s.id));
    expect((await prisma.user.findUnique({ where: { id: s.id } }))?.activo).toBe(true);
    const detalles = (await prisma.registro_actividad.findMany({ where: { accion: "editar" } })).map((r) => r.detalle);
    expect(detalles.join("|")).toMatch(/Desactivó la cuenta de Katty.*\|Reactivó la cuenta de Katty/);
  });

  it("no puede desactivarse a sí mismo", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    expect((await PATCH(peticion("/x", "PATCH", { json: { accion: "desactivar" } }), params(a.id))).status).toBe(400);
  });

  it("cerrar sesiones de otro: su token viejo deja de valer", async () => {
    const a = await crearAdmin();
    const s = await crearUsuario();
    iniciarSesionComo(a);
    const res = await PATCH(peticion("/x", "PATCH", { json: { accion: "cerrar_sesiones" } }), params(s.id));
    expect(res.headers.get("set-cookie")).toBeNull();
    iniciarSesionComo(s);
    expect((await me()).status).toBe(401);
  });

  it("cerrar MIS sesiones: me deja una cookie nueva que sigue valiendo", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const res = await PATCH(peticion("/x", "PATCH", { json: { accion: "cerrar_sesiones" } }), params(a.id));
    const nueva = (res.headers.get("set-cookie") ?? "").split(";")[0].split("=")[1];
    expect(nueva).toBeTruthy();
    expect((await me()).status).toBe(401); // la cookie vieja ya no vale
    cookiesDePrueba.set("token", nueva);
    expect((await me()).status).toBe(200);
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).toContain("Cerró sus sesiones abiertas");
  });

  it("secretaria no puede cerrar sesiones de un administrador", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(await secretariaConUsuarios());
    expect((await PATCH(peticion("/x", "PATCH", { json: { accion: "cerrar_sesiones" } }), params(a.id))).status).toBe(400);
  });

  it("nombre de respaldo '#id' y error 500", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(registro, "nombreEntidad").mockResolvedValueOnce(null);
    vi.spyOn(UsuarioController, "cambiarActivo").mockResolvedValueOnce({} as never);
    await PATCH(peticion("/x", "PATCH", { json: { accion: "activar" } }), params(321));
    expect((await prisma.registro_actividad.findFirst({ where: { accion: "editar" } }))?.detalle).toContain("#321");
    vi.spyOn(UsuarioController, "cambiarActivo").mockRejectedValueOnce(new Error("x"));
    expect((await PATCH(peticion("/x", "PATCH", { json: { accion: "activar" } }), params(321))).status).toBe(500);
  });

  it("sin sesión la cookie no existe", async () => {
    cerrarSesion();
    expect((await me()).status).toBe(401);
  });
});

describe("casos de borde de usuarios", () => {
  it("POST 500 si falla algo que no es validación", async () => {
    iniciarSesionComo(await crearAdmin());
    vi.spyOn(UsuarioController, "crearUsuario").mockRejectedValueOnce(new Error("bd"));
    expect((await POST(peticion("/x", "POST", { json: { nombre: "a" } }))).status).toBe(500);
  });

  it("PUT 400 si la contraseña nueva es corta", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const s = await crearUsuario();
    const res = await PUT(peticion("/x", "PUT", { json: { nombre: "x", password: "corta" } }), params(s.id));
    expect((await res.json()).error).toMatch(/8 caracteres/);
  });
});
