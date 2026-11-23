"use client";

import { useEffect, useState } from "react";
import EncabezadoPanel from "@/components/PanelAdmin/EncabezadoPanel";
import styles from "./usuarios.module.css";
import { PRIVILEGIOS } from "@/lib/permisos";
import panel from "@/styles/PanelAdmin.module.css";
import { jsonOError, mensajeDe } from "@/lib/mensajes";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  permisos: string[] | null;
  createdAt: string;
  activo: boolean;
}

interface FormState {
  id: number | null;
  nombre: string;
  email: string;
  password: string;
  rol: "administrador" | "secretaria";
  permisos: string[];
}

const FORM_VACIO: FormState = {
  id: null,
  nombre: "",
  email: "",
  password: "",
  rol: "secretaria",
  permisos: [],
};

function CeldaPrivilegios({ rol, permisos }: Readonly<{ rol: string; permisos: string[] | null }>) {
  if (rol === "administrador") return <span className={styles.textoMuted}>Acceso total</span>;
  if (!permisos?.length) return <span className={styles.textoMuted}>Sin privilegios</span>;
  return (
    <div className={styles.chips}>
      {permisos.map((p) => (
        <span key={p} className={styles.chip}>
          {PRIVILEGIOS.find((priv) => priv.clave === p)?.label ?? p}
        </span>
      ))}
    </div>
  );
}

type ResultadoUsuarios = { usuarios: Usuario[] } | { error: string };

// Pide la lista de cuentas del panel; nunca lanza: devuelve la lista o el error.
async function pedirUsuarios(): Promise<ResultadoUsuarios> {
  const ERROR_LISTA = "No se pudo cargar la lista de usuarios";
  try {
    const res = await fetch("/api/administrador/usuarios", { cache: "no-store" });
    const datos = await jsonOError<unknown>(res, ERROR_LISTA);
    // Un 200 que no trae una lista también es un fallo (no "no hay usuarios").
    if (!Array.isArray(datos)) {
      console.error("Usuarios: respuesta inesperada", datos);
      return { error: ERROR_LISTA };
    }
    return { usuarios: datos as Usuario[] };
  } catch (e) {
    console.error("Usuarios: no se pudo cargar", e);
    return { error: mensajeDe(e, ERROR_LISTA) };
  }
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const aplicarResultado = (resultado: ResultadoUsuarios) => {
    if ("usuarios" in resultado) {
      setUsuarios(resultado.usuarios);
      setError("");
    } else {
      setError(resultado.error);
    }
    setCargando(false);
  };

  const cargarUsuarios = async () => {
    setCargando(true);
    aplicarResultado(await pedirUsuarios());
  };

  // Primera carga: "cargando" ya empieza en true y el estado se guarda al
  // llegar la respuesta (en el .then), no de forma síncrona en el efecto.
  useEffect(() => {
    // pedirUsuarios nunca rechaza (devuelve la lista o el error); si algo falla
    // al aplicarlo, queda en la consola.
    pedirUsuarios()
      .then(aplicarResultado)
      .catch((e: unknown) => console.error("pedirUsuarios:", e));
  }, []);

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (u: Usuario) => {
    setForm({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol === "administrador" ? "administrador" : "secretaria",
      permisos: u.permisos || [],
    });
    setModalAbierto(true);
  };

  const togglePermiso = (clave: string) => {
    setForm((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(clave)
        ? prev.permisos.filter((p) => p !== clave)
        : [...prev.permisos, clave],
    }));
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      const esEdicion = form.id !== null;
      const url = esEdicion
        ? `/api/administrador/usuarios/${form.id}`
        : "/api/administrador/usuarios";

      const body = esEdicion
        ? {
            nombre: form.nombre,
            rol: form.rol,
            permisos: form.permisos,
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            nombre: form.nombre,
            email: form.email,
            password: form.password,
            rol: form.rol,
            permisos: form.permisos,
          };

      const res = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await jsonOError(res, "No se pudo guardar el usuario");

      setModalAbierto(false);
      await cargarUsuarios();
    } catch (e) {
      setError(mensajeDe(e, "No se pudo guardar el usuario"));
    } finally {
      setGuardando(false);
    }
  };

  const accionCuenta = async (
    u: Usuario,
    accion: "desactivar" | "activar" | "cerrar_sesiones"
  ) => {
    const preguntas = {
      desactivar: `¿Desactivar la cuenta de "${u.nombre}"? No podrá entrar al panel y se cerrarán sus sesiones abiertas. Su historial se conserva y puedes reactivarla cuando quieras.`,
      activar: `¿Reactivar la cuenta de "${u.nombre}"? Podrá volver a entrar con su contraseña.`,
      cerrar_sesiones: `¿Cerrar todas las sesiones abiertas de "${u.nombre}"? Tendrá que volver a iniciar sesión en todos sus equipos.`,
    };
    if (!confirm(preguntas[accion])) return;
    try {
      const res = await fetch(`/api/administrador/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      await jsonOError(res, "No se pudo completar la acción");
      await cargarUsuarios();
    } catch (e) {
      alert(mensajeDe(e, "No se pudo completar la acción"));
    }
  };

  const eliminar = async (u: Usuario) => {
    if (!confirm(`¿Eliminar el acceso de "${u.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/administrador/usuarios/${u.id}`, {
        method: "DELETE",
      });
      await jsonOError(res, "No se pudo eliminar el usuario");
      await cargarUsuarios();
    } catch (e) {
      alert(mensajeDe(e, "No se pudo eliminar el usuario"));
    }
  };

  return (
    <>
        <EncabezadoPanel
          titulo="Usuarios"
          descripcion="Administra quién puede entrar al panel y qué secciones puede usar."
        >
          <button className={panel.botonNuevo} onClick={abrirCrear}>
            + Nuevo usuario
          </button>
        </EncabezadoPanel>

        {error && !modalAbierto && <div role="alert" className={styles.errorBanner}>{error}</div>}

        {cargando ? (
          <p className={styles.textoMuted}>Cargando...</p>
        ) : (
          <div className={panel.contenedorTabla}>
          <table className={panel.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Privilegios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                // Si la carga falló, el aviso rojo ya lo explica: no se dice
                // "no hay usuarios" (sería falso).
                !error && (
                  <tr>
                    <td colSpan={6} className={panel.vacio}>
                      No hay usuarios registrados
                    </td>
                  </tr>
                )
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className={u.activo ? undefined : styles.filaInactiva}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`${styles.badgeRol} ${
                          u.rol === "administrador" ? styles.badgeAdmin : styles.badgeSecretaria
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <CeldaPrivilegios rol={u.rol} permisos={u.permisos} />
                    </td>
                    <td>
                      <span className={`${styles.badgeRol} ${u.activo ? styles.badgeActiva : styles.badgeInactiva}`}>
                        {u.activo ? "Activa" : "Desactivada"}
                      </span>
                    </td>
                    <td>
                      {/* aquí son hasta 4 botones: se permite que bajen de línea */}
                      <div className={panel.acciones} style={{ flexWrap: "wrap" }}>
                        <button className={panel.boton} onClick={() => abrirEditar(u)}>Editar</button>
                        {u.activo ? (
                          <>
                            <button
                              className={panel.boton}
                              onClick={() => accionCuenta(u, "cerrar_sesiones")}
                              title="Cierra su sesión en todos los equipos"
                            >
                              Cerrar sesiones
                            </button>
                            <button className={panel.boton} onClick={() => accionCuenta(u, "desactivar")}>
                              Desactivar
                            </button>
                          </>
                        ) : (
                          <button className={panel.boton} onClick={() => accionCuenta(u, "activar")}>
                            Reactivar
                          </button>
                        )}
                        <button className={panel.botonPeligro} onClick={() => eliminar(u)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}

        {modalAbierto && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>{form.id ? "Editar usuario" : "Nuevo usuario"}</h2>

              {error && <div role="alert" className={styles.errorBanner}>{error}</div>}

              <label htmlFor="usuario-nombre" className={styles.label}>Nombre</label>
              <input id="usuario-nombre"
                className={styles.input}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              <label htmlFor="usuario-correo" className={styles.label}>Correo</label>
              <input id="usuario-correo"
                className={styles.input}
                type="email"
                value={form.email}
                disabled={form.id !== null}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <label htmlFor="usuario-contrasena" className={styles.label}>
                {form.id ? "Nueva contraseña (opcional)" : "Contraseña"}
              </label>
              <input id="usuario-contrasena"
                className={styles.input}
                type="password"
                value={form.password}
                placeholder={form.id ? "Dejar en blanco para no cambiarla" : ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <label htmlFor="usuario-rol" className={styles.label}>Rol</label>
              <select id="usuario-rol"
                className={styles.input}
                value={form.rol}
                onChange={(e) =>
                  setForm({ ...form, rol: e.target.value as FormState["rol"] })
                }
              >
                <option value="secretaria">Secretaria</option>
                <option value="administrador">Administrador</option>
              </select>

              {form.rol === "administrador" ? (
                <p className={styles.textoMuted} style={{ marginTop: "0.5rem" }}>
                  Un administrador tiene acceso a todas las secciones automáticamente.
                </p>
              ) : (
                <fieldset className={styles.grupo}>
                  <legend className={styles.label}>Privilegios</legend>
                  <div className={styles.checkboxGroup}>
                    {PRIVILEGIOS.map((priv) => (
                      <label key={priv.clave} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={form.permisos.includes(priv.clave)}
                          onChange={() => togglePermiso(priv.clave)}
                        />
                        {priv.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className={styles.modalFooter}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button className={styles.btnPrimary} onClick={guardar} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
