"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Directorio.module.css";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* =========================
   URL IMAGEN (relativa: funciona
   igual en local y en producción)
   ========================= */
function getFotoUrl(foto?: string) {
  if (!foto) return "";

  if (foto.startsWith("http")) return foto;

  return foto.startsWith("/") ? foto : `/${foto}`;
}

export default function DirectorioClient() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMiembros = async () => {
    try {
      const res = await fetch("/api/directorio", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Error al obtener directorio");
      }

      const data: Miembro[] = await res.json();
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
    <main className={styles.main}>
      <h1>Directorio de Representantes</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : miembros.length === 0 ? (
        <p>No hay registros por mostrar.</p>
      ) : (
        <ul className={styles.listaMiembros}>
          {miembros.map((m, index) => (
            <li key={m.id} className={styles.miembroCard}>
              {m.foto ? (
                <div className={styles.fotoWrapper}>
                  <Image
                    src={getFotoUrl(m.foto)}
                    alt={`Foto de ${m.nombre}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    priority={index < 4}
                    loading={index < 4 ? "eager" : "lazy"}
                    className={styles.foto}
                  />
                </div>
              ) : (
                <div className={styles.fotoWrapper}>
                  <i
                    className={`bi bi-person-circle ${styles.fotoPlaceholder}`}
                    aria-hidden="true"
                  ></i>
                </div>
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
  );
}
