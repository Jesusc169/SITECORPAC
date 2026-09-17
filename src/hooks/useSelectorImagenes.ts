"use client";

import { useMemo, useState } from "react";

export const MAX_FOTOS = 5;

export interface ImagenExistente {
  id: number;
  url: string;
}

export type PrincipalRef =
  | { tipo: "existente"; id: number }
  | { tipo: "nueva"; index: number };

// Estado + lógica del selector de "hasta 5 fotos, una principal" que
// comparten los modales de crear/editar noticia, feria y sorteo.
export function useSelectorImagenes(imagenesIniciales: ImagenExistente[] = []) {
  const [existentes, setExistentes] = useState<ImagenExistente[]>(imagenesIniciales);
  const [eliminarIds, setEliminarIds] = useState<number[]>([]);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [principal, setPrincipal] = useState<PrincipalRef | null>(null);

  const activas = useMemo(
    () => existentes.filter((e) => !eliminarIds.includes(e.id)),
    [existentes, eliminarIds]
  );
  const total = activas.length + nuevas.length;

  // Si nadie eligió explícitamente, la primera foto activa hace de principal.
  const principalEfectivo: PrincipalRef | null = useMemo(() => {
    if (principal) {
      if (principal.tipo === "existente" && activas.some((a) => a.id === principal.id)) {
        return principal;
      }
      if (principal.tipo === "nueva" && principal.index < nuevas.length) {
        return principal;
      }
    }
    if (activas.length > 0) return { tipo: "existente", id: activas[0].id };
    if (nuevas.length > 0) return { tipo: "nueva", index: 0 };
    return null;
  }, [principal, activas, nuevas]);

  function resetear(imagenes: ImagenExistente[] = []) {
    setExistentes(imagenes);
    setEliminarIds([]);
    setNuevas([]);
    setPrincipal(null);
  }

  function agregar(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const espacio = MAX_FOTOS - total;
    if (espacio <= 0) {
      alert(`Ya tienes ${MAX_FOTOS} fotos, el máximo permitido.`);
      return;
    }

    const aAgregar = arr.slice(0, espacio);
    if (arr.length > espacio) {
      alert(`Solo se agregaron ${aAgregar.length} foto(s); el máximo es ${MAX_FOTOS} en total.`);
    }
    setNuevas((prev) => [...prev, ...aAgregar]);
  }

  function quitarExistente(id: number) {
    setEliminarIds((prev) => [...prev, id]);
  }

  function quitarNueva(index: number) {
    setNuevas((prev) => prev.filter((_, i) => i !== index));
    setPrincipal((prev) => {
      if (!prev || prev.tipo !== "nueva") return prev;
      if (prev.index === index) return null;
      if (prev.index > index) return { tipo: "nueva", index: prev.index - 1 };
      return prev;
    });
  }

  function marcarPrincipalExistente(id: number) {
    setPrincipal({ tipo: "existente", id });
  }

  function marcarPrincipalNueva(index: number) {
    setPrincipal({ tipo: "nueva", index });
  }

  function aplicarAFormData(
    fd: FormData,
    campos: {
      nuevas?: string;
      eliminar?: string;
      principalId?: string;
      principalIndex?: string;
    } = {}
  ) {
    const {
      nuevas: campoNuevas = "imagenes",
      eliminar: campoEliminar = "imagenesEliminar",
      principalId: campoPrincipalId = "imagenPrincipalId",
      principalIndex: campoPrincipalIndex = "imagenPrincipalNuevaIndex",
    } = campos;

    nuevas.forEach((f) => fd.append(campoNuevas, f));
    fd.append(campoEliminar, JSON.stringify(eliminarIds));

    if (principalEfectivo?.tipo === "existente") {
      fd.append(campoPrincipalId, String(principalEfectivo.id));
    }
    if (principalEfectivo?.tipo === "nueva") {
      fd.append(campoPrincipalIndex, String(principalEfectivo.index));
    }
  }

  return {
    existentes,
    activas,
    eliminarIds,
    nuevas,
    total,
    principal: principalEfectivo,
    resetear,
    agregar,
    quitarExistente,
    quitarNueva,
    marcarPrincipalExistente,
    marcarPrincipalNueva,
    aplicarAFormData,
  };
}

export type SelectorImagenesState = ReturnType<typeof useSelectorImagenes>;
