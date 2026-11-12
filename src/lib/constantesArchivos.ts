// Límites de archivos compartidos entre server (controllers, lib/archivos*)
// y client (SelectorImagenes, useSelectorImagenes). No importa nada de Node
// (fs, sharp) a propósito, para poder usarse también desde componentes "use
// client" sin arrastrar código de servidor al bundle del navegador.
export const MAX_IMAGEN_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENTO_BYTES = 15 * 1024 * 1024; // 15MB

// Videos (noticias, ferias y sorteos: uno por publicación). El archivo del
// celular se sube tal cual y el servidor lo comprime después (ver
// lib/videos/ffmpeg.ts), así que este límite es solo para la subida.
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GB
export const MAX_VIDEO_SEGUNDOS = 10 * 60; // 10 minutos
export const EXTENSIONES_VIDEO = [".mp4", ".mov", ".m4v", ".3gp", ".webm", ".mkv", ".avi"];
