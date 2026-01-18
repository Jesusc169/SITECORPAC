// src/models/beneficioFallecidoModel.ts
import prisma from '@/lib/prisma'

/**
 * Obtiene el primer beneficio por fallecido junto con sus requisitos y FAQs.
 * Ordena los requisitos y FAQs por el campo 'orden'.
 */
export async function getBeneficioFallecidoData() {
  try {
    const beneficio = await prisma.beneficio_fallecido.findFirst({
      include: {
        beneficio_fallecido_requisitos: {
          orderBy: { orden: 'asc' }, // Ordena los requisitos
        },
        beneficio_fallecido_faq: {
          orderBy: { orden: 'asc' }, // Ordena las FAQs
        },
      },
    })

    return beneficio
  } catch (error) {
    console.error('Error obteniendo beneficio por fallecido:', error)
    return null
  }
}
