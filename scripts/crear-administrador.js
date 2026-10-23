/**
 * Crea una cuenta nueva de administrador del panel (por ejemplo, cuando
 * nadie recuerda la contraseña de las cuentas existentes).
 *
 * Se corre en el servidor, a mano y de forma interactiva:
 *   cd /home/sitecorpac/SITECORPAC && sudo -u sitecorpac node scripts/crear-administrador.js
 *
 * - Pide nombre, correo y la contraseña dos veces, sin mostrarla en pantalla.
 * - La guarda cifrada con bcrypt (igual que el panel), con rol "administrador".
 * - No toca las cuentas que ya existen.
 *
 * La contraseña nunca queda escrita en un archivo ni en el historial.
 */
const readline = require("readline");
const bcrypt = require("bcryptjs");
// Prisma 7 ya no lee el .env por su cuenta y necesita el adaptador de MySQL
require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// En el servidor se conecta por el socket de MySQL (ver src/lib/prisma.ts)
const urlConexion = (url, socket) => {
  if (!socket) return url;
  const u = new URL(url);
  u.searchParams.set("socketPath", socket);
  return u.toString();
};
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(urlConexion(process.env.DATABASE_URL, process.env.DATABASE_SOCKET)),
});

function preguntar(texto, oculto = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      // No repetir en pantalla lo que se escribe.
      rl._writeToOutput = (s) => {
        if (s.includes(texto)) rl.output.write(s);
      };
    }
    rl.question(texto, (respuesta) => {
      rl.close();
      if (oculto) process.stdout.write("\n");
      resolve(respuesta.trim());
    });
  });
}

async function main() {
  const nombre = await preguntar("\nNombre de la persona: ");
  if (!nombre) throw new Error("El nombre no puede quedar vacío.");

  const email = (await preguntar("Correo (con este se inicia sesión): ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ese correo no es válido.");
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Ya existe una cuenta con ese correo; para cambiarle la contraseña usa scripts/restablecer-clave.js.");
  }

  const clave = await preguntar("Contraseña (no se verá al escribir): ", true);
  if (clave.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  const repetida = await preguntar("Repite la contraseña: ", true);
  if (clave !== repetida) throw new Error("Las contraseñas no coinciden.");

  await prisma.user.create({
    data: { nombre, email, password: await bcrypt.hash(clave, 10), rol: "administrador", permisos: [], activo: true },
  });

  console.log(`\nListo: cuenta de administrador creada para ${email}. Ya puede entrar en sitecorpac.com/login.`);
}

main()
  .catch((e) => {
    console.error("\nNo se creó nada:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
