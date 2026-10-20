/**
 * Restablece la contraseña de una cuenta del panel cuando nadie la recuerda.
 *
 * Se corre en el servidor, a mano y de forma interactiva:
 *   cd /home/sitecorpac/SITECORPAC && sudo -u sitecorpac node scripts/restablecer-clave.js
 *
 * - Lista las cuentas (correo y rol, nunca contraseñas).
 * - Pide el correo y la contraseña nueva dos veces, sin mostrarla en pantalla.
 * - La guarda cifrada con bcrypt (igual que el panel) y sube sesionVersion,
 *   así cualquier sesión abierta con la contraseña anterior deja de valer.
 *
 * La contraseña nunca queda escrita en un archivo ni en el historial.
 */
const readline = require("readline");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
    orderBy: [{ rol: "asc" }, { id: "asc" }],
  });
  console.log("\nCuentas del panel:");
  for (const u of usuarios) {
    console.log(`  ${u.email}  (${u.rol}${u.activo ? "" : ", DESACTIVADA"}) - ${u.nombre}`);
  }

  const email = await preguntar("\nCorreo de la cuenta a restablecer: ");
  const usuario = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!usuario) throw new Error("No existe una cuenta con ese correo.");

  const clave = await preguntar("Contraseña nueva (no se verá al escribir): ", true);
  if (clave.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  const repetida = await preguntar("Repite la contraseña nueva: ", true);
  if (clave !== repetida) throw new Error("Las contraseñas no coinciden.");

  await prisma.user.update({
    where: { id: usuario.id },
    data: { password: await bcrypt.hash(clave, 10), sesionVersion: { increment: 1 } },
  });

  console.log(`\nListo: contraseña cambiada para ${usuario.email}. Las sesiones abiertas de esa cuenta se cerraron.`);
  if (!usuario.activo) console.log("Ojo: la cuenta está DESACTIVADA; reactívala desde Panel > Usuarios con otra cuenta de administrador.");
}

main()
  .catch((e) => {
    console.error("\nNo se cambió nada:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
