import { rutaPublica } from "@/lib/rutas";
import s from "@/styles/Sitio.module.css";

/**
 * Imagen completa (sin recortar) sobre un fondo desenfocado de sí misma.
 * Las secretarias suben afiches con texto: con object-fit: cover se cortaban
 * los bordes; así se ve el afiche entero en cualquier proporción.
 */
export default function Afiche({
  src,
  alt,
  className = "",
  prioridad = false,
}: Readonly<{ src?: string | null; alt: string; className?: string; prioridad?: boolean }>) {
  const url = src?.trim() ? rutaPublica(src) : null;
  return (
    <div className={`${s.media} ${className}`}>
      {url ? (
        <>
          <img className={s.bg} src={url} alt="" loading={prioridad ? "eager" : "lazy"} />
          <img className={s.fg} src={url} alt={alt} loading={prioridad ? "eager" : "lazy"} />
        </>
      ) : (
        <div className={`${s.fg} ${s.mediaVacia}`} role="img" aria-label={alt}>
          SITECORPAC
        </div>
      )}
    </div>
  );
}
