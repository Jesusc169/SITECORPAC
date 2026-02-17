"use client";

import React, { useEffect, useState } from "react";
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import styles from "./Directorio.module.css";

/* =========================
   Tipado alineado al API
   ========================= */
type Miembro = {
  id: number;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  foto?: string;
  fechaInicio: string;
  fechaFin?: string;
  orden: number;
};

/* =========================
   Utilidad fechas (FIX TZ)
   ========================= */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* =========================
   Normalizar URL de imagen
   ========================= */
function getFotoUrl(foto?: string) {
  if (!foto) return "";

  // si ya es absoluta (https)
  if (foto.startsWith("http")) return foto;

  // asegurar que apunte al public del server
  return foto.startsWith("/") ? foto : `/${foto}`;
}

export default function DirectorioPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     Obtener directorio
     ========================= */
  const fetchMiembros = async () => {
    try {
      const res = await fetch("/api/directorio", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Error al obtener directorio");
      }

      const data: Miembro[] = await res.json();

      // mantener orden
      data.sort((a, b) => a.orden - b.orden);

      setMiembros(data);
    } catch (error) {
      console.error("Error directorio:", error);
      setMiembros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiembros();
  }, []);

  return (
    <>
      <Cabecera />
      <Navbar />

      <main className={styles.main}>
        <h1>Directorio de Representantes</h1>

        {loading ? (
          <p>Cargando...</p>
        ) : miembros.length === 0 ? (
          <p>No hay registros por mostrar.</p>
        ) : (
          <ul className={styles.listaMiembros}>
            {miembros.map((m) => (
              <li key={m.id} className={styles.miembroCard}>
                {/* FOTO */}
                {m.foto && (
                  <img
                    src={getFotoUrl(m.foto)}
                    alt={`Foto de ${m.nombre}`}
                    className={styles.foto}
                    loading="lazy"
                  />
                )}

                <div className={styles.info}>
                  <strong>{m.nombre}</strong>

                  <span>👔 {m.cargo}</span>

                  <span>📧 {m.email}</span>

                  <span>📞 {m.telefono}</span>

                  <span className={styles.periodo}>
                    📅 {formatDate(m.fechaInicio)}
                    {m.fechaFin && ` – ${formatDate(m.fechaFin)}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </>
  );
}
