// src/controllers/beneficioFallecidoController.ts
import { getBeneficioFallecidoData } from '@/models/beneficiosFallecidoModel'

/**
 * Obtiene los datos del beneficio por fallecido
 * incluyendo requisitos y FAQs, listo para la vista.
 */
// El modelo ya devuelve null si la base falla: aquí solo se arma la forma
// que usa la vista (antes había un try/catch que nunca se ejecutaba).
export async function obtenerBeneficioFallecido() {
  const data = await getBeneficioFallecidoData()
  if (!data) {
    return {
      titulo: '',
      descripcion: '',
      imagenHero: '',
      requisitos: [],
      faqs: [],
    }
  }

  return {
    titulo: data.titulo,
    descripcion: data.descripcion,
    imagenHero: data.imagen_hero || '',
    requisitos: data.beneficio_fallecido_requisitos,
    faqs: data.beneficio_fallecido_faq,
  }
}
