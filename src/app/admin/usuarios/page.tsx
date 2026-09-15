"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./usuarios.module.css";
import { PRIVILEGIOS } from "@/lib/permisos";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  permisos: string[] | null;
  createdAt: string;
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/administrador/usuarios", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo cargar la lista de usuarios");
      }
      const data = await res.json();
      setUsuarios(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Error al cargar usuarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el usuario");
      }

      setModalAbierto(false);
      await cargarUsuarios();
    } catch (e: any) {
      setError(e.message || "Error al guardar usuario");
    } finally {
      setGuardando(false);
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el usuario");
      }
      await cargarUsuarios();
    } catch (e: any) {
      alert(e.message || "Error al eliminar usuario");
    }
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Usuarios</h1>
            <p className={styles.subtitulo}>
              Administra quién puede entrar al panel y qué secciones puede usar.
            </p>
          </div>
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Nuevo usuario
          </button>
        </div>

        {error && !modalAbierto && <div className={styles.errorBanner}>{error}</div>}

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Privilegios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id}>
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
                      {u.rol === "administrador" ? (
                        <span className={styles.textoMuted}>Acceso total</span>
                      ) : u.permisos && u.permisos.length > 0 ? (
                        <div className={styles.chips}>
                          {u.permisos.map((p) => (
                            <span key={p} className={styles.chip}>
                              {PRIVILEGIOS.find((priv) => priv.clave === p)?.label || p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.textoMuted}>Sin privilegios</span>
                      )}
                    </td>
                    <td className={styles.acciones}>
                      <button onClick={() => abrirEditar(u)}>Editar</button>
                      <button className={styles.danger} onClick={() => eliminar(u)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {modalAbierto && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>{form.id ? "Editar usuario" : "Nuevo usuario"}</h2>

              {error && <div className={styles.errorBanner}>{error}</div>}

              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              <label className={styles.label}>Correo</label>
              <input
                className={styles.input}
                type="email"
                value={form.email}
                disabled={form.id !== null}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <label className={styles.label}>
                {form.id ? "Nueva contraseña (opcional)" : "Contraseña"}
              </label>
              <input
                className={styles.input}
                type="password"
                value={form.password}
                placeholder={form.id ? "Dejar en blanco para no cambiarla" : ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <label className={styles.label}>Rol</label>
              <select
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
                <>
                  <label className={styles.label}>Privilegios</label>
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
                </>
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
      </main>
    </div>
  );
}
