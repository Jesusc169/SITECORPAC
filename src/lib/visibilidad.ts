/**
 * Lee el interruptor "Visible en el sitio web" que envían los formularios
 * del panel (noticias, ferias y sorteos) como "true"/"false".
 * Si el campo no llega (clientes antiguos, llamadas a la API sin él), el
 * registro queda visible: es el comportamiento que tenía el sistema antes de
 * existir el interruptor.
 */
export function leerVisible(formData: FormData, campo = "activo"): boolean {
  const valor = formData.get(campo);
  if (valor === null) return true;
  return valor.toString() !== "false";
}
