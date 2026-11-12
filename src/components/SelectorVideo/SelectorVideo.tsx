"use client";

import styles from "./SelectorVideo.module.css";
import { textoDuracion, textoTamano, type SelectorVideoState } from "@/hooks/useSelectorVideo";
import { EXTENSIONES_VIDEO } from "@/lib/constantesArchivos";

interface Props {
  selector: SelectorVideoState;
  /** id del campo de archivo, para asociarle una etiqueta externa */
  idEntrada: string;
}

/** Video de la publicación en el formulario del panel: subir, ver el avance, quitar. */
export default function SelectorVideo({ selector, idEntrada }: Readonly<Props>) {
  const { video, subida, error, espacio, elegir, cancelarSubida, quitar } = selector;

  const entrada = (texto: string) => (
    <label className={styles.elegir}>
      <span aria-hidden="true">🎬</span> {texto}
      <input
        id={idEntrada}
        type="file"
        accept={["video/*", ...EXTENSIONES_VIDEO].join(",")}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) elegir(archivo);
          e.target.value = "";
        }}
      />
    </label>
  );

  let contenido;
  if (subida) {
    contenido = (
      <div className={styles.caja}>
        <p className={styles.estado}>
          Subiendo <strong>{subida.nombre}</strong>… {subida.porcentaje}%
        </p>
        <progress className={styles.barra} max={100} value={subida.porcentaje} aria-label="Avance de la subida" />
        <p className={styles.nota}>No cierres esta ventana hasta que termine.</p>
        <button type="button" className={styles.secundario} onClick={cancelarSubida}>
          Cancelar subida
        </button>
      </div>
    );
  } else if (!video) {
    contenido = entrada("Agregar video");
  } else if (video.estado === "LISTO" && video.url) {
    contenido = (
      <div className={styles.caja}>
        <video
          className={styles.vista}
          src={video.url}
          poster={video.poster ?? undefined}
          controls
          preload="metadata"
          playsInline
        />
        <p className={styles.estado}>
          ✅ Video listo{video.duracion ? ` · ${textoDuracion(video.duracion)} min` : ""}
          {video.bytes ? ` · ${textoTamano(video.bytes)}` : ""}
          {video.bytes && video.bytes_original > video.bytes ? (
            <span className={styles.ahorro}> (el original pesaba {textoTamano(video.bytes_original)})</span>
          ) : null}
        </p>
        <div className={styles.acciones}>
          {entrada("Cambiar video")}
          <button type="button" className={styles.quitar} onClick={quitar}>
            ✕ Quitar video
          </button>
        </div>
      </div>
    );
  } else if (video.estado === "ERROR") {
    contenido = (
      <div className={`${styles.caja} ${styles.cajaError}`}>
        <p className={styles.estado} role="alert">
          ⚠️ {video.error ?? "No se pudo preparar el video."}
        </p>
        <div className={styles.acciones}>
          {entrada("Elegir otro video")}
          <button type="button" className={styles.quitar} onClick={quitar}>
            ✕ Quitar
          </button>
        </div>
      </div>
    );
  } else {
    contenido = (
      <div className={styles.caja}>
        <p className={styles.estado} role="status">
          ⏳ Preparando el video para la web… {video.estado === "PROCESANDO" ? `${video.progreso}%` : "(en espera)"}
        </p>
        <progress
          className={styles.barra}
          max={100}
          value={video.estado === "PROCESANDO" ? video.progreso : undefined}
          aria-label="Avance de la compresión"
        />
        <p className={styles.nota}>
          Ya puedes guardar. El video aparecerá en la página apenas termine (unos minutos).
        </p>
        <button type="button" className={styles.quitar} onClick={quitar}>
          ✕ Quitar video
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {contenido}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.hint}>
        💡 Un video por publicación, de hasta <strong>10 minutos</strong> y <strong>1 GB</strong>. El servidor lo
        comprime solo para que cargue rápido y ocupe poco, sin que se note la diferencia.
        {espacio && (
          <>
            {" "}
            Espacio para videos: {textoTamano(espacio.usados)} usados de {textoTamano(espacio.cuota)}.
          </>
        )}
      </div>
    </div>
  );
}
