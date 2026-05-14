import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/data/questionnaire";

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
  });

  const groups = CATEGORIES.map((category) => ({
    category,
    questions: questions.filter((q) => q.category === category),
  }));

  return Response.json({
    categories: CATEGORIES,
    total: questions.length,
    groups,
  });
}
