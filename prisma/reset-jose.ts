import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não está definido. Configure no .env.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const jose = await prisma.user.findUnique({ where: { slug: "jose" } });
  if (!jose) {
    console.log("[reset] usuário José não encontrado.");
    return;
  }

  const r = await prisma.answer.deleteMany({ where: { userId: jose.id } });

  await prisma.user.update({
    where: { id: jose.id },
    data: {
      role: null,
      specificFetishes: null,
      painTolerance: null,
      orientation: null,
      medicalCondition: null,
      limitations: null,
    },
  });

  console.log(
    `[reset] ${r.count} respostas apagadas e perfil do José zerado.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
