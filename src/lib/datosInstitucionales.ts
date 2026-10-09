/**
 * Datos legales del sindicato (según su ficha RUC). Fuente única para las
 * páginas legales y el footer: si cambia el domicilio o el correo de
 * contacto, se corrige aquí y se actualiza en todo el sitio.
 */
export const INSTITUCION = {
  razonSocial:
    "Sindicato Nacional Unificado de Trabajadores de CORPAC - SITE CORPAC",
  nombreCorto: "SITECORPAC",
  ruc: "20601511836",
  // Transcrito tal cual figura en la ficha RUC (no reinterpretar "SC NORTE").
  domicilio:
    "Av. Elmer Faucett SC Norte, Loc. Aeropuerto J, Lote 001, Mz. T, Callao - Callao - Provincia Constitucional del Callao",
  correo: "sitecorpac@corpac.pe",
  telefono: "+51 950 215 616",
  sitio: "https://sitecorpac.com",
} as const;

/** Fecha de la última revisión de los textos legales (mostrar en cada página). */
export const FECHA_POLITICAS = "8 de octubre de 2026";
