import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { JoseForm } from "@/components/JoseForm";
import { CATEGORIES, type Experience, type Preference } from "@/data/questionnaire";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [questions, jose] = await Promise.all([
    prisma.question.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findUnique({
      where: { slug: "jose" },
      include: { answers: true },
    }),
  ]);

  if (!jose) {
    return (
      <AppShell>
        <div className="glass-card p-8">
          <p className="muted-text">
            Banco não inicializado. Rode{" "}
            <code className="lilac-text">npx prisma db seed</code>.
          </p>
        </div>
      </AppShell>
    );
  }

  const groups = CATEGORIES.filter((c) => c !== "Notas Adicionais").map(
    (category) => ({
      category,
      items: questions
        .filter((q) => q.category === category)
        .map((q) => ({
          id: q.id,
          category: q.category,
          activity: q.activity,
          order: q.order,
        })),
    }),
  );

  const existing: Record<
    string,
    { preference: Preference | null; experience: Experience | null; notes: string }
  > = {};
  for (const a of jose.answers) {
    existing[a.questionId] = {
      preference: (a.preference as Preference | null) ?? null,
      experience: (a.experience as Experience | null) ?? null,
      notes: a.notes ?? "",
    };
  }

  return (
    <AppShell>
      <JoseForm
        groups={groups}
        profile={{
          name: jose.name,
          role: jose.role ?? "",
          specificFetishes: jose.specificFetishes ?? "",
          painTolerance: jose.painTolerance,
          orientation: jose.orientation ?? "",
          medicalCondition: jose.medicalCondition ?? "",
          limitations: jose.limitations ?? "",
        }}
        existing={existing}
      />
    </AppShell>
  );
}
