"use client";

import React, { useEffect, useState } from "react";
import Cabecera from "../../components/Cabecera/Cabecera";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import styles from "./Directorio.module.css";

type Miembro = {
  id: number;
  nombre: string;
  cargo: string;
  correo: string;
  telefono: string;
  fotoUrl?: string;
  periodoInicio: string;
  periodoFin?: string;
  orden: number;
};

/* =========================
   Utilidad fechas (FIX TZ)
   ========================= */
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-PE", {
    timeZone: "UTC",
  });
}

export default function DirectorioPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     Obtener directorio
     ========================= */
  const fetchMiembros = async () => {
    try {
      const res = await fetch("/api/directorio");
      if (!res.ok) throw new Error("Error al obtener directorio");

      const data: Miembro[] = await res.json();

      // 🔥 ORDEN DEFINIDO POR BD
      data.sort((a, b) => a.orden - b.orden);

      setMiembros(data);
    } catch (error) {
      console.error(error);
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
                {m.fotoUrl && (
                  <img
                    src={m.fotoUrl}
                    alt={`Foto de ${m.nombre}`}
                    className={styles.foto}
                  />
                )}

                <div className={styles.info}>
                  <strong>{m.nombre}</strong>

                  <span>
                    👔 {m.cargo}
                  </span>

                  <span>
                    📧 {m.correo}
                  </span>

                  <span>
                    📞 {m.telefono}
                  </span>

                  <span className={styles.periodo}>
                    📅{" "}
                    {new Date(m.periodoInicio).toLocaleDateString()}{" "}
                    {m.periodoFin &&
                      `- ${new Date(m.periodoFin).toLocaleDateString()}`}
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
