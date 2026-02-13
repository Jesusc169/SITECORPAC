"use client";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={`navbar navbar-expand-lg ${styles.navbarCustom}`}>
      <div className="container-fluid">
        {/* Botón para móvil */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú principal */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className={`navbar-nav w-100 ${styles.navbarList}`}>

            {/* 🔹 Inicio */}
            <li className="nav-item">
              <Link className={`nav-link ${styles.navLink}`} href="/">
                Inicio
              </Link>
            </li>

            {/* 🔹 Quiénes somos */}
            <li className={`nav-item dropdown ${styles.dropdownHover}`}>
              <a className={`nav-link ${styles.navLink}`} href="#">
                Quiénes somos
              </a>
              <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/nuestra_historia"
                  >
                    Nuestra historia
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/directorio"
                  >
                    Directorio
                  </Link>
                </li>
              </ul>
            </li>

            {/* 🔹 Trámites */}
            <li className={`nav-item dropdown ${styles.dropdownHover}`}>
              <a className={`nav-link ${styles.navLink}`} href="#">
                Trámites
              </a>
              <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/tramites/prestamos"
                  >
                    Solicitar préstamo
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/tramites/beneficio-fallecido"
                  >
                    Beneficio por fallecido
                  </Link>
                </li>
              </ul>
            </li>

            {/* 🔹 Actividades */}
            <li className={`nav-item dropdown ${styles.dropdownHover}`}>
              <a className={`nav-link ${styles.navLink}`} href="#">
                Actividades
              </a>
              <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/actividades/ferias"
                  >
                    Ferias
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/actividades/sorteos"
                  >
                    Sorteos
                  </Link>
                </li>
              </ul>
            </li>

            {/* 🔹 Legislación laboral */}
            <li className={`nav-item dropdown ${styles.dropdownHover}`}>
              <a className={`nav-link ${styles.navLink}`} href="#">
                Legislación laboral
              </a>
              <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/legislacion/oit"
                  >
                    Organización Internacional del Trabajo
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/legislacion/constitucion"
                  >
                    Constitución política del Perú
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/legislacion/ley-relaciones"
                  >
                    Ley de relaciones colectivas de trabajo
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/legislacion/estatuto"
                  >
                    Estatuto del SITECORPAC
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item ${styles.dropdownItem}`}
                    href="/legislacion/ley-seguridad"
                  >
                    Ley de Seguridad y Salud en el Trabajo
                  </Link>
                </li>
              </ul>
            </li>

            {/* 🔹 Noticias */}
            <li className="nav-item">
              <Link className={`nav-link ${styles.navLink}`} href="/noticias">
                Noticias
              </Link>
            </li>

            {/* 🔹 Login */}
            <li className="nav-item">
              <Link className={`nav-link ${styles.navLink}`} href="/login">
                Login
              </Link>
            </li>

            {/* 🔹 Únete al SITE (botón que abre WhatsApp) */}
            <li className="nav-item">
              <a
                className={`btn btn-primary ${styles.btnUnete}`}
                href="https://wa.me/51950215616?text=Hola,%20quiero%20unirme%20al%20SITECORPAC"
                target="_blank"
                rel="noopener noreferrer"
              >
                Únete al SITE
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
