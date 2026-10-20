"use client";

import { useEffect, useState } from "react";
import EncabezadoPagina from "@/components/Sitio/EncabezadoPagina";
import Icono from "@/components/Icono/Icono";
import { formatearFechaSola } from "@/lib/fechas";
import { rutaPublica } from "@/lib/rutas";
import s from "@/styles/Sitio.module.css";

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

// Los tres primeros cargos (Secretaría General, Subsecretaría y
// Organización) van destacados arriba, como en la propuesta A+C.
const DESTACADOS = 3;

function fechaLarga(fecha: string) {
  return formatearFechaSola(fecha, { day: "numeric", month: "long", year: "numeric" });
}

function Persona({ m, grande }: Readonly<{ m: Miembro; grande: boolean }>) {
  const telefono = m.telefono?.replace(/\s+/g, "");
  return (
    <article className={`${s.persona} ${grande ? s.personaBig : ""}`}>
      {m.foto ? (
        <img
          className={s.foto}
          src={rutaPublica(m.foto)}
          alt={`Foto de ${m.nombre}`}
          loading={grande ? "eager" : "lazy"}
        />
      ) : (
        <span className={s.foto} role="img" aria-label={`Sin foto de ${m.nombre}`}>
          <Icono nombre="usuario" />
        </span>
      )}
      <h3>{m.nombre}</h3>
      <p className={s.role}>{m.cargo}</p>
      {m.email && (
        <a href={`mailto:${m.email}`}>
          <Icono nombre="correo" chico />
          {m.email}
        </a>
      )}
      {telefono && (
        <a href={`tel:+51${telefono}`}>
          <Icono nombre="telefono" chico />
          {m.telefono}
        </a>
      )}
    </article>
  );
}

export default function DirectorioClient() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const res = await fetch("/api/directorio", { cache: "no-store" });
        if (!res.ok) throw new Error("Error al obtener directorio");
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
    fetchMiembros();
  }, []);

  const primero = miembros[0];
  const periodo =
    primero?.fechaInicio && primero.fechaFin ? (
      <>
        Elegidos por los afiliados para el periodo{" "}
        <b>
          {fechaLarga(primero.fechaInicio)} – {fechaLarga(primero.fechaFin)}
        </b>
        . Escríbeles o llámalos directamente.
      </>
    ) : (
      "Elegidos por los afiliados. Escríbeles o llámalos directamente."
    );

  return (
    <>
      <EncabezadoPagina
        migas={[{ texto: "Quiénes somos" }, { texto: "Directorio" }]}
        rotulo="Quiénes somos"
        titulo="Directorio de representantes"
        entrada={periodo}
      />

      <section className={`${s.seccion} ${s.tight}`}>
        <div className={s.ancho}>
          {loading && <p className={s.estado}>Cargando…</p>}
          {!loading && miembros.length === 0 && <p className={s.estado}>No hay registros por mostrar.</p>}
          {!loading && miembros.length > 0 && (
            <>
              <h2 className="sr-only">Integrantes del directorio</h2>
              <div className={s.lead2}>
                {miembros.slice(0, DESTACADOS).map((m) => (
                  <Persona key={m.id} m={m} grande />
                ))}
              </div>
              <div className={s.pers}>
                {miembros.slice(DESTACADOS).map((m) => (
                  <Persona key={m.id} m={m} grande={false} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
