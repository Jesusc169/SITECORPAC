"use client";

import React, { useEffect, useState } from "react";
import styles from "./AdministradorNoticias.module.css";
import ModalAgregarNoticia from "./components/ModalAgregarNoticia"; // Ajusta la ruta real
import { Noticia } from "@prisma/client";

export default function AdministradorNoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Cargar noticias desde la API (controlador)
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const res = await fetch("/api/noticias");
        if (!res.ok) throw new Error("Error al cargar noticias");
        const data = await res.json();
        setNoticias(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchNoticias();
  }, []);

  // 🔹 Enviar nueva noticia
  const handleAddNoticia = async (form: { titulo: string; descripcion: string }) => {
    try {
      const res = await fetch("/api/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al agregar noticia");

      const nuevaNoticia = await res.json();
      setNoticias((prev) => [nuevaNoticia, ...prev]);
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Gestión de Noticias</h1>

      <button onClick={() => setShowModal(true)} className={styles.btnAgregar}>
        + Agregar Noticia
      </button>

      <div className={styles.listaNoticias}>
        {noticias.length === 0 ? (
          <p>No hay noticias registradas.</p>
        ) : (
          noticias.map((noticia) => (
            <div key={noticia.id} className={styles.noticiaCard}>
              <h3>{noticia.titulo}</h3>
              <p>{noticia.descripcion}</p>
              <span>{new Date(noticia.fecha).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ModalAgregarNoticia
          onClose={() => setShowModal(false)}
          onSubmit={handleAddNoticia}
        />
      )}
    </div>
  );
}
