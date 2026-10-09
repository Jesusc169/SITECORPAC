/**
 * Deja la base de PRUEBA lista para las pruebas E2E (npm run test:e2e):
 * esquema al día, tablas vacías y datos de ejemplo (usuarios, contenido de
 * las páginas informativas, una noticia, una feria, un sorteo).
 *
 * Se niega a correr si la base no termina en "_test".
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function urlBasePrueba() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (existsSync(".env.test")) {
    const m = readFileSync(".env.test", "utf8").match(/^TEST_DATABASE_URL="?([^"\r\n]+)"?/m);
    if (m) return m[1];
  }
  return "mysql://root:root@localhost:3306/sitecorpac_test";
}

const url = urlBasePrueba();
const base = url.split("/").pop().split("?")[0];
if (!base.endsWith("_test")) throw new Error(`La base E2E debe terminar en "_test" (es "${base}")`);

execSync("npx prisma db push --skip-generate", { env: { ...process.env, DATABASE_URL: url }, stdio: "inherit" });

const prisma = new PrismaClient({ datasources: { db: { url } } });

export const CLAVE_E2E = "Clave-E2E-2026!";

async function main() {
  const tablas = await prisma.$queryRaw`
    SELECT table_name AS t FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    for (const { t } of tablas) if (t !== "_prisma_migrations") await tx.$executeRawUnsafe(`DELETE FROM \`${t}\``);
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  });

  const password = await bcrypt.hash(CLAVE_E2E, 4);
  await prisma.user.createMany({
    data: [
      { nombre: "Admin E2E", email: "admin@e2e.test", password, rol: "administrador", permisos: [] },
      { nombre: "Secretaria E2E", email: "secretaria@e2e.test", password, rol: "secretaria", permisos: ["noticias", "ferias", "sorteos", "directorio"] },
    ],
  });

  const ahora = new Date();
  await prisma.noticia.create({ data: { titulo: "Bienvenida E2E", descripcion: "Noticia de ejemplo", contenido: "Texto de ejemplo", autor: "SITECORPAC", updatedAt: ahora } });
  const empresa = await prisma.empresa.create({ data: { nombre: "Empresa E2E", logo_url: "/logo_site.jpg" } });
  await prisma.evento_feria.create({ data: { titulo: "Feria E2E", descripcion: "Precios accesibles", anio: ahora.getFullYear(), evento_feria_fecha: { create: [{ fecha: ahora, hora_inicio: "09:00", hora_fin: "17:00", ubicacion: "Sede" }] }, evento_feria_empresa: { create: [{ empresa_id: empresa.id }] } } });
  await prisma.sorteo.create({ data: { nombre: "Sorteo E2E", descripcion: "Para afiliados", lugar: "Sede", fecha_hora: ahora, anio: ahora.getFullYear(), sorteo_producto: { create: [{ nombre: "TV", cantidad: 1 }] } } });
  await prisma.directorio.create({ data: { nombre: "Dirigente E2E", cargo: "Secretario General", correo: "dir@e2e.test", telefono: "999", periodoInicio: ahora, orden: 1 } });
  for (const tabla of ["constitucion_contenido", "ley_seguridad_contenido", "oit_contenido"]) {
    await prisma[tabla].create({ data: { titulo: `Contenido ${tabla}`, descripcion: "Texto" } });
  }
  await prisma.estatuto_contenido.create({ data: { titulo: "Estatuto E2E", descripcion: "Texto", enlace_pdf: "/documentos/estatuto.pdf" } });
  await prisma.ley_relaciones_colectivas.create({ data: { titulo: "Ley E2E", descripcion: "Texto", enlace_pdf: "/documentos/ley.pdf" } });
  await prisma.cooperativas.create({ data: { nombre: "Cooperativa E2E" } });
  await prisma.prestamo_requisitos.create({ data: { descripcion: "Estar afiliado" } });
  await prisma.prestamo_faq.create({ data: { pregunta: "¿Quién presta?", respuesta: "La cooperativa" } });
  await prisma.beneficio_fallecido.create({ data: { titulo: "Beneficio E2E", descripcion: "Apoyo económico", beneficio_fallecido_requisitos: { create: [{ descripcion: "DNI" }] }, beneficio_fallecido_faq: { create: [{ pregunta: "¿Monto?", respuesta: "5000" }] } } });
}

await main();
await prisma.$disconnect();
console.log("Base E2E lista");
