export interface HistoriaEvento {
  año: string;
  descripcion: string;
}

export interface NuestraHistoriaData {
  titulo: string;
  introduccion: string;
  eventos: HistoriaEvento[];
}

export const nuestraHistoriaData: NuestraHistoriaData = {
  titulo: "Nuestra Historia",
  introduccion: `
    El SITECORPAC nació con la idea de ser un sindicato que defiende los derechos de los trabajadores sin distinción, 
    promoviendo la equidad social, la justicia laboral y la unidad dentro de CORPAC. Desde su creación, ha fungido como 
    una organización comprometida con la transparencia y el fortalecimiento del bienestar de sus afiliados.
  `,
  eventos: [
    {
      año: "1943",
      descripcion:
        "Se funda CORPAC S.A. mediante Decreto Legislativo Nº 99, iniciando sus operaciones en la gestión aeroportuaria.",
    },
    {
      año: "1965",
      descripcion:
        "Se inaugura el Aeropuerto Internacional Jorge Chávez, uno de los hitos más importantes en la historia aeroportuaria peruana.",
    },
    {
      año: "2001",
      descripcion:
        "CORPAC transfiere la administración del aeropuerto Jorge Chávez a concesionarios privados, manteniéndose responsable del control de tránsito aéreo.",
    },
    {
      año: "2006-2008",
      descripcion:
        "Se concesionan varios aeropuertos regionales a operadores privados, mientras CORPAC conserva funciones de navegación aérea.",
    },
    {
      año: "Actualidad",
      descripcion:
        "SITECORPAC sigue activo como sindicato representativo, participando en procesos de negociación colectiva, gestión de derechos laborales y fortalecimiento institucional.",
    },
  ],
};
