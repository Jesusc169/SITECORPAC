import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("123", 10); // 🔑 contraseña por defecto

  const administrador = await prisma.user.upsert({
    where: { email: "admin@sitecorpac.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@sitecorpac.com",
      password,
      rol: "administrador", // 👈 según tu modelo
    },
  });

  console.log("Usuario administrador creado:", administrador);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
