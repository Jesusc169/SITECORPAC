import styles from "./Video.module.css";
import type { VideoPublico } from "@/lib/videos/vincular";

interface Props {
  video: VideoPublico;
  titulo: string;
  autoPlay?: boolean;
}

/**
 * Reproductor del sitio público. preload="none": el video no se descarga
 * hasta que la persona le da play (solo se ve la imagen de portada), así la
 * página carga igual de rápido con datos móviles.
 */
export default function ReproductorVideo({ video, titulo, autoPlay = false }: Readonly<Props>) {
  const vertical = (video.alto ?? 0) > (video.ancho ?? 0);
  return (
    <video
      className={`${styles.reproductor} ${vertical ? styles.vertical : ""}`}
      src={video.url}
      poster={video.poster ?? undefined}
      width={video.ancho ?? undefined}
      height={video.alto ?? undefined}
      controls
      playsInline
      preload={autoPlay ? "auto" : "none"}
      autoPlay={autoPlay}
      aria-label={`Video: ${titulo}`}
    >
      Tu navegador no puede reproducir este video. <a href={video.url}>Descárgalo aquí</a>.
    </video>
  );
}
