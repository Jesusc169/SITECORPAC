// Límites de archivos compartidos entre server (controllers, lib/archivos*)
// y client (SelectorImagenes, useSelectorImagenes). No importa nada de Node
// (fs, sharp) a propósito, para poder usarse también desde componentes "use
// client" sin arrastrar código de servidor al bundle del navegador.
export const MAX_IMAGEN_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENTO_BYTES = 15 * 1024 * 1024; // 15MB
