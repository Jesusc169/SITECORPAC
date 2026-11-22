"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdminFeriaModal.module.css";
import { useSelectorImagenes } from "@/hooks/useSelectorImagenes";
import SelectorImagenes from "@/components/SelectorImagenes/SelectorImagenes";
import { useSelectorVideo, type InfoVideo } from "@/hooks/useSelectorVideo";
import SelectorVideo from "@/components/SelectorVideo/SelectorVideo";
import InterruptorVisible from "@/components/InterruptorVisible/InterruptorVisible";
import EditorTexto from "@/components/EditorTexto/EditorTexto";

/* =========================
   TIPOS
   ========================= */
interface Empresa {
  id: number;
  nombre: string;
}

export interface FechaFeria {
  id?: number;
  /** Clave estable de la fila en pantalla (no se guarda en la base) */
  clave: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  zona?: string;
}

/** Feria tal como la devuelve la API del panel (con fotos, empresas y fechas). */
export interface FeriaAdmin {
  id: number;
  titulo?: string | null;
  descripcion?: string | null;
  anio?: number | null;
  estado?: boolean | null;
  evento_feria_imagen?: { id: number; url: string }[];
  evento_feria_empresa?: { id: number; empresa_id: number; empresa?: { nombre: string } | null }[];
  evento_feria_fecha?: {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    ubicacion: string;
    zona?: string | null;
  }[];
  video?: InfoVideo | null;
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (payload: {
    formData: FormData;
    empresas: number[];
    fechas: FechaFeria[];
  }) => Promise<void>;
  feriaData?: FeriaAdmin | null;
  empresasDisponibles?: Empresa[];
}

/** Valores del formulario a partir de la feria a editar (o vacíos al crear). */
function formularioDesde(feriaData: FeriaAdmin | null) {
  const anioActual = new Date().getFullYear();
  if (!feriaData) {
    return { titulo: "", descripcion: "", anio: anioActual, estado: true, empresas: [], fechas: [] };
  }
  return {
    titulo: feriaData.titulo ?? "",
    descripcion: feriaData.descripcion ?? "",
    anio: feriaData.anio ?? anioActual,
    estado: feriaData.estado ?? true,
    empresas: Array.isArray(feriaData.evento_feria_empresa)
      ? feriaData.evento_feria_empresa.map((e) => e.empresa_id)
      : [],
    fechas: Array.isArray(feriaData.evento_feria_fecha)
      ? feriaData.evento_feria_fecha.map((f) => ({
          id: f.id,
          clave: crypto.randomUUID(),
          fecha: String(f.fecha).substring(0, 10),
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          ubicacion: f.ubicacion,
          zona: f.zona ?? "",
        }))
      : [],
  };
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
}: Readonly<Props>) {
  /* =========================
     ESTADOS
     ========================= */
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [estado, setEstado] = useState(true);
  // Bloquea el botón mientras se envía: sin esto cada clic mandaba otra
  // subida completa (y otra feria duplicada si el servidor sí respondía).
  const [guardando, setGuardando] = useState(false);
  const selectorImagenes = useSelectorImagenes();
  const selectorVideo = useSelectorVideo();

  const [empresas, setEmpresas] = useState<number[]>([]);
  const [empresaQuery, setEmpresaQuery] = useState("");
  const [showEmpresaList, setShowEmpresaList] = useState(false);

  const [fechas, setFechas] = useState<FechaFeria[]>([]);

  const comboRef = useRef<HTMLDivElement>(null);

  /* =========================
     CARGA DATA (EDITAR)
     Si cambia la feria elegida, los campos se rellenan durante el render
     (patrón de React para "ajustar el estado cuando cambia una prop"), sin
     un efecto que provoque un render de más.
     ========================= */
  const [feriaCargada, setFeriaCargada] = useState<FeriaAdmin | null | undefined>(undefined);
  if (feriaCargada !== feriaData) {
    setFeriaCargada(feriaData);
    const inicial = formularioDesde(feriaData);
    setTitulo(inicial.titulo);
    setDescripcion(inicial.descripcion);
    setAnio(inicial.anio);
    setEstado(inicial.estado);
    setEmpresas(inicial.empresas);
    setFechas(inicial.fechas);
  }

  // Fotos y video sí van en un efecto: reiniciarlos cancela la subida en
  // curso y consulta el espacio libre en el servidor.
  useEffect(() => {
    selectorImagenes.resetear(
      Array.isArray(feriaData?.evento_feria_imagen)
        ? feriaData.evento_feria_imagen.map((img) => ({ id: img.id, url: img.url }))
        : []
    );
    selectorVideo.resetear(feriaData?.video ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar la feria; los selectores cambian en cada render
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
      { clave: crypto.randomUUID(), fecha: "", hora_inicio: "", hora_fin: "", ubicacion: "", zona: "" },
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
  const handleSubmit = async () => {
    if (guardando) return;
    if (selectorVideo.ocupado) {
      alert("Espera a que termine de subir el video");
      return;
    }
    if (!titulo.trim() || !descripcion.trim() || !anio || anio < 2000 || anio > 2100) {
      alert("Completa los campos obligatorios");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo.trim());
    formData.append("descripcion", descripcion.trim());
    formData.append("anio", String(anio));
    formData.append("estado", String(estado));

    if (feriaData) {
      // Edición: puede combinar fotos existentes + nuevas + una eliminación.
      selectorImagenes.aplicarAFormData(formData);
    } else {
      // Creación: todas las fotos son nuevas, la principal se manda por índice.
      selectorImagenes.aplicarAFormData(formData, {
        principalIndex: "imagenPrincipalIndex",
      });
    }

    selectorVideo.aplicarAFormData(formData);

    setGuardando(true);
    try {
      await onSave({
        formData,
        empresas,
        fechas,
      });
    } finally {
      setGuardando(false);
    }
  };

  /* =========================
     RENDER
     ========================= */
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{feriaData ? "Editar Feria" : "Nueva Feria"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <InterruptorVisible visible={estado} onChange={setEstado} tipo="feria" />

          <label htmlFor="feria-titulo">Título</label>
          <input id="feria-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

          <label id="feria-descripcion-etiqueta">Descripción</label>
          <EditorTexto
            id="feria-descripcion"
            etiquetaId="feria-descripcion-etiqueta"
            valor={descripcion}
            onChange={setDescripcion}
          />

          <label htmlFor="feria-ano">Año</label>
          <input id="feria-ano"
            type="number"
            min={2000}
            max={2100}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />

          <label htmlFor="feria-fotos">Fotos de la feria (hasta 5)</label>
          <SelectorImagenes selector={selectorImagenes} idEntrada="feria-fotos" />

          <label htmlFor="feria-video">Video de la feria (opcional)</label>
          <SelectorVideo selector={selectorVideo} idEntrada="feria-video" />

          {/* EMPRESAS */}
          <label htmlFor="feria-empresas">Empresas participantes</label>
          <div className={styles.comboBox} ref={comboRef}>
            <input
              id="feria-empresas"
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
                  <button
                    type="button"
                    key={emp.id}
                    className={styles.comboItem}
                    onClick={() => addEmpresa(emp.id)}
                  >
                    {emp.nombre}
                  </button>
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
              <div key={f.clave} className={styles.fechaRow}>
                <input
                  type="date"
                  aria-label={`Fecha ${i + 1}: día`}
                  value={f.fecha}
                  onChange={(e) => updateFecha(i, "fecha", e.target.value)}
                />
                <input
                  type="time"
                  aria-label={`Fecha ${i + 1}: hora de inicio`}
                  value={f.hora_inicio}
                  onChange={(e) =>
                    updateFecha(i, "hora_inicio", e.target.value)
                  }
                />
                <input
                  type="time"
                  aria-label={`Fecha ${i + 1}: hora de fin`}
                  value={f.hora_fin}
                  onChange={(e) =>
                    updateFecha(i, "hora_fin", e.target.value)
                  }
                />
                <input
                  placeholder="Ubicación"
                  aria-label={`Fecha ${i + 1}: ubicación`}
                  value={f.ubicacion}
                  onChange={(e) =>
                    updateFecha(i, "ubicacion", e.target.value)
                  }
                />
                <input
                  placeholder="Zona"
                  aria-label={`Fecha ${i + 1}: zona`}
                  value={f.zona ?? ""}
                  onChange={(e) => updateFecha(i, "zona", e.target.value)}
                />
                <button type="button" onClick={() => removeFecha(i)} aria-label={`Quitar fecha ${i + 1}`}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.botonCancelar} onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="button" className={styles.botonGuardar} onClick={handleSubmit} disabled={guardando || selectorVideo.ocupado || selectorImagenes.procesando}>
            {guardando ? "Guardando…" : selectorImagenes.procesando ? "Preparando fotos…" : selectorVideo.ocupado ? "Subiendo video…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
