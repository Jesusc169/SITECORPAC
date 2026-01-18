// src/controllers/beneficioFallecidoController.ts
import { getBeneficioFallecidoData } from '@/models/beneficiosFallecidoModel'

/**
 * Obtiene los datos del beneficio por fallecido
 * incluyendo requisitos y FAQs, listo para la vista.
 */
export async function obtenerBeneficioFallecido() {
  try {
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
      requisitos: data.beneficio_fallecido_requisitos || [],
      faqs: data.beneficio_fallecido_faq || [],
    }
  } catch (error) {
    console.error('Error en el controller de beneficio por fallecido:', error)
    return {
      titulo: '',
      descripcion: '',
      imagenHero: '',
      requisitos: [],
      faqs: [],
    }
  }
}
