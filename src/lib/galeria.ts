/**
 * Edición de la galería de fotos (hasta 5, una principal), igual para
 * noticias, ferias y sorteos. Antes cada controlador repetía esta lógica:
 * validar, borrar las quitadas (archivo y fila), renumerar las que quedan,
 * guardar las nuevas y marcar la principal.
 */
import { resolverGaleria, MAX_IMAGENES_GALERIA } from "@/lib/resolverGaleria";

export interface ImagenExistente {
  id: number;
  url: string;
  orden: number;
}

export interface CambiosGaleria {
  existentes: ImagenExistente[];
  imagenesNuevas: File[];
  imagenesEliminar: number[];
  imagenPrincipalId: number | null;
  imagenPrincipalNuevaIndex: number | null;
}

/** Lo que cambia entre noticias, ferias y sorteos: textos, archivos y tablas. */
export interface OperacionesGaleria {
  /** "noticia", "feria" o "sorteo" (para el mensaje de límite) */
  etiqueta: string;
  /** Lanza el error de validación del módulo */
  error: (mensaje: string) => Error;
  /** Revisa cada foto nueva antes de tocar nada (lanza si no sirve) */
  validarArchivo: (file: File) => void;
  borrarArchivo: (url: string) => Promise<void>;
  guardarArchivo: (file: File, indice: number) => Promise<string>;
  eliminarImagenes: (ids: number[]) => Promise<unknown>;
  reordenarImagen: (id: number, orden: number) => Promise<unknown>;
  crearImagen: (url: string, orden: number) => Promise<{ id: number }>;
  marcarPrincipal: (id: number) => Promise<{ url: string }>;
}

/**
 * Aplica los cambios y devuelve la URL de la foto principal (o null si la
 * galería quedó vacía). Primero valida; recién después borra o guarda.
 */
export async function actualizarGaleria(c: CambiosGaleria, ops: OperacionesGaleria): Promise<string | null> {
  const nuevas = c.imagenesNuevas.filter((f) => f && f.size > 0);
  const quitar = c.existentes.filter((e) => c.imagenesEliminar.includes(e.id));

  if (c.existentes.length - quitar.length + nuevas.length > MAX_IMAGENES_GALERIA) {
    throw ops.error(`Máximo ${MAX_IMAGENES_GALERIA} fotos por ${ops.etiqueta}`);
  }
  nuevas.forEach(ops.validarArchivo);

  const plan = resolverGaleria({
    existentes: c.existentes,
    idsEliminar: quitar.map((e) => e.id),
    cantidadNuevas: nuevas.length,
    principalExistenteId: c.imagenPrincipalId,
    principalNuevaIndex: c.imagenPrincipalNuevaIndex,
  });

  for (const img of quitar) await ops.borrarArchivo(img.url);
  if (quitar.length > 0) await ops.eliminarImagenes(quitar.map((e) => e.id));

  const ordenAnterior = new Map(c.existentes.map((e) => [e.id, e.orden]));
  for (const sup of plan.supervivientes) {
    if (ordenAnterior.get(sup.id) !== sup.orden) await ops.reordenarImagen(sup.id, sup.orden);
  }

  const idsNuevas: number[] = [];
  for (let i = 0; i < nuevas.length; i++) {
    const url = await ops.guardarArchivo(nuevas[i], i);
    idsNuevas.push((await ops.crearImagen(url, plan.nuevas[i].orden)).id);
  }

  // resolverGaleria garantiza que la principal existe: una que queda o una nueva
  const principal = plan.principal;
  if (!principal) return null;
  const idPrincipal = principal.tipo === "existente" ? principal.id : idsNuevas[principal.indice];
  return (await ops.marcarPrincipal(idPrincipal)).url;
}
