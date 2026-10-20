// Menú del sitio público: lo usan la cabecera, el pie y la portada.
export type Grupo = { titulo: string; enlaces: { href: string; texto: string }[] };

export const MENU: Grupo[] = [
  {
    titulo: "Quiénes somos",
    enlaces: [
      { href: "/nuestra_historia", texto: "Nuestra historia" },
      { href: "/directorio", texto: "Directorio" },
    ],
  },
  {
    titulo: "Trámites",
    enlaces: [
      { href: "/tramites/prestamos", texto: "Solicitar préstamo" },
      { href: "/tramites/beneficio-fallecido", texto: "Beneficio por fallecimiento" },
    ],
  },
  {
    titulo: "Actividades",
    enlaces: [
      { href: "/actividades/ferias", texto: "Ferias" },
      { href: "/actividades/sorteos", texto: "Sorteos" },
    ],
  },
  {
    titulo: "Legislación laboral",
    enlaces: [
      { href: "/legislacion/oit", texto: "Organización Internacional del Trabajo" },
      { href: "/legislacion/constitucion", texto: "Constitución Política del Perú" },
      { href: "/legislacion/ley-relaciones", texto: "Ley de Relaciones Colectivas de Trabajo" },
      { href: "/legislacion/estatuto", texto: "Estatuto del SITECORPAC" },
      { href: "/legislacion/ley-seguridad", texto: "Ley de Seguridad y Salud en el Trabajo" },
    ],
  },
];
