import { prisma } from "@/lib/prisma";
import { buildCompareReport } from "@/lib/compare";
import type { Preference } from "@/data/questionnaire";

export async function GET() {
  const [questions, gigi, jose] = await Promise.all([
    prisma.question.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findUnique({
      where: { slug: "gigi" },
      include: { answers: true },
    }),
    prisma.user.findUnique({
      where: { slug: "jose" },
      include: { answers: true },
    }),
  ]);

  if (!gigi || !jose) {
    return Response.json(
      { error: "Usuários não provisionados. Rode o seed." },
      { status: 500 },
    );
  }

  const gigiAnswers = gigi.answers.map((a) => ({
    questionId: a.questionId,
    preference: (a.preference as Preference | null) ?? null,
  }));
  const joseAnswers = jose.answers.map((a) => ({
    questionId: a.questionId,
    preference: (a.preference as Preference | null) ?? null,
  }));

  const report = buildCompareReport(questions, gigiAnswers, joseAnswers);

  return Response.json({
    users: {
      gigi: {
        id: gigi.id,
        name: gigi.name,
        slug: gigi.slug,
      },
      jose: {
        id: jose.id,
        name: jose.name,
        slug: jose.slug,
      },
    },
    report,
  });
}
