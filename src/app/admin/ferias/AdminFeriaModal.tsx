"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdminFeriaModal.module.css";

/* =========================
   TIPOS
   ========================= */
interface Empresa {
  id: number;
  nombre: string;
}

export interface FechaFeria {
  id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (payload: {
    formData: FormData;
    empresas: number[];
    fechas: FechaFeria[];
  }) => void;
  feriaData?: any;
  empresasDisponibles?: Empresa[];
}

/* =========================
   COMPONENTE
   ========================= */
export default function AdminFeriaModal({
  show,
  onClose,
  onSave,
  feriaData = null,
  empresasDisponibles = [],
}: Props) {
  /* =========================
     ESTADOS
     ========================= */
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [imagen, setImagen] = useState<File | null>(null);

  const [empresas, setEmpresas] = useState<number[]>([]);
  const [empresaQuery, setEmpresaQuery] = useState("");
  const [showEmpresaList, setShowEmpresaList] = useState(false);

  const [fechas, setFechas] = useState<FechaFeria[]>([]);

  const comboRef = useRef<HTMLDivElement>(null);

  /* =========================
     CARGA DATA (EDITAR)
     ========================= */
  useEffect(() => {
    if (!feriaData) {
      setTitulo("");
      setDescripcion("");
      setAnio(new Date().getFullYear());
      setImagen(null);
      setEmpresas([]);
      setFechas([]);
      return;
    }

    setTitulo(feriaData.titulo ?? "");
    setDescripcion(feriaData.descripcion ?? "");
    setAnio(feriaData.anio ?? new Date().getFullYear());

    setEmpresas(
      Array.isArray(feriaData.evento_feria_empresa)
        ? feriaData.evento_feria_empresa.map((e: any) => e.empresa_id)
        : []
    );

    setFechas(
      Array.isArray(feriaData.evento_feria_fecha)
        ? feriaData.evento_feria_fecha.map((f: any) => ({
            id: f.id,
            fecha: String(f.fecha).substring(0, 10),
            hora_inicio: f.hora_inicio,
            hora_fin: f.hora_fin,
            ubicacion: f.ubicacion,
            zona: f.zona ?? "",
          }))
        : []
    );
  }, [feriaData]);

  /* =========================
     CLICK FUERA COMBO
     ========================= */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setShowEmpresaList(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!show) return null;

  /* =========================
     EMPRESAS
     ========================= */
  const empresasFiltradas = empresasDisponibles.filter(
    (e) =>
      e.nombre.toLowerCase().includes(empresaQuery.toLowerCase()) &&
      !empresas.includes(e.id)
  );

  const addEmpresa = (id: number) => {
    setEmpresas((prev) => [...prev, id]);
    setEmpresaQuery("");
    setShowEmpresaList(false);
  };

  const removeEmpresa = (id: number) =>
    setEmpresas((prev) => prev.filter((e) => e !== id));

  /* =========================
     FECHAS
     ========================= */
  const addFecha = () =>
    setFechas((prev) => [
      ...prev,
      { fecha: "", hora_inicio: "", hora_fin: "", ubicacion: "", zona: "" },
    ]);

  const updateFecha = (
    i: number,
    field: keyof FechaFeria,
    value: string
  ) => {
    setFechas((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f))
    );
  };

  const removeFecha = (i: number) =>
    setFechas((prev) => prev.filter((_, idx) => idx !== i));

  /* =========================
     GUARDAR
     ========================= */
  const handleSubmit = () => {
    if (!titulo.trim() || !descripcion.trim() || !anio) {
      alert("Completa los campos obligatorios");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo.trim());
    formData.append("descripcion", descripcion.trim());
    formData.append("anio", String(anio));

    if (imagen) {
      formData.append("imagen_portada", imagen);
    }

    onSave({
      formData,
      empresas,
      fechas,
    });
  };

  /* =========================
     RENDER
     ========================= */
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{feriaData ? "Editar Feria" : "Nueva Feria"}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <label>Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />

          <label>Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <label>Año</label>
          <input
            type="number"
            min={2000}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />

          <label>Imagen de portada</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] || null)}
          />

          {/* EMPRESAS */}
          <label>Empresas participantes</label>
          <div className={styles.comboBox} ref={comboRef}>
            <input
              placeholder="Buscar empresa..."
              value={empresaQuery}
              onChange={(e) => {
                setEmpresaQuery(e.target.value);
                setShowEmpresaList(true);
              }}
              onFocus={() => setShowEmpresaList(true)}
            />

            {showEmpresaList && (
              <div className={styles.comboList}>
                {empresasFiltradas.length === 0 && (
                  <div className={styles.comboEmpty}>Sin resultados</div>
                )}
                {empresasFiltradas.map((emp) => (
                  <div
                    key={emp.id}
                    className={styles.comboItem}
                    onClick={() => addEmpresa(emp.id)}
                  >
                    {emp.nombre}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.selectedChips}>
              {empresas.map((id) => {
                const emp = empresasDisponibles.find((e) => e.id === id);
                if (!emp) return null;
                return (
                  <span key={id} className={styles.chip}>
                    {emp.nombre}
                    <button onClick={() => removeEmpresa(id)}>×</button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* FECHAS */}
          <div className={styles.fechasSection}>
            <div className={styles.fechasHeader}>
              <h3>Fechas del evento</h3>
              <button type="button" onClick={addFecha}>
                + Añadir fecha
              </button>
            </div>

            {fechas.map((f, i) => (
              <div key={i} className={styles.fechaRow}>
                <input
                  type="date"
                  value={f.fecha}
                  onChange={(e) => updateFecha(i, "fecha", e.target.value)}
                />
                <input
                  type="time"
                  value={f.hora_inicio}
                  onChange={(e) =>
                    updateFecha(i, "hora_inicio", e.target.value)
                  }
                />
                <input
                  type="time"
                  value={f.hora_fin}
                  onChange={(e) =>
                    updateFecha(i, "hora_fin", e.target.value)
                  }
                />
                <input
                  placeholder="Ubicación"
                  value={f.ubicacion}
                  onChange={(e) =>
                    updateFecha(i, "ubicacion", e.target.value)
                  }
                />
                <input
                  placeholder="Zona"
                  value={f.zona ?? ""}
                  onChange={(e) => updateFecha(i, "zona", e.target.value)}
                />
                <button type="button" onClick={() => removeFecha(i)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSubmit}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
