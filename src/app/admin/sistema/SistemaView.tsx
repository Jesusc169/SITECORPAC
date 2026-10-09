"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar/Sidebar";
import panel from "@/styles/PanelAdmin.module.css";
import styles from "./sistema.module.css";
import { formatearFechaHoraPeru } from "@/lib/fechas";
import type { SistemaController } from "@/controllers/sistemaController";

type Estado = Awaited<ReturnType<typeof SistemaController.estado>>;
type Seguridad = Awaited<ReturnType<typeof SistemaController.seguridad>>;
type Usuarios = Awaited<ReturnType<typeof SistemaController.usuarios>>;
type PaginaRegistro = Awaited<ReturnType<typeof SistemaController.listarRegistro>>;

interface ItemPapelera {
  id: number;
  modulo: string;
  entidadId: number;
  titulo: string;
  eliminadoEn: string;
  eliminadoPor: string | null;
  expiraEn: string;
  archivos: number;
}

interface CambioCampo {
  campo: string;
  antes: unknown;
  despues: unknown;
  restaurable: boolean;
}

interface DetalleCambios {
  id: number;
  fecha: string;
  usuario: string | null;
  modulo: string;
  entidadId: number | null;
  detalle: string | null;
  cambios: CambioCampo[];
  existe: boolean;
  puedeRestaurar: boolean;
}

const NOMBRE_CAMPO: Record<string, string> = {
  titulo: "Título",
  nombre: "Nombre",
  descripcion: "Descripción",
  contenido: "Contenido",
  autor: "Autor",
  activo: "Visible en el sitio",
  estado: "Visible en el sitio",
  imagen: "Foto principal",
  imagen_portada: "Foto principal",
  imagenes: "Fotos",
  documentos: "Documentos (PDF)",
  anio: "Año",
  fechas: "Fechas y lugares",
  empresas: "Empresas",
  lugar: "Lugar",
  fecha_hora: "Fecha y hora",
  premios: "Premios",
  cargo: "Cargo",
  correo: "Correo",
  telefono: "Teléfono",
  fotoUrl: "Foto",
  periodoInicio: "Inicio del periodo",
  periodoFin: "Fin del periodo",
};

const PESTANAS = [
  { id: "resumen", label: "Resumen" },
  { id: "registro", label: "Registro de actividad" },
  { id: "papelera", label: "Papelera" },
  { id: "seguridad", label: "Seguridad" },
  { id: "usuarios", label: "Usuarios" },
] as const;
type Pestana = (typeof PESTANAS)[number]["id"];

const NOMBRE_MODULO: Record<string, string> = {
  noticias: "Noticias",
  ferias: "Ferias",
  sorteos: "Sorteos",
  directorio: "Directorio",
  usuarios: "Usuarios",
  sesion: "Inicio de sesión",
  sistema: "Sistema",
};

const NOMBRE_ACCION: Record<string, string> = {
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  duplicar: "Duplicó",
  login: "Inició sesión",
  login_fallido: "Intento fallido",
  login_bloqueado: "IP bloqueada",
  logout: "Cerró sesión",
  desbloquear_ip: "Desbloqueó IP",
  error: "Error",
};

/* ---------- formatos ---------- */
function bytes(n: number | null | undefined): string {
  if (n == null) return "No disponible";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("es-PE", { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`;
}

function duracion(seg: number): string {
  const d = Math.floor(seg / 86400);
  const h = Math.floor((seg % 86400) / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (d) return `${d} d ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

function fecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  return formatearFechaHoraPeru(valor, { dateStyle: "short", timeStyle: "short" });
}

function hace(valor: string | null | undefined): string {
  if (!valor) return "nunca";
  const min = Math.round((Date.now() - new Date(valor).getTime()) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

/** Valor de un campo del historial, legible. */
function valorCampo(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "(vacío)";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (campo === "estado" && (v === "ACTIVO" || v === "INACTIVO")) return v === "ACTIVO" ? "Sí" : "No";
  if (Array.isArray(v)) return v.length ? v.map((x) => String(x).split("/").pop()).join("\n") : "(ninguno)";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return campo === "fecha_hora" ? fecha(v) : formatearFechaHoraPeru(v, { dateStyle: "medium" });
  }
  if (typeof v === "string" && v.startsWith("/") && /\.(jpe?g|png|webp|gif|pdf|docx?)$/i.test(v)) {
    return v.split("/").pop() as string;
  }
  return String(v);
}

function porcentaje(usado: number, total: number): number {
  return total > 0 ? Math.round((usado / total) * 100) : 0;
}

/* ---------- piezas ---------- */
function Barra({ valor }: { valor: number }) {
  const tono = valor >= 90 ? styles.barraError : valor >= 80 ? styles.barraAviso : styles.barraOk;
  return (
    <div className={styles.barra} role="img" aria-label={`${valor}% usado`}>
      <div className={`${styles.barraRelleno} ${tono}`} style={{ width: `${Math.min(100, valor)}%` }} />
    </div>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className={styles.tarjeta}>
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className={styles.dato}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Nivel({ nivel }: { nivel: string }) {
  const cls = nivel === "error" ? styles.nivelError : nivel === "aviso" ? styles.nivelAviso : styles.nivelInfo;
  const txt = nivel === "error" ? "Error" : nivel === "aviso" ? "Aviso" : "Info";
  return <span className={`${styles.nivel} ${cls}`}>{txt}</span>;
}

/* =========================================================
   RESUMEN
========================================================= */
function Resumen({ e, irARegistro }: { e: Estado; irARegistro: (f: Record<string, string>) => void }) {
  const m = e.maquina;
  const memUsada = m.memoriaTotal - m.memoriaLibre;
  const discoUsado = m.discoTotal != null && m.discoLibre != null ? m.discoTotal - m.discoLibre : null;

  return (
    <>
      <div className={styles.alertas} aria-live="polite">
        {e.alertas.length === 0 ? (
          <div className={`${styles.alerta} ${styles.alertaOk}`}>✔ Todo en orden. No hay alertas.</div>
        ) : (
          e.alertas.map((a, i) => (
            <div key={i} className={`${styles.alerta} ${a.gravedad === "error" ? styles.alertaError : styles.alertaAviso}`}>
              {a.gravedad === "error" ? "✖" : "⚠"} {a.texto}
            </div>
          ))
        )}
      </div>

      <div className={styles.grid}>
        <Tarjeta titulo="Sitio web">
          <dl>
            <Dato k="Versión desplegada" v={e.version.commit ? <code>{e.version.commit}</code> : "No disponible"} />
            <Dato k="Última compilación" v={fecha(e.version.compilado)} />
            <Dato k="Aplicación activa" v={duracion(m.procesoActivoSeg)} />
            <Dato k="Cambios en el panel (24 h)" v={e.actividad24h} />
            <Dato
              k="Errores (24 h)"
              v={
                e.errores24h > 0 ? (
                  <button className={styles.enlace} onClick={() => irARegistro({ nivel: "error" })}>
                    {e.errores24h} — ver
                  </button>
                ) : (
                  "0"
                )
              }
            />
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Servidor">
          <dl>
            <Dato k="Sistema" v={m.sistema} />
            <Dato k="Node.js" v={m.node} />
            <Dato k="Encendido hace" v={duracion(m.servidorActivoSeg)} />
            <Dato k="Carga (1/5/15 min)" v={`${m.cargaPromedio.join(" / ")} · ${m.cpus} CPU`} />
          </dl>
          <p className={styles.etiqueta}>
            Memoria: {bytes(memUsada)} de {bytes(m.memoriaTotal)} ({porcentaje(memUsada, m.memoriaTotal)}%)
          </p>
          <Barra valor={porcentaje(memUsada, m.memoriaTotal)} />
          {discoUsado != null && m.discoTotal != null && (
            <>
              <p className={styles.etiqueta}>
                Disco: {bytes(discoUsado)} de {bytes(m.discoTotal)} ({porcentaje(discoUsado, m.discoTotal)}%)
              </p>
              <Barra valor={porcentaje(discoUsado, m.discoTotal)} />
            </>
          )}
        </Tarjeta>

        <Tarjeta titulo="Base de datos">
          <dl>
            <Dato k="Conexión" v={`OK (${e.baseDatos.pingMs} ms)`} />
            <Dato k="Tamaño" v={bytes(e.baseDatos.bytes)} />
            <Dato k="Noticias" v={e.baseDatos.totales.noticias} />
            <Dato k="Ferias" v={e.baseDatos.totales.ferias} />
            <Dato k="Sorteos" v={e.baseDatos.totales.sorteos} />
            <Dato k="Directorio" v={e.baseDatos.totales.directorio} />
            <Dato k="Usuarios del panel" v={e.baseDatos.totales.usuarios} />
            <Dato k="Filas en el registro" v={e.baseDatos.totales.registro} />
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Respaldos y archivos">
          <dl>
            <Dato
              k="Último respaldo"
              v={
                e.respaldos.ultimo
                  ? `${fecha(e.respaldos.ultimo.fecha)} (${hace(e.respaldos.ultimo.fecha)})`
                  : e.respaldos.disponible
                    ? "Ninguno"
                    : "No disponible"
              }
            />
            <Dato k="Respaldos guardados" v={e.respaldos.disponible ? `${e.respaldos.cantidad} · ${bytes(e.respaldos.bytesTotal)}` : "—"} />
            <Dato k="Archivos subidos" v={`${e.archivos.archivos} · ${bytes(e.archivos.bytes)}`} />
            <Dato k="En la papelera" v={`${e.papelera.cantidad} elemento(s)`} />
          </dl>
          <p className={styles.nota}>Respaldo automático diario a las 3:00 a. m.; se guardan 30 días.</p>
        </Tarjeta>

        <Tarjeta titulo="Certificado HTTPS">
          <dl>
            <Dato k="Dominio" v={e.certificado.dominio} />
            <Dato
              k="Vence"
              v={e.certificado.venceEl ? `${fecha(e.certificado.venceEl)} (${e.certificado.diasRestantes} días)` : `No disponible (${e.certificado.error})`}
            />
            <Dato k="Emisor" v={e.certificado.emisor ?? "—"} />
          </dl>
          <p className={styles.nota}>Let&apos;s Encrypt (gratuito). Se renueva solo cuando faltan 30 días.</p>
        </Tarjeta>

        <Tarjeta titulo="Alertas por correo">
          {e.alertasCorreo.instaladas ? (
            <dl>
              <Dato k="Se envían a" v={e.alertasCorreo.destinatario ?? "—"} />
              <Dato k="Última revisión" v={hace(e.alertasCorreo.ultimaRevision)} />
              <Dato
                k="Último correo"
                v={e.alertasCorreo.ultimoCorreo ? fecha(e.alertasCorreo.ultimoCorreo.fecha) : "Ninguno todavía"}
              />
              <Dato k="Resumen diario (8:00 a. m.)" v={e.alertasCorreo.resumenDiario ? "Activado" : "Desactivado"} />
            </dl>
          ) : (
            <p className={styles.nota}>No instaladas en este servidor.</p>
          )}
          {e.alertasCorreo.ultimoCorreo?.asunto && (
            <p className={styles.nota}>Último aviso: «{e.alertasCorreo.ultimoCorreo.asunto}»</p>
          )}
          <p className={styles.nota}>
            Revisa cada 10 minutos: errores, ataques a contraseñas, cuentas desactivadas, respaldo y certificado.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Últimos errores">
          {e.ultimosErrores.length === 0 ? (
            <p className={styles.nota}>Sin errores registrados.</p>
          ) : (
            <ul className={styles.listaErrores}>
              {e.ultimosErrores.map((x) => (
                <li key={x.id}>
                  <span className={styles.fechaChica}>{fecha(x.fecha)}</span>
                  {x.detalle}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <p className={styles.nota}>
        Datos tomados: {fecha(e.generado)} · El registro de actividad se borra solo a los {e.retencionDias} días.
      </p>
    </>
  );
}

/* =========================================================
   REGISTRO DE ACTIVIDAD
========================================================= */
const FILTROS_VACIOS = { desde: "", hasta: "", modulo: "", nivel: "", usuario: "", q: "", entidad: "" };
type Filtros = typeof FILTROS_VACIOS;

function Registro({
  usuarios,
  modulos,
  filtrosIniciales,
}: {
  usuarios: Usuarios;
  modulos: string[];
  filtrosIniciales: Filtros;
}) {
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);
  const [aplicados, setAplicados] = useState<Filtros>(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<PaginaRegistro | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [verCambios, setVerCambios] = useState<number | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    setFiltros(filtrosIniciales);
    setAplicados(filtrosIniciales);
    setPagina(1);
  }, [filtrosIniciales]);

  const query = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      Object.entries({ ...aplicados, ...extra }).forEach(([k, v]) => v && p.set(k, v));
      return p.toString();
    },
    [aplicados]
  );

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError("");
    fetch(`/api/administrador/sistema/registro?${query({ pagina: String(pagina) })}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar el registro");
        return j as PaginaRegistro;
      })
      .then((j) => !cancelado && setDatos(j))
      .catch((e: Error) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [query, pagina, recarga]);

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;
  const cambiar = (k: keyof Filtros, v: string) => setFiltros((f) => ({ ...f, [k]: v }));

  return (
    <>
      <form
        className={styles.filtros}
        onSubmit={(ev) => {
          ev.preventDefault();
          setAplicados(filtros);
          setPagina(1);
        }}
      >
        <label>
          Desde
          <input type="date" value={filtros.desde} onChange={(e) => cambiar("desde", e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={filtros.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
        </label>
        <label>
          Módulo
          <select value={filtros.modulo} onChange={(e) => cambiar("modulo", e.target.value)}>
            <option value="">Todos</option>
            {modulos.map((m) => (
              <option key={m} value={m}>
                {NOMBRE_MODULO[m] ?? m}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nivel
          <select value={filtros.nivel} onChange={(e) => cambiar("nivel", e.target.value)}>
            <option value="">Todos</option>
            <option value="info">Info</option>
            <option value="aviso">Aviso</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label>
          Usuario
          <select value={filtros.usuario} onChange={(e) => cambiar("usuario", e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.nombre}
              </option>
            ))}
            <option value="anonimo">Sin usuario (sistema / intentos)</option>
          </select>
        </label>
        <label className={styles.filtroTexto}>
          Buscar
          <input
            type="search"
            placeholder="Título, nombre, IP…"
            value={filtros.q}
            maxLength={100}
            onChange={(e) => cambiar("q", e.target.value)}
          />
        </label>
        <div className={styles.filtrosBotones}>
          <button type="submit" className={panel.botonNuevo}>
            Filtrar
          </button>
          <button
            type="button"
            className={panel.boton}
            onClick={() => {
              setFiltros(FILTROS_VACIOS);
              setAplicados(FILTROS_VACIOS);
              setPagina(1);
            }}
          >
            Limpiar
          </button>
          <a className={panel.boton} href={`/api/administrador/sistema/registro?${query({ formato: "csv" })}`}>
            Descargar Excel (CSV)
          </a>
        </div>
      </form>

      {aplicados.entidad && (
        <div className={`${styles.alerta} ${styles.alertaOk}`}>
          Mostrando solo el historial de {NOMBRE_MODULO[aplicados.modulo] ?? "este elemento"} #{aplicados.entidad}.{" "}
          <button
            className={styles.enlace}
            onClick={() => {
              const f = { ...aplicados, entidad: "", modulo: "" };
              setFiltros(f);
              setAplicados(f);
              setPagina(1);
            }}
          >
            Ver todo
          </button>
        </div>
      )}

      {error && <div className={styles.alertaError + " " + styles.alerta}>{error}</div>}

      <div className={panel.contenedorTabla}>
        <table className={panel.tabla}>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Usuario</th>
              <th scope="col">Acción</th>
              <th scope="col">Módulo</th>
              <th scope="col">Detalle</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {cargando && !datos ? (
              <tr>
                <td colSpan={6} className={panel.vacio}>
                  Cargando…
                </td>
              </tr>
            ) : datos && datos.filas.length === 0 ? (
              <tr>
                <td colSpan={6} className={panel.vacio}>
                  No hay movimientos con esos filtros.
                </td>
              </tr>
            ) : (
              datos?.filas.map((f) => (
                <tr key={f.id} className={f.nivel === "error" ? styles.filaError : undefined}>
                  <td className={styles.celdaFecha}>{fecha(f.fecha)}</td>
                  <td>{f.usuario ?? <span className={styles.muted}>—</span>}</td>
                  <td>
                    <Nivel nivel={f.nivel} /> {NOMBRE_ACCION[f.accion] ?? f.accion}
                  </td>
                  <td>{NOMBRE_MODULO[f.modulo] ?? f.modulo}</td>
                  <td className={styles.celdaDetalle}>
                    {f.detalle}
                    {f.conCambios && (
                      <>
                        {" "}
                        <button className={styles.enlace} onClick={() => setVerCambios(f.id)}>
                          Ver cambios
                        </button>
                      </>
                    )}
                  </td>
                  <td className={styles.celdaIp}>{f.ip ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {datos && (
        <div className={styles.paginacion}>
          <span>
            {datos.total.toLocaleString("es-PE")} movimiento(s) · página {datos.pagina} de {totalPaginas}
          </span>
          <div>
            <button className={panel.boton} disabled={pagina <= 1 || cargando} onClick={() => setPagina((p) => p - 1)}>
              ← Anterior
            </button>
            <button
              className={panel.boton}
              disabled={pagina >= totalPaginas || cargando}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {verCambios !== null && (
        <ModalCambios
          id={verCambios}
          alCerrar={() => setVerCambios(null)}
          alRestaurar={() => {
            setVerCambios(null);
            setRecarga((n) => n + 1);
          }}
          verHistorial={(modulo, entidad) => {
            const f = { ...FILTROS_VACIOS, modulo, entidad: String(entidad) };
            setVerCambios(null);
            setFiltros(f);
            setAplicados(f);
            setPagina(1);
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   MODAL: QUÉ CAMBIÓ EN UNA EDICIÓN
========================================================= */
function ModalCambios({
  id,
  alCerrar,
  alRestaurar,
  verHistorial,
}: {
  id: number;
  alCerrar: () => void;
  alRestaurar: () => void;
  verHistorial: (modulo: string, entidad: number) => void;
}) {
  const [d, setD] = useState<DetalleCambios | null>(null);
  const [error, setError] = useState("");
  const [restaurando, setRestaurando] = useState(false);

  useEffect(() => {
    fetch(`/api/administrador/sistema/historial/${id}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar");
        setD(j);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // <dialog> nativo abierto con showModal(): el navegador pone el fondo,
  // atrapa el foco, cierra con Escape (evento "close") y al cerrar devuelve
  // el foco al botón «Ver cambios» que lo abrió.
  const dialogoRef = useRef<HTMLDialogElement>(null);
  // Sin close() al desmontar: en desarrollo React monta dos veces y lo
  // cerraría al instante. Al quitarse del DOM, el navegador lo retira solo.
  useEffect(() => {
    dialogoRef.current?.showModal();
  }, []);
  // Cerrar con close() (y no desmontando) para que el navegador devuelva el
  // foco al botón que abrió la ventana; el evento "close" llama a onClose.
  const cerrar = () => dialogoRef.current?.close();

  const restaurar = async () => {
    if (!d) return;
    if (
      !confirm(
        "¿Volver los textos a como estaban ANTES de este cambio? Las fotos y archivos no se tocan. Esta restauración también queda en el registro y se puede deshacer igual."
      )
    )
      return;
    setRestaurando(true);
    setError("");
    try {
      const r = await fetch(`/api/administrador/sistema/historial/${id}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo restaurar");
      alRestaurar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <dialog ref={dialogoRef} className={styles.modal} aria-labelledby="titulo-cambios" onClose={alCerrar}>
        <div className={styles.modalCabecera}>
          <h2 id="titulo-cambios">Qué cambió</h2>
          <button className={panel.boton} onClick={cerrar} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </div>

        {error && <div className={`${styles.alerta} ${styles.alertaError}`}>{error}</div>}
        {!d && !error && <p>Cargando…</p>}

        {d && (
          <>
            <p className={styles.nota}>
              {d.detalle} — {d.usuario ?? "—"}, {fecha(d.fecha)}
            </p>
            {d.cambios.length === 0 ? (
              <p>Se guardó sin cambiar nada.</p>
            ) : (
              <div className={panel.contenedorTabla}>
                <table className={panel.tabla}>
                  <thead>
                    <tr>
                      <th scope="col">Campo</th>
                      <th scope="col">Antes</th>
                      <th scope="col">Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.cambios.map((c) => (
                      <tr key={c.campo}>
                        <td>
                          <strong>{NOMBRE_CAMPO[c.campo] ?? c.campo}</strong>
                          {!c.restaurable && <div className={styles.muted}>solo lectura</div>}
                        </td>
                        <td className={styles.celdaAntes}>{valorCampo(c.campo, c.antes)}</td>
                        <td className={styles.celdaDespues}>{valorCampo(c.campo, c.despues)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.modalPie}>
              {d.entidadId && (
                <button className={panel.boton} onClick={() => verHistorial(d.modulo, d.entidadId as number)}>
                  Ver todo el historial de este elemento
                </button>
              )}
              {d.puedeRestaurar ? (
                <button className={panel.botonNuevo} onClick={restaurar} disabled={restaurando}>
                  {restaurando ? "Restaurando…" : "↶ Restaurar versión anterior"}
                </button>
              ) : (
                !d.existe && <span className={styles.muted}>Este elemento ya no existe (revisa la Papelera).</span>
              )}
            </div>
          </>
        )}
    </dialog>
  );
}

/* =========================================================
   PAPELERA
========================================================= */
function PapeleraTab() {
  const [items, setItems] = useState<ItemPapelera[] | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [trabajando, setTrabajando] = useState<number | null>(null);

  const cargar = useCallback(() => {
    fetch("/api/administrador/sistema/papelera")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar la papelera");
        setItems(j);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const accion = async (it: ItemPapelera, tipo: "restaurar" | "borrar") => {
    const pregunta =
      tipo === "restaurar"
        ? `¿Restaurar "${it.titulo}"? Vuelve al sitio tal como estaba, con sus fotos y su mismo enlace.`
        : `¿Borrar DEFINITIVAMENTE "${it.titulo}"? Se eliminan también sus archivos del servidor. No se puede deshacer.`;
    if (!confirm(pregunta)) return;
    setTrabajando(it.id);
    setError("");
    setMensaje("");
    try {
      const r = await fetch(`/api/administrador/sistema/papelera/${it.id}`, {
        method: tipo === "restaurar" ? "POST" : "DELETE",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo completar");
      setMensaje(
        tipo === "restaurar"
          ? `"${it.titulo}" se restauró y ya está de nuevo en ${NOMBRE_MODULO[it.modulo] ?? it.modulo}.`
          : `"${it.titulo}" se borró definitivamente.`
      );
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <>
      <p className={styles.nota}>
        Lo que se elimina en el panel (noticias, ferias, sorteos y miembros del directorio) queda aquí 30 días y
        después se borra solo. Al restaurar vuelve con sus fotos, documentos y el mismo enlace.
      </p>
      {mensaje && (
        <div className={`${styles.alerta} ${styles.alertaOk}`} role="status">
          {mensaje}
        </div>
      )}
      {error && <div className={`${styles.alerta} ${styles.alertaError}`}>{error}</div>}

      <div className={panel.contenedorTabla}>
        <table className={panel.tabla}>
          <thead>
            <tr>
              <th scope="col">Elemento</th>
              <th scope="col">Tipo</th>
              <th scope="col">Eliminado</th>
              <th scope="col">Se borra el</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr>
                <td colSpan={5} className={panel.vacio}>
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className={panel.vacio}>
                  La papelera está vacía.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <strong>{it.titulo}</strong>
                    <div className={styles.muted}>{it.archivos} archivo(s)</div>
                  </td>
                  <td>{NOMBRE_MODULO[it.modulo] ?? it.modulo}</td>
                  <td>
                    {fecha(it.eliminadoEn)}
                    <div className={styles.muted}>por {it.eliminadoPor ?? "—"}</div>
                  </td>
                  <td>{formatearFechaHoraPeru(it.expiraEn, { dateStyle: "medium" })}</td>
                  <td>
                    <div className={panel.acciones} style={{ flexWrap: "wrap" }}>
                      <button
                        className={panel.botonNuevo}
                        disabled={trabajando === it.id}
                        onClick={() => accion(it, "restaurar")}
                      >
                        Restaurar
                      </button>
                      <button
                        className={panel.botonPeligro}
                        disabled={trabajando === it.id}
                        onClick={() => accion(it, "borrar")}
                      >
                        Borrar definitivamente
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* =========================================================
   SEGURIDAD
========================================================= */
function SeguridadTab({ s, alCambiar }: { s: Seguridad; alCambiar: () => void }) {
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const desbloquear = async (ip: string) => {
    setTrabajando(ip);
    setMensaje("");
    try {
      const r = await fetch("/api/administrador/sistema/bloqueos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo desbloquear");
      setMensaje(`La IP ${ip} ya puede volver a iniciar sesión.`);
      alCambiar();
    } catch (e) {
      setMensaje((e as Error).message);
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <>
      <div className={styles.grid}>
        <Tarjeta titulo="Últimas 24 horas">
          <dl>
            <Dato k="Inicios de sesión correctos" v={s.logins24h} />
            <Dato k="Intentos fallidos" v={s.fallidos24h} />
            <Dato k="Intentos desde IP bloqueada" v={s.bloqueos24h} />
          </dl>
        </Tarjeta>
        <Tarjeta titulo="Cómo funciona el bloqueo">
          <p className={styles.nota}>
            Tras 5 intentos fallidos en 15 minutos, esa IP queda bloqueada 15 minutos. Si una secretaria se
            bloqueó por error, puedes desbloquearla aquí. Si ves muchos intentos de IPs desconocidas, alguien
            está probando contraseñas: el bloqueo lo frena solo.
          </p>
        </Tarjeta>
      </div>

      {mensaje && <div className={`${styles.alerta} ${styles.alertaOk}`} role="status">{mensaje}</div>}

      <h3 className={styles.subtitulo2}>IPs con intentos fallidos</h3>
      <div className={panel.contenedorTabla}>
        <table className={panel.tabla}>
          <thead>
            <tr>
              <th scope="col">IP</th>
              <th scope="col">Fallos</th>
              <th scope="col">Primer fallo</th>
              <th scope="col">Estado</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {s.intentos.length === 0 ? (
              <tr>
                <td colSpan={5} className={panel.vacio}>
                  No hay intentos fallidos registrados.
                </td>
              </tr>
            ) : (
              s.intentos.map((i) => (
                <tr key={i.ip}>
                  <td className={styles.celdaIp}>{i.ip}</td>
                  <td>{i.fallos}</td>
                  <td>{fecha(i.primerFalloEn)}</td>
                  <td>{i.bloqueada ? <Nivel nivel="error" /> : <Nivel nivel="aviso" />} {i.bloqueada ? `Bloqueada hasta ${fecha(i.bloqueadoHasta)}` : "Con fallos"}</td>
                  <td>
                    <button className={panel.boton} disabled={trabajando === i.ip} onClick={() => desbloquear(i.ip)}>
                      {trabajando === i.ip ? "…" : "Desbloquear"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* =========================================================
   USUARIOS
========================================================= */
function UsuariosTab({ u, irARegistro }: { u: Usuarios; irARegistro: (f: Record<string, string>) => void }) {
  return (
    <>
      <p className={styles.nota}>
        Para crear cuentas, cambiar contraseñas o permisos, usa <Link href="/admin/usuarios">Administrar usuarios</Link>.
      </p>
      <div className={panel.contenedorTabla}>
        <table className={panel.tabla}>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Rol</th>
              <th scope="col">Permisos</th>
              <th scope="col">Último inicio de sesión</th>
              <th scope="col">Cambios (30 días)</th>
              <th scope="col">Historial</th>
            </tr>
          </thead>
          <tbody>
            {u.map((x) => (
              <tr key={x.id}>
                <td>
                  <strong>{x.nombre}</strong>
                  <div className={styles.muted}>{x.email}</div>
                </td>
                <td>{x.rol === "administrador" ? "Administrador" : "Secretaria"}</td>
                <td>{x.rol === "administrador" ? "Acceso total" : x.permisos.length ? x.permisos.join(", ") : "Ninguno"}</td>
                <td>
                  {x.ultimoLogin ? fecha(x.ultimoLogin) : "—"}
                  <div className={styles.muted}>{hace(x.ultimoLogin)}</div>
                </td>
                <td>{x.cambios30d}</td>
                <td>
                  <button className={panel.boton} onClick={() => irARegistro({ usuario: String(x.id) })}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.nota}>
        «Último inicio de sesión» se cuenta desde que existe este registro (octubre de 2026).
      </p>
    </>
  );
}

/* =========================================================
   PANTALLA
========================================================= */
export default function SistemaView({
  estado,
  seguridad,
  usuarios,
  modulos,
}: {
  estado: Estado;
  seguridad: Seguridad;
  usuarios: Usuarios;
  modulos: string[];
}) {
  const router = useRouter();
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [filtrosRegistro, setFiltrosRegistro] = useState<Filtros>(FILTROS_VACIOS);
  const [actualizando, setActualizando] = useState(false);

  const irARegistro = (f: Record<string, string>) => {
    setFiltrosRegistro({ ...FILTROS_VACIOS, ...f });
    setPestana("registro");
  };

  const actualizar = () => {
    setActualizando(true);
    router.refresh();
    setTimeout(() => setActualizando(false), 800);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Sistema y registros</h1>
            <p className={styles.subtitulo}>
              Estado del servidor, quién hizo qué en el panel, errores y seguridad. Solo para administradores.
            </p>
          </div>
          <button className={panel.boton} onClick={actualizar} disabled={actualizando}>
            {actualizando ? "Actualizando…" : "↻ Actualizar"}
          </button>
        </div>

        <div className={styles.pestanas} role="tablist" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              id={`tab-${p.id}`}
              aria-selected={pestana === p.id}
              aria-controls={`panel-${p.id}`}
              className={`${styles.pestana} ${pestana === p.id ? styles.pestanaActiva : ""}`}
              onClick={() => setPestana(p.id)}
            >
              {p.label}
              {p.id === "resumen" && estado.alertas.length > 0 && (
                <span className={styles.contador}>{estado.alertas.length}</span>
              )}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`} className={styles.contenido}>
          {pestana === "resumen" && <Resumen e={estado} irARegistro={irARegistro} />}
          {pestana === "registro" && (
            <Registro usuarios={usuarios} modulos={modulos} filtrosIniciales={filtrosRegistro} />
          )}
          {pestana === "papelera" && <PapeleraTab />}
          {pestana === "seguridad" && <SeguridadTab s={seguridad} alCambiar={() => router.refresh()} />}
          {pestana === "usuarios" && <UsuariosTab u={usuarios} irARegistro={irARegistro} />}
        </div>
      </main>
    </div>
  );
}
