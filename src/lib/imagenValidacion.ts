// Proporción objetivo de las cajas donde se muestra la imagen de noticia
// (home y detalle usan la misma caja: 3:2)
const RATIO_OBJETIVO = 3 / 2;

export function evaluarProporcion(width: number, height: number): string | null {
  const ratio = width / height;
  const medida = `${width}x${height}px`;

  if (width < 500 || height < 300) {
    return `⚠️ Tu imagen es de ${medida}, resolución baja: podría verse borrosa. Recomendado: mínimo 800x500px, horizontal.`;
  }

  // relativo < 1 => la imagen es "más cuadrada" que la caja: se recorta arriba/abajo
  // relativo > 1 => la imagen es más ancha que la caja: se recorta a los costados
  const relativo = ratio / RATIO_OBJETIVO;

  if (relativo < 0.7) {
    return `⚠️ Tu imagen es de ${medida} (vertical o casi cuadrada). Se va a recortar MUCHO arriba y abajo, se puede perder texto importante del diseño. Recomendado: una foto horizontal tipo 800x500px.`;
  }

  if (relativo < 0.9) {
    return `⚠️ Tu imagen es de ${medida}. Se va a recortar arriba y abajo al mostrarse — revisa que no se corte texto o logos que tengas cerca del borde superior o inferior del diseño.`;
  }

  if (relativo > 1.7) {
    return `ℹ️ Tu imagen es de ${medida}, muy panorámica. Se recortarán bastante los costados al mostrarse.`;
  }

  if (relativo > 1.3) {
    return `ℹ️ Tu imagen es de ${medida}. Se recortará un poco en los costados al mostrarse.`;
  }

  return null;
}
