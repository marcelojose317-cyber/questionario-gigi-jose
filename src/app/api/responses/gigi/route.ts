import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findUnique({
    where: { slug: "gigi" },
    include: {
      answers: {
        include: { question: true },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "Usuária não encontrada" }, { status: 404 });
  }

  const { answers, ...profile } = user;

  return Response.json({
    profile,
    answers: answers
      .map((a) => ({
        questionId: a.questionId,
        category: a.question.category,
        activity: a.question.activity,
        order: a.question.order,
        experience: a.experience,
        preference: a.preference,
        notes: a.notes,
        updatedAt: a.updatedAt,
      }))
      .sort((a, b) => a.order - b.order),
  });
}
