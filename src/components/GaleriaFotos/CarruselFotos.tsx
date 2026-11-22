"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Lightbox from "./Lightbox";
import Icono from "@/components/Icono/Icono";
import { rutaPublica } from "@/lib/rutas";
import s from "./CarruselFotos.module.css";

const INTERVALO_MS = 5000;
const MIN_DESLIZAR_PX = 40;
const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(avisar: () => void) {
  const mq = globalThis.matchMedia?.(CONSULTA_MOVIMIENTO);
  mq?.addEventListener("change", avisar);
  return () => mq?.removeEventListener("change", avisar);
}
const pideMenosMovimiento = () => globalThis.matchMedia?.(CONSULTA_MOVIMIENTO).matches ?? false;

interface Props {
  imagenes: string[];
  titulo: string;
  intervalo?: number;
  /** "articulo" (noticia, 3/2) o "tarjeta" (ferias y sorteos, vertical 4/5). */
  variante?: "articulo" | "tarjeta";
}

/**
 * Carrusel de fotos para noticias y para las tarjetas de ferias y sorteos:
 * gira solo cada 5 s (primero la foto principal). Accesible:
 * - botón visible "Pausar / Reanudar" (WCAG 2.2.2);
 * - se detiene con el mouse encima o con el foco del teclado dentro;
 * - no gira solo si el equipo pide reducir el movimiento;
 * - no gira mientras está fuera de la pantalla (varias tarjetas por página);
 * - flechas, puntos, deslizar con el dedo y clic para ver en grande.
 */
export default function CarruselFotos({
  imagenes,
  titulo,
  intervalo = INTERVALO_MS,
  variante = "articulo",
}: Readonly<Props>) {
  const total = imagenes.length;
  const [actual, setActual] = useState(0);
  // null = la persona aún no tocó Pausar/Reanudar: se sigue la preferencia
  // del equipo (reducir movimiento => empieza en pausa).
  const [pausaElegida, setPausado] = useState<boolean | null>(null);
  const menosMovimiento = useSyncExternalStore(suscribirMovimiento, pideMenosMovimiento, () => false);
  const pausado = pausaElegida ?? menosMovimiento;
  const [encima, setEncima] = useState(false);
  const [conFoco, setConFoco] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const inicioX = useRef<number | null>(null);
  const deslizo = useRef(false);
  const raiz = useRef<HTMLElement>(null);
  const [enPantalla, setEnPantalla] = useState(true);

  // Pausa el giro mientras el carrusel no se ve (sin soporte, gira siempre).
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // autoGiro: la persona no lo detuvo. Salir de pantalla solo frena el reloj,
  // sin cambiar lo que anuncia el lector de pantalla.
  const autoGiro = total > 1 && !pausado && !encima && !conFoco && abierta === null;
  const girando = autoGiro && enPantalla;
  // En las tarjetas (varias por página) ninguna foto se carga de inmediato.
  const cargaPrimera = variante === "articulo" ? "eager" : "lazy";

  // "actual" en las dependencias: si la persona cambia de foto, el reloj
  // vuelve a empezar y no salta enseguida a la siguiente.
  useEffect(() => {
    if (!girando) return;
    const id = setTimeout(() => {
      if (!document.hidden) setActual((i) => (i + 1) % total);
    }, intervalo);
    return () => clearTimeout(id);
  }, [girando, total, intervalo, actual]);

  const ir = (i: number) => setActual(((i % total) + total) % total);
  const deTitulo = ` de ${titulo}`;

  return (
    <section
      ref={raiz}
      className={variante === "tarjeta" ? `${s.carrusel} ${s.tarjeta}` : s.carrusel}
      aria-roledescription="carrusel"
      aria-label={`Fotos${deTitulo}`}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={(e) => {
        // Solo el foco de teclado detiene el giro: un toque en el celular
        // deja el foco en el botón y lo dejaría quieto para siempre.
        if ((e.target as HTMLElement).matches(":focus-visible")) setConFoco(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setConFoco(false);
      }}
    >
      <div
        className={s.marco}
        onPointerDown={(e) => {
          inicioX.current = e.clientX;
          deslizo.current = false;
        }}
        onPointerUp={(e) => {
          if (inicioX.current === null) return;
          const dx = e.clientX - inicioX.current;
          inicioX.current = null;
          if (total > 1 && Math.abs(dx) >= MIN_DESLIZAR_PX) {
            deslizo.current = true;
            ir(dx < 0 ? actual + 1 : actual - 1);
          }
        }}
      >
        {imagenes.map((url, i) => {
          const src = rutaPublica(url);
          const visible = i === actual;
          return (
            <div
              key={`${i}-${url}`}
              className={`${s.diapositiva} ${visible ? s.activa : ""}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}`}
              inert={!visible}
            >
              <img className={s.fondo} src={src} alt="" loading={i === 0 ? cargaPrimera : "lazy"} />
              <button
                type="button"
                className={s.ampliar}
                onClick={() => {
                  if (deslizo.current) {
                    deslizo.current = false;
                    return;
                  }
                  setAbierta(i);
                }}
                aria-label={`Ampliar foto ${i + 1} de ${total}${deTitulo}`}
              >
                <img src={src} alt="" loading={i === 0 ? cargaPrimera : "lazy"} draggable={false} />
              </button>
            </div>
          );
        })}

        {total > 1 && (
          <>
            <button type="button" className={`${s.flecha} ${s.izq}`} onClick={() => ir(actual - 1)} aria-label="Foto anterior">
              <Icono nombre="flecha" />
            </button>
            <button type="button" className={`${s.flecha} ${s.der}`} onClick={() => ir(actual + 1)} aria-label="Foto siguiente">
              <Icono nombre="flecha" />
            </button>
            <span className={s.contador} aria-hidden="true">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className={s.controles}>
          <button type="button" className={s.pausa} onClick={() => setPausado(!pausado)}>
            <span aria-hidden="true">{pausado ? "▶" : "❚❚"}</span>
            {pausado ? "Reanudar" : "Pausar"}
            <span className="sr-only"> el carrusel de fotos</span>
          </button>
          <div className={s.puntos}>
            {imagenes.map((url, i) => (
              <button
                key={`p-${i}-${url}`}
                type="button"
                className={s.punto}
                onClick={() => ir(i)}
                aria-label={`Ir a la foto ${i + 1}`}
                aria-current={i === actual ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Anuncia el cambio solo si la persona lo provocó (no cada 5 s). */}
      <p className="sr-only" aria-live={autoGiro ? "off" : "polite"}>
        Foto {actual + 1} de {total}
      </p>

      {abierta !== null && (
        <Lightbox imagenes={imagenes} indiceInicial={abierta} titulo={titulo} onClose={() => setAbierta(null)} />
      )}
    </section>
  );
}
