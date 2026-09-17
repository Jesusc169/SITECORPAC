// Migración de datos de un solo uso: convierte la foto suelta que ya tenía
// cada noticia/feria/sorteo (columnas `imagen` / `imagen_portada`) en la
// primera fila de su nueva galería (tabla *_imagen, marcada como principal).
//
// Se debe correr UNA sola vez, después de `npx prisma db push` (que crea las
// tablas noticia_imagen / evento_feria_imagen / sorteo_imagen), tanto en
// local como en producción. Es seguro volver a ejecutarlo: si un registro ya
// tiene filas en su galería, se salta (no duplica).
//
// Uso: node scripts/backfill-imagenes-galeria.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function backfillNoticias() {
  const noticias = await prisma.noticia.findMany({
    where: { imagen: { not: null } },
    include: { noticia_imagen: true },
  });

  let creadas = 0;
  for (const n of noticias) {
    if (n.noticia_imagen.length > 0) continue;
    await prisma.noticia_imagen.create({
      data: { noticia_id: n.id, url: n.imagen, orden: 1, principal: true },
    });
    creadas++;
  }
  console.log(`noticia_imagen: ${creadas} fila(s) creada(s)`);
}

async function backfillFerias() {
  const ferias = await prisma.evento_feria.findMany({
    where: { imagen_portada: { not: null } },
    include: { evento_feria_imagen: true },
  });

  let creadas = 0;
  for (const f of ferias) {
    if (f.evento_feria_imagen.length > 0) continue;
    await prisma.evento_feria_imagen.create({
      data: { feria_id: f.id, url: f.imagen_portada, orden: 1, principal: true },
    });
    creadas++;
  }
  console.log(`evento_feria_imagen: ${creadas} fila(s) creada(s)`);
}

async function backfillSorteos() {
  const sorteos = await prisma.sorteo.findMany({
    where: { imagen: { not: null } },
    include: { sorteo_imagen: true },
  });

  let creadas = 0;
  for (const s of sorteos) {
    if (s.sorteo_imagen.length > 0) continue;
    await prisma.sorteo_imagen.create({
      data: { sorteo_id: s.id, url: s.imagen, orden: 1, principal: true },
    });
    creadas++;
  }
  console.log(`sorteo_imagen: ${creadas} fila(s) creada(s)`);
}

async function main() {
  await backfillNoticias();
  await backfillFerias();
  await backfillSorteos();
}

main()
  .catch((err) => {
    console.error("Error en backfill:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
