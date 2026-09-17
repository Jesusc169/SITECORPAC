// Lógica compartida por noticias, ferias y sorteos para decidir, al crear o
// editar, qué imagen queda como "principal" (portada/carrusel) y cómo se
// renumera el orden de las que sobreviven, dado que el admin puede combinar
// en el mismo guardado: borrar fotos existentes, subir fotos nuevas y elegir
// la principal entre cualquiera de las dos.

export interface ImagenGaleriaExistente {
  id: number;
  orden: number;
}

export interface ResolverGaleriaInput {
  existentes: ImagenGaleriaExistente[];
  idsEliminar: number[];
  cantidadNuevas: number;
  principalExistenteId: number | null;
  principalNuevaIndex: number | null;
}

export interface ResolverGaleriaResultado {
  supervivientes: { id: number; orden: number }[];
  nuevas: { orden: number }[];
  principal: { tipo: "existente"; id: number } | { tipo: "nueva"; indice: number } | null;
}

export const MAX_IMAGENES_GALERIA = 5;

export function resolverGaleria(input: ResolverGaleriaInput): ResolverGaleriaResultado {
  const supervivientesBase = input.existentes
    .filter((img) => !input.idsEliminar.includes(img.id))
    .sort((a, b) => a.orden - b.orden);

  const supervivientes = supervivientesBase.map((img, i) => ({ id: img.id, orden: i + 1 }));

  const nuevas = Array.from({ length: input.cantidadNuevas }, (_, i) => ({
    orden: supervivientes.length + i + 1,
  }));

  let principal: ResolverGaleriaResultado["principal"] = null;

  if (
    input.principalNuevaIndex !== null &&
    input.principalNuevaIndex >= 0 &&
    input.principalNuevaIndex < input.cantidadNuevas
  ) {
    principal = { tipo: "nueva", indice: input.principalNuevaIndex };
  } else if (
    input.principalExistenteId !== null &&
    supervivientes.some((img) => img.id === input.principalExistenteId)
  ) {
    principal = { tipo: "existente", id: input.principalExistenteId };
  } else if (supervivientes.length > 0) {
    principal = { tipo: "existente", id: supervivientes[0].id };
  } else if (input.cantidadNuevas > 0) {
    principal = { tipo: "nueva", indice: 0 };
  }

  return { supervivientes, nuevas, principal };
}

export function espacioDisponibleGaleria(activasActuales: number, maxTotal = MAX_IMAGENES_GALERIA): number {
  return Math.max(0, maxTotal - activasActuales);
}
