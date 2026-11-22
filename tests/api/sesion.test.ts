import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthController } from "@/controllers/AuthController";
import { ERROR_SISTEMA_LOGIN } from "@/lib/mensajes";
import { NextRequest } from "next/server";
import * as auth from "@/lib/auth";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/administrador/me/route";
import { middleware } from "../../middleware";
import { limpiarBD, crearUsuario, crearAdmin, iniciarSesionComo, cerrarSesion, peticion, prisma, CLAVE } from "../helpers";

beforeEach(limpiarBD);

const ultimoRegistro = () => prisma.registro_actividad.findFirst({ orderBy: { id: "desc" } });

describe("POST /api/auth/login", () => {
  it("con credenciales correctas da la cookie httpOnly y registra el inicio", async () => {
    const u = await crearUsuario({ email: "ana@test.local" });
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "ana@test.local", password: CLAVE } }));
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.user.email).toBe("ana@test.local");
    expect(cuerpo.user.password).toBeUndefined();
    expect(cuerpo.user.sesionVersion).toBeUndefined();
    expect(res.headers.get("set-cookie")).toMatch(/token=.+HttpOnly/i);
    expect(await ultimoRegistro()).toMatchObject({ accion: "login", usuarioId: u.id, ip: "10.0.0.1" });
  });

  it("faltan credenciales → 400", async () => {
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "x@y.z" } }));
    expect(res.status).toBe(400);
  });

  it("contraseña mala → 401, cuenta el fallo y guarda el correo", async () => {
    await crearUsuario({ email: "ana@test.local" });
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "ana@test.local", password: "mala" } }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Correo o contraseña incorrectos");
    expect((await prisma.login_intento.findUnique({ where: { ip: "10.0.0.1" } }))?.fallos).toBe(1);
    expect((await ultimoRegistro())?.detalle).toContain("ana@test.local");
  });

  it("si en el correo escribieron otra cosa (p. ej. la contraseña), no la guarda", async () => {
    await login(peticion("/api/auth/login", "POST", { json: { email: "MiClaveSecreta", password: "x" } }));
    const r = await ultimoRegistro();
    expect(r?.detalle).toContain("(no es un correo válido)");
    expect(r?.detalle).not.toContain("MiClaveSecreta");
  });

  it("cuerpo que no es JSON → 400 (credenciales faltantes), sin contar como intento", async () => {
    const req = new Request("http://localhost/api/auth/login", { method: "POST", body: "no-json", headers: { "x-real-ip": "10.0.0.1" } });
    const res = await login(req);
    expect(res.status).toBe(400);
    expect(await prisma.login_intento.count()).toBe(0);
  });

  it("correo inexistente → mismo 401 y mismo texto (no delata qué cuentas existen)", async () => {
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "nadie@test.local", password: "x" } }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Correo o contraseña incorrectos");
    expect((await prisma.login_intento.findUnique({ where: { ip: "10.0.0.1" } }))?.fallos).toBe(1);
  });

  it("correo o contraseña que no son texto → 400, sin consultar la BD ni contar intento", async () => {
    const r1 = await login(peticion("/api/auth/login", "POST", { json: { email: { $ne: 1 }, password: "x" } }));
    const r2 = await login(peticion("/api/auth/login", "POST", { json: { email: "a@b.c", password: 123 } }));
    expect([r1.status, r2.status]).toEqual([400, 400]);
    expect(await prisma.login_intento.count()).toBe(0);
  });

  it("cuenta desactivada con la contraseña correcta → 403, sin contar como fallo", async () => {
    await crearUsuario({ email: "baja@test.local", activo: false });
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "baja@test.local", password: CLAVE } }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/desactivada/);
    expect(await prisma.login_intento.count()).toBe(0);
    expect((await ultimoRegistro())?.detalle).toMatch(/cuenta desactivada/);
  });

  it("tras 5 fallos la IP queda bloqueada (429) y queda registrado", async () => {
    for (let i = 0; i < 5; i++) {
      await login(peticion("/api/auth/login", "POST", { json: { email: "x@test.local", password: "mala" } }));
    }
    const res = await login(peticion("/api/auth/login", "POST", { json: { email: "x@test.local", password: "mala" } }));
    expect(res.status).toBe(429);
    expect((await ultimoRegistro())?.accion).toBe("login_bloqueado");
  });
});

describe("POST /api/auth/logout", () => {
  it("borra la cookie y registra el cierre si había sesión", async () => {
    const u = await crearUsuario();
    iniciarSesionComo(u);
    const res = await logout(peticion("/api/auth/logout", "POST"));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/token=;/);
    expect(await ultimoRegistro()).toMatchObject({ accion: "logout", usuarioId: u.id });
  });

  it("si no se puede leer la sesión (p. ej. base caída) igual borra la cookie", async () => {
    vi.spyOn(auth, "obtenerUsuarioActual").mockRejectedValueOnce(new Error("BD caída"));
    const res = await logout(peticion("/api/auth/logout", "POST"));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/token=;/);
  });

  it("sin sesión no registra nada", async () => {
    cerrarSesion();
    const res = await logout(peticion("/api/auth/logout", "POST"));
    expect(res.status).toBe(200);
    expect(await prisma.registro_actividad.count()).toBe(0);
  });
});

describe("GET /api/administrador/me", () => {
  it("401 sin sesión", async () => {
    expect((await me()).status).toBe(401);
  });

  it("devuelve el usuario actual sin contraseña", async () => {
    const a = await crearAdmin();
    iniciarSesionComo(a);
    const d = await (await me()).json();
    expect(d).toMatchObject({ id: a.id, rol: "administrador" });
    expect(d.password).toBeUndefined();
  });
});

describe("middleware", () => {
  const req = (ruta: string, token?: string) =>
    new NextRequest(`http://localhost${ruta}`, token ? { headers: { cookie: `token=${token}` } } : undefined);

  it("deja pasar las rutas públicas y de login", () => {
    for (const r of ["/login", "/_next/x", "/favicon.ico", "/api/auth/login", "/noticias"]) {
      expect(middleware(req(r)).headers.get("location")).toBeNull();
    }
  });

  it("manda a /login si entra al panel sin cookie", () => {
    expect(middleware(req("/admin/noticias")).headers.get("location")).toContain("/login");
    expect(middleware(req("/dashboard")).headers.get("location")).toContain("/login");
  });

  it("con cookie deja pasar (la validez la revisa cada página)", () => {
    expect(middleware(req("/admin/noticias", "abc")).headers.get("location")).toBeNull();
  });
});

describe("login: fallos del sistema (no son culpa de quien entra)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const entrar = (email = "ana@test.local", password = CLAVE) =>
    login(peticion("/api/auth/login", "POST", { json: { email, password } }));

  async function esErrorDelSistema(res: Response) {
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toMatch(/json/);
    const cuerpo = await res.text();
    expect(JSON.parse(cuerpo).error).toBe(ERROR_SISTEMA_LOGIN);
    expect(cuerpo).not.toMatch(/database|prisma|secretOrPrivateKey/i);
  }

  it("BD caída al buscar el usuario → 500 claro, registrado como error, sin contar intento", async () => {
    vi.spyOn(prisma.user, "findUnique").mockRejectedValueOnce(new Error("Can't reach database server"));
    await esErrorDelSistema(await entrar());
    expect(await prisma.login_intento.count()).toBe(0);
    expect(await ultimoRegistro()).toMatchObject({ accion: "error", modulo: "sesion", nivel: "error" });
    expect((await ultimoRegistro())?.detalle).toContain("Can't reach database server");
  });

  it("falta JWT_SECRET con credenciales correctas → 500 claro y sin cookie", async () => {
    await crearUsuario({ email: "ana@test.local" });
    vi.stubEnv("JWT_SECRET", "");
    const res = await entrar();
    expect(res.headers.get("set-cookie")).toBeNull();
    await esErrorDelSistema(res);
    expect(await prisma.login_intento.count()).toBe(0);
  });

  it("10 fallos del sistema seguidos no bloquean la IP", async () => {
    await crearUsuario({ email: "ana@test.local" });
    const espia = vi.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("BD caída"));
    for (let i = 0; i < 10; i++) expect((await entrar()).status).toBe(500);
    espia.mockRestore();
    expect((await entrar()).status).toBe(200);
    expect(await prisma.login_intento.count()).toBe(0);
  });

  it("BD caída al revisar el bloqueo → 500 claro (nunca una página HTML)", async () => {
    vi.spyOn(prisma.login_intento, "findUnique").mockRejectedValueOnce(new Error("BD caída"));
    await esErrorDelSistema(await entrar());
  });

  it("BD caída al contar el fallo → 500 claro", async () => {
    await crearUsuario({ email: "ana@test.local" });
    vi.spyOn(prisma.login_intento, "upsert").mockRejectedValueOnce(new Error("BD caída"));
    await esErrorDelSistema(await entrar("ana@test.local", "mala"));
  });

  it("errores raros (sin mensaje o que no son Error) también son del sistema", async () => {
    vi.spyOn(AuthController, "login").mockRejectedValueOnce(new Error(""));
    await esErrorDelSistema(await entrar("a@b.c", "x"));
    vi.spyOn(AuthController, "login").mockRejectedValueOnce("falla rara");
    await esErrorDelSistema(await entrar("a@b.c", "x"));
    expect((await ultimoRegistro())?.detalle).toContain("falla rara");
    expect(await prisma.login_intento.count()).toBe(0);
  });
});
