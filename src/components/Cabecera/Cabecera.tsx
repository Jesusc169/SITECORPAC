"use client";

// Cabecera única del rediseño A+C: franja con los colores del logo + una
// sola barra fija (logo, menú, "Iniciar sesión" y "Únete al SITE"). Antes
// eran dos bloques (Cabecera + Navbar) que ocupaban 232px en computadora.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icono from "@/components/Icono/Icono";
import { ENLACES } from "@/lib/datosInstitucionales";
import s from "@/styles/Sitio.module.css";
import { MENU, type Grupo } from "./menu";

export default function Cabecera() {
  const ruta = usePathname() ?? "/";
  const [abierto, setAbierto] = useState<string | null>(null);
  const [movil, setMovil] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Al navegar se cierran los menús.
  useEffect(() => {
    setAbierto(null);
    setMovil(false);
  }, [ruta]);

  // Clic fuera o Escape cierran el submenú abierto.
  useEffect(() => {
    if (!abierto && !movil) return;
    const alClic = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAbierto(null);
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(null);
        setMovil(false);
      }
    };
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto, movil]);

  const activo = (href: string) => ruta === href || ruta.startsWith(href + "/");
  const grupoActivo = (g: Grupo) => g.enlaces.some((e) => activo(e.href));

  return (
    <>
      {/* Primer elemento enfocable de cada página pública. */}
      <a href="#contenido" className="saltar-contenido">
        Saltar al contenido principal
      </a>
      <div className={s.strip} />
      <header className={s.top}>
        <div className={`${s.ancho} ${s.bar}`}>
          <Link className={s.brand} href="/" aria-label="SITECORPAC, ir al inicio">
            <img src="/logo_site.jpg" alt="" width={52} height={52} />
            <span>
              <span className={s.bname}>SITECORPAC</span>
              <span className={s.bsub}>Sindicato Nacional Unificado de Trabajadores de CORPAC</span>
            </span>
          </Link>

          <nav className={s.navMain} aria-label="Menú principal" ref={navRef}>
            <ul>
              {MENU.map((g) => {
                const id = `menu-${g.titulo.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <li key={g.titulo}>
                    <button
                      type="button"
                      className={`${s.navLink} ${s.dd} ${grupoActivo(g) ? s.on : ""}`}
                      aria-expanded={abierto === g.titulo}
                      aria-controls={id}
                      onClick={() => setAbierto(abierto === g.titulo ? null : g.titulo)}
                    >
                      {g.titulo}
                    </button>
                    {abierto === g.titulo && (
                      <div className={s.menu} id={id}>
                        {g.enlaces.map((e) => (
                          <Link
                            key={e.href}
                            href={e.href}
                            className={activo(e.href) ? s.on : ""}
                            aria-current={activo(e.href) ? "page" : undefined}
                          >
                            {e.texto}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
              <li>
                <Link
                  href="/noticias"
                  className={`${s.navLink} ${activo("/noticias") || activo("/actividades/noticias") ? s.on : ""}`}
                  aria-current={ruta === "/noticias" ? "page" : undefined}
                >
                  Noticias
                </Link>
              </li>
            </ul>
          </nav>

          <Link className={s.login} href="/login">
            <Icono nombre="usuario" chico />
            Iniciar sesión
          </Link>
          <a className={s.cta} href={ENLACES.whatsappUnete} target="_blank" rel="noopener noreferrer">
            <Icono nombre="chat" chico />
            Únete al SITE
            <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
          </a>

          <button
            type="button"
            className={s.burger}
            aria-expanded={movil}
            aria-controls="menu-movil"
            aria-label={movil ? "Cerrar el menú" : "Abrir el menú"}
            onClick={() => setMovil(!movil)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>

        {movil && (
          <nav className={s.panelMovil} id="menu-movil" aria-label="Menú principal (celular)">
            <Link href="/">Inicio</Link>
            {MENU.map((g) => (
              <div key={g.titulo}>
                <h2>{g.titulo}</h2>
                {g.enlaces.map((e) => (
                  <Link key={e.href} href={e.href} aria-current={activo(e.href) ? "page" : undefined}>
                    {e.texto}
                  </Link>
                ))}
              </div>
            ))}
            <h2>Más</h2>
            <Link href="/noticias">Noticias</Link>
            <Link href="/login">Iniciar sesión</Link>
            <a className={s.cta} href={ENLACES.whatsappUnete} target="_blank" rel="noopener noreferrer">
              <Icono nombre="chat" chico />
              Únete al SITE
              <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
            </a>
          </nav>
        )}
      </header>
    </>
  );
}
