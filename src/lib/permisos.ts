export const PRIVILEGIOS = [
  { clave: "noticias", label: "Administrar noticias" },
  { clave: "directorio", label: "Administrar directorio" },
  { clave: "ferias", label: "Administrar ferias" },
  { clave: "sorteos", label: "Administrar sorteos" },
  { clave: "usuarios", label: "Administrar usuarios" },
] as const;

export type ClavePrivilegio = (typeof PRIVILEGIOS)[number]["clave"];

export interface UsuarioConPermisos {
  rol: string;
  permisos: unknown;
}

/**
 * true si el usuario puede usar esa sección del panel.
 * "administrador" siempre tiene acceso total, sin importar
 * lo que tenga guardado en `permisos`.
 */
export function tienePermiso(
  usuario: UsuarioConPermisos | null | undefined,
  clave: ClavePrivilegio
): boolean {
  if (!usuario) return false;
  if (usuario.rol === "administrador") return true;

  const permisos = Array.isArray(usuario.permisos)
    ? (usuario.permisos as string[])
    : [];

  return permisos.includes(clave);
}
