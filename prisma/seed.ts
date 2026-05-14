import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { QUESTIONNAIRE } from "../src/data/questionnaire";
import { GIGI_ANSWERS, GIGI_PROFILE } from "../src/data/gigiAnswers";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const gigi = await prisma.user.upsert({
    where: { slug: GIGI_PROFILE.slug },
    update: {
      name: GIGI_PROFILE.name,
      role: GIGI_PROFILE.role,
      specificFetishes: GIGI_PROFILE.specificFetishes,
      painTolerance: GIGI_PROFILE.painTolerance,
      orientation: GIGI_PROFILE.orientation,
      medicalCondition: GIGI_PROFILE.medicalCondition,
      limitations: GIGI_PROFILE.limitations,
    },
    create: {
      slug: GIGI_PROFILE.slug,
      name: GIGI_PROFILE.name,
      role: GIGI_PROFILE.role,
      specificFetishes: GIGI_PROFILE.specificFetishes,
      painTolerance: GIGI_PROFILE.painTolerance,
      orientation: GIGI_PROFILE.orientation,
      medicalCondition: GIGI_PROFILE.medicalCondition,
      limitations: GIGI_PROFILE.limitations,
    },
  });

  await prisma.user.upsert({
    where: { slug: "jose" },
    update: { name: "José" },
    create: { slug: "jose", name: "José" },
  });

  for (let i = 0; i < QUESTIONNAIRE.length; i++) {
    const q = QUESTIONNAIRE[i];
    await prisma.question.upsert({
      where: {
        category_activity: { category: q.category, activity: q.activity },
      },
      update: { order: i + 1 },
      create: { category: q.category, activity: q.activity, order: i + 1 },
    });
  }

  let answersCount = 0;
  for (const a of GIGI_ANSWERS) {
    const question = await prisma.question.findUnique({
      where: {
        category_activity: { category: a.category, activity: a.activity },
      },
    });

    if (!question) {
      console.warn(
        `[seed] pergunta não encontrada: ${a.category} / ${a.activity}`,
      );
      continue;
    }

    await prisma.answer.upsert({
      where: {
        userId_questionId: { userId: gigi.id, questionId: question.id },
      },
      update: {
        experience: a.experience ?? null,
        preference: a.preference ?? null,
        notes: a.notes ?? null,
      },
      create: {
        userId: gigi.id,
        questionId: question.id,
        experience: a.experience ?? null,
        preference: a.preference ?? null,
        notes: a.notes ?? null,
      },
    });
    answersCount++;
  }

  console.log(
    `[seed] ok — ${QUESTIONNAIRE.length} perguntas, ${answersCount} respostas da Gigi`,
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
