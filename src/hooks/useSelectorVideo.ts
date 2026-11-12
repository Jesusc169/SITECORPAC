"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EXTENSIONES_VIDEO, MAX_VIDEO_BYTES } from "@/lib/constantesArchivos";

export type EstadoVideo = "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";

export interface InfoVideo {
  id: number;
  estado: EstadoVideo;
  progreso: number;
  url: string | null;
  poster: string | null;
  bytes: number | null;
  bytes_original: number;
  duracion: number | null;
  error: string | null;
  nombre_original: string;
}

export interface Espacio {
  usados: number;
  cuota: number;
  disponible: number;
}

const API = "/api/administrador/videos";

export function textoTamano(bytes: number): string {
  const gb = 1024 ** 3;
  if (bytes >= gb) return (bytes / gb).toFixed(1).replace(".0", "").replace(".", ",") + " GB";
  return Math.max(1, Math.round(bytes / 1024 ** 2)) + " MB";
}

export function textoDuracion(segundos: number | null): string {
  if (!segundos) return "";
  const m = Math.floor(segundos / 60);
  const s = String(segundos % 60).padStart(2, "0");
  return `${m}:${s}`;
}

async function leerError(r: Response | XMLHttpRequest, porDefecto: string): Promise<string> {
  try {
    const texto = r instanceof XMLHttpRequest ? r.responseText : await r.text();
    const json = JSON.parse(texto);
    return json.error || json.message || porDefecto;
  } catch {
    return porDefecto;
  }
}

/**
 * Estado del video de una noticia / feria / sorteo en el formulario del panel.
 *
 * El video se sube apenas se elige (con barra de progreso) y el servidor lo
 * comprime solo; al guardar el formulario se manda solo su número (videoId).
 */
export function useSelectorVideo() {
  const [video, setVideo] = useState<InfoVideo | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [quitado, setQuitado] = useState(false);
  const [subida, setSubida] = useState<{ nombre: string; porcentaje: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const cargarEspacio = useCallback(() => {
    fetch(API)
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => e && setEspacio(e))
      .catch(() => {});
  }, []);

  /** Al abrir el formulario: el video que ya tenía la publicación (o ninguno). */
  const resetear = useCallback(
    (inicial: InfoVideo | null | undefined) => {
      xhrRef.current?.abort();
      xhrRef.current = null;
      setVideo(inicial ?? null);
      setEsNuevo(false);
      setQuitado(false);
      setSubida(null);
      setError(null);
      cargarEspacio();
    },
    [cargarEspacio]
  );

  // Mientras el servidor lo comprime, se consulta cada 4 segundos
  const id = video?.id;
  const enCurso = video?.estado === "PENDIENTE" || video?.estado === "PROCESANDO";
  useEffect(() => {
    if (!id || !enCurso) return;
    const reloj = setInterval(() => {
      fetch(`${API}/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((v: InfoVideo | null) => v && setVideo((actual) => (actual?.id === v.id ? v : actual)))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(reloj);
  }, [id, enCurso]);

  const elegir = (archivo: File) => {
    setError(null);
    const nombre = archivo.name.toLowerCase();
    if (!EXTENSIONES_VIDEO.some((ext) => nombre.endsWith(ext))) {
      setError("Ese archivo no es un video. Usa un video MP4 o MOV (los que graba el celular).");
      return;
    }
    if (archivo.size > MAX_VIDEO_BYTES) {
      setError(
        `El video pesa ${textoTamano(archivo.size)} y el máximo es 1 GB. Graba en 1080p (no en 4K) o recórtalo en el celular.`
      );
      return;
    }
    if (espacio && archivo.size > espacio.disponible) {
      setError("No queda espacio para videos en el servidor. Avisa al encargado de la página.");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    setSubida({ nombre: archivo.name, porcentaje: 0 });
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setSubida({ nombre: archivo.name, porcentaje: Math.min(99, Math.floor((e.loaded / e.total) * 100)) });
      }
    };
    xhr.onload = async () => {
      xhrRef.current = null;
      setSubida(null);
      if (xhr.status === 201) {
        const nuevo = JSON.parse(xhr.responseText);
        setVideo({
          id: nuevo.id,
          estado: nuevo.estado,
          progreso: 0,
          url: null,
          poster: null,
          bytes: null,
          bytes_original: nuevo.bytes_original,
          duracion: null,
          error: null,
          nombre_original: nuevo.nombre_original,
        });
        setEsNuevo(true);
        setQuitado(false);
        cargarEspacio();
      } else {
        setError(await leerError(xhr, "No se pudo subir el video. Vuelve a intentarlo."));
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setSubida(null);
      setError("Se cortó la conexión mientras subía el video. Revisa tu internet y vuelve a intentarlo.");
    };
    xhr.open("POST", API);
    xhr.setRequestHeader("X-Nombre-Archivo", encodeURIComponent(archivo.name));
    xhr.setRequestHeader("Content-Type", archivo.type || "application/octet-stream");
    xhr.send(archivo);
  };

  const cancelarSubida = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setSubida(null);
  };

  const quitar = () => {
    setVideo(null);
    setEsNuevo(false);
    setQuitado(true);
    setError(null);
  };

  /** Agrega al formulario lo que haya que cambiar del video. */
  const aplicarAFormData = (fd: FormData) => {
    if (video && esNuevo) fd.append("videoId", String(video.id));
    else if (!video && quitado) fd.append("quitarVideo", "1");
  };

  return {
    video,
    subida,
    error,
    espacio,
    /** true mientras se sube: no se puede guardar todavía */
    ocupado: subida !== null,
    resetear,
    elegir,
    cancelarSubida,
    quitar,
    aplicarAFormData,
  };
}

export type SelectorVideoState = ReturnType<typeof useSelectorVideo>;
