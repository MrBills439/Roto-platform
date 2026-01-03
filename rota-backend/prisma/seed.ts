import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.create({
    data: {
      email: "admin@rota.local",
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
      passwordHash,
      isActive: true,
    },
  });

  console.log("Admin user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
