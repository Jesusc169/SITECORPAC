import { RegistroModel, type FiltrosRegistro } from "@/models/registroModel";
import {
  leerVersion,
  estadoMaquina,
  archivosSubidos,
  estadoRespaldos,
  estadoCertificado,
  estadoAlertas,
} from "@/lib/estadoServidor";
import { depurarPapelera, DIAS_PAPELERA } from "@/lib/papelera";
import prisma from "@/lib/prisma";
import {
  depurarRegistroAntiguo,
  MODULOS_REGISTRO,
  NIVELES_REGISTRO,
  RETENCION_REGISTRO_DIAS,
} from "@/lib/registro";
import { fechaHoraPeru } from "@/lib/fechas";

export class SistemaValidationError extends Error {}

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export const POR_PAGINA = 50;
export const MAX_EXPORTAR = 5000;

export type Gravedad = "ok" | "aviso" | "error";
export interface Alerta {
  gravedad: Gravedad;
  texto: string;
}

/**
 * Alertas de la portada de /admin/sistema. Separada para poder probar los
 * umbrales sin servidor ni base de datos.
 */
export function calcularAlertas(d: {
  discoTotal: number | null;
  discoLibre: number | null;
  memoriaTotal: number;
  memoriaLibre: number;
  diasCertificado: number | null;
  errorCertificado: string | null;
  respaldosDisponibles: boolean;
  ultimoRespaldo: string | null;
  erroresUltimas24h: number;
  ipsBloqueadas: number;
  alertasInstaladas?: boolean;
  alertasUltimaRevision?: string | null;
  ahora?: number;
}): Alerta[] {
  const ahora = d.ahora ?? Date.now();
  const alertas: Alerta[] = [];

  if (d.discoTotal && d.discoLibre != null) {
    const uso = 1 - d.discoLibre / d.discoTotal;
    if (uso >= 0.9) alertas.push({ gravedad: "error", texto: `Disco casi lleno (${Math.round(uso * 100)}% usado).` });
    else if (uso >= 0.8) alertas.push({ gravedad: "aviso", texto: `El disco ya va en ${Math.round(uso * 100)}% de uso.` });
  }

  if (d.diasCertificado == null) {
    alertas.push({ gravedad: "aviso", texto: `No se pudo revisar el certificado HTTPS (${d.errorCertificado ?? "sin datos"}).` });
  } else if (d.diasCertificado < 7) {
    alertas.push({ gravedad: "error", texto: `El certificado HTTPS vence en ${d.diasCertificado} días y no se ha renovado.` });
  } else if (d.diasCertificado < 20) {
    alertas.push({ gravedad: "aviso", texto: `El certificado HTTPS vence en ${d.diasCertificado} días (normalmente se renueva solo a los 30).` });
  }

  if (!d.respaldosDisponibles) {
    alertas.push({ gravedad: "aviso", texto: "No se puede leer la carpeta de respaldos desde la aplicación." });
  } else if (!d.ultimoRespaldo) {
    alertas.push({ gravedad: "error", texto: "No hay ningún respaldo de la base de datos." });
  } else if (ahora - new Date(d.ultimoRespaldo).getTime() > 36 * HORA) {
    alertas.push({ gravedad: "error", texto: "El último respaldo de la base de datos tiene más de 36 horas." });
  }

  if (d.erroresUltimas24h > 0) {
    alertas.push({
      gravedad: "aviso",
      texto: `${d.erroresUltimas24h} error(es) del servidor en las últimas 24 horas. Revísalos en «Registro de actividad».`,
    });
  }

  if (d.ipsBloqueadas > 0) {
    alertas.push({ gravedad: "aviso", texto: `${d.ipsBloqueadas} IP(s) bloqueada(s) ahora por intentos fallidos de inicio de sesión.` });
  }

  // Las alertas por correo corren cada 10 min: si la última pasada tiene más
  // de 30 min, el cron dejó de funcionar y nadie se enteraría de un problema.
  if (d.alertasInstaladas === false) {
    alertas.push({ gravedad: "aviso", texto: "Las alertas por correo no están instaladas en el servidor." });
  } else if (
    d.alertasUltimaRevision &&
    ahora - new Date(d.alertasUltimaRevision).getTime() > 30 * 60 * 1000
  ) {
    alertas.push({ gravedad: "error", texto: "Las alertas por correo dejaron de ejecutarse (más de 30 minutos sin revisar)." });
  }

  if (d.memoriaTotal > 0 && d.memoriaLibre / d.memoriaTotal < 0.1) {
    alertas.push({ gravedad: "aviso", texto: "Queda menos del 10% de memoria libre en el servidor." });
  }

  return alertas;
}

/** "2026-10-01" → Date (inicio o fin de ese día en hora de Perú). */
function diaPeru(valor: string | null, finDelDia: boolean): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(fechaHoraPeru(valor, finDelDia ? "23:59" : "00:00"));
  if (isNaN(d.getTime())) return null;
  return finDelDia ? new Date(d.getTime() + 59999) : d;
}

/** Lee y valida los filtros que llegan en la URL. */
export function leerFiltros(params: URLSearchParams): FiltrosRegistro {
  const modulo = params.get("modulo");
  const nivel = params.get("nivel");
  const usuario = params.get("usuario");
  const texto = params.get("q")?.trim().slice(0, 100) || null;
  const entidad = params.get("entidad");
  const entidadId = entidad && /^\d{1,9}$/.test(entidad) ? Number(entidad) : null;

  if (modulo && !(MODULOS_REGISTRO as readonly string[]).includes(modulo)) {
    throw new SistemaValidationError("Módulo no válido");
  }
  if (nivel && !(NIVELES_REGISTRO as readonly string[]).includes(nivel)) {
    throw new SistemaValidationError("Nivel no válido");
  }

  let usuarioFiltro: FiltrosRegistro["usuario"] = null;
  if (usuario === "anonimo") usuarioFiltro = "anonimo";
  else if (usuario) {
    const n = Number(usuario);
    if (!Number.isInteger(n) || n <= 0) throw new SistemaValidationError("Usuario no válido");
    usuarioFiltro = n;
  }

  return {
    desde: diaPeru(params.get("desde"), false),
    hasta: diaPeru(params.get("hasta"), true),
    modulo: modulo || null,
    nivel: nivel || null,
    usuario: usuarioFiltro,
    texto,
    entidadId,
  };
}

/** Celda CSV segura: comillas escapadas y sin fórmulas (=, +, -, @) para Excel. */
export function celdaCsv(valor: unknown): string {
  let s = valor == null ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export const SistemaController = {
  async estado() {
    const desde24h = new Date(Date.now() - DIA);
    await depurarPapelera().catch(() => 0);
    const [version, maquina, archivos, respaldos, certificado, totales, bytesBD, pingMs, intentos, errores24h, errores, actividad24h, alertasCorreo, enPapelera] =
      await Promise.all([
        leerVersion(),
        estadoMaquina(),
        archivosSubidos(),
        estadoRespaldos(),
        estadoCertificado(),
        RegistroModel.totales(),
        RegistroModel.tamanoBaseDatos().catch(() => null),
        RegistroModel.ping(),
        RegistroModel.intentosLogin(),
        RegistroModel.contarDesde(desde24h, { nivel: "error" }),
        RegistroModel.ultimosErrores(5),
        RegistroModel.contarDesde(desde24h, { accion: { in: ["crear", "editar", "eliminar", "duplicar"] } }),
        estadoAlertas(),
        prisma.papelera.count(),
      ]);

    const ahora = Date.now();
    const bloqueadas = intentos.filter((i) => i.bloqueadoHasta && i.bloqueadoHasta.getTime() > ahora);

    const alertas = calcularAlertas({
      discoTotal: maquina.discoTotal,
      discoLibre: maquina.discoLibre,
      memoriaTotal: maquina.memoriaTotal,
      memoriaLibre: maquina.memoriaLibre,
      diasCertificado: certificado.diasRestantes,
      errorCertificado: certificado.error,
      respaldosDisponibles: respaldos.disponible,
      ultimoRespaldo: respaldos.ultimo?.fecha ?? null,
      erroresUltimas24h: errores24h,
      ipsBloqueadas: bloqueadas.length,
      alertasInstaladas: alertasCorreo.instaladas,
      alertasUltimaRevision: alertasCorreo.ultimaRevision,
    });

    return {
      generado: new Date().toISOString(),
      alertas,
      version,
      maquina,
      archivos,
      respaldos,
      certificado,
      baseDatos: { pingMs, bytes: bytesBD, totales },
      actividad24h,
      errores24h,
      ultimosErrores: errores.map((e) => ({ ...e, fecha: e.fecha.toISOString() })),
      retencionDias: RETENCION_REGISTRO_DIAS,
      alertasCorreo,
      papelera: { cantidad: enPapelera, dias: DIAS_PAPELERA },
    };
  },

  async seguridad() {
    const desde24h = new Date(Date.now() - DIA);
    const [intentos, logins24h, fallidos24h, bloqueos24h] = await Promise.all([
      RegistroModel.intentosLogin(),
      RegistroModel.contarDesde(desde24h, { accion: "login" }),
      RegistroModel.contarDesde(desde24h, { accion: "login_fallido" }),
      RegistroModel.contarDesde(desde24h, { accion: "login_bloqueado" }),
    ]);
    const ahora = Date.now();
    return {
      logins24h,
      fallidos24h,
      bloqueos24h,
      intentos: intentos.map((i) => ({
        ip: i.ip,
        fallos: i.fallos,
        primerFalloEn: i.primerFalloEn.toISOString(),
        bloqueadoHasta: i.bloqueadoHasta?.toISOString() ?? null,
        bloqueada: !!i.bloqueadoHasta && i.bloqueadoHasta.getTime() > ahora,
      })),
    };
  },

  async usuarios() {
    const [usuarios, resumen] = await Promise.all([
      RegistroModel.usuariosDelSistema(),
      RegistroModel.resumenPorUsuario(new Date(Date.now() - 30 * DIA)),
    ]);
    const login = new Map(resumen.ultimosLogin.map((r) => [r.usuarioId, r._max.fecha]));
    const ultima = new Map(resumen.ultimasAcciones.map((r) => [r.usuarioId, r._max.fecha]));
    const acciones = new Map(resumen.accionesPeriodo.map((r) => [r.usuarioId, r._count._all]));

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      permisos: Array.isArray(u.permisos) ? (u.permisos as string[]) : [],
      creado: u.createdAt.toISOString(),
      ultimoLogin: login.get(u.id)?.toISOString() ?? null,
      ultimaActividad: ultima.get(u.id)?.toISOString() ?? null,
      cambios30d: acciones.get(u.id) ?? 0,
    }));
  },

  async listarRegistro(filtros: FiltrosRegistro, pagina: number) {
    await depurarRegistroAntiguo();
    const p = Math.max(1, Math.floor(pagina) || 1);
    const [filas, total] = await Promise.all([
      RegistroModel.listar(filtros, (p - 1) * POR_PAGINA, POR_PAGINA),
      RegistroModel.contar(filtros),
    ]);
    return {
      pagina: p,
      porPagina: POR_PAGINA,
      total,
      filas: filas.map((f) => ({ ...f, fecha: f.fecha.toISOString() })),
    };
  },

  async exportarRegistroCsv(filtros: FiltrosRegistro): Promise<string> {
    const filas = await RegistroModel.listar(filtros, 0, MAX_EXPORTAR);
    const fmt = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      dateStyle: "short",
      timeStyle: "medium",
    });
    const cab = ["Fecha (hora Perú)", "Usuario", "Acción", "Módulo", "Nivel", "Detalle", "IP"];
    const lineas = filas.map((f) =>
      [fmt.format(f.fecha), f.usuario ?? "—", f.accion, f.modulo, f.nivel, f.detalle ?? "", f.ip ?? ""]
        .map(celdaCsv)
        .join(",")
    );
    // BOM para que Excel abra bien las tildes
    return "﻿" + [cab.map(celdaCsv).join(","), ...lineas].join("\r\n");
  },

  async desbloquearIp(ip: string): Promise<number> {
    const limpia = ip.trim();
    if (!limpia || limpia.length > 64) throw new SistemaValidationError("IP no válida");
    const { count } = await RegistroModel.desbloquearIp(limpia);
    return count;
  },
};
