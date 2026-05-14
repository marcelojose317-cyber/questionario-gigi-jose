import { prisma } from "@/lib/prisma";
import { EXPERIENCES, PREFERENCES } from "@/data/questionnaire";

const PREF_SET = new Set<string>(PREFERENCES);
const EXP_SET = new Set<string>(EXPERIENCES);

function isOptionalString(v: unknown): v is string | null | undefined {
  return v === null || v === undefined || typeof v === "string";
}

function isOptionalInt(v: unknown): v is number | null | undefined {
  if (v === null || v === undefined) return true;
  return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
}

type ProfileInput = {
  role?: string | null;
  specificFetishes?: string | null;
  painTolerance?: number | null;
  orientation?: string | null;
  medicalCondition?: string | null;
  limitations?: string | null;
};

type AnswerInput = {
  questionId: string;
  experience?: string | null;
  preference?: string | null;
  notes?: string | null;
};

function validateProfile(profile: unknown): ProfileInput | { error: string } {
  if (profile === undefined || profile === null) return {};
  if (typeof profile !== "object" || Array.isArray(profile)) {
    return { error: "profile deve ser um objeto" };
  }
  const p = profile as Record<string, unknown>;
  const fields: (keyof ProfileInput)[] = [
    "role",
    "specificFetishes",
    "orientation",
    "medicalCondition",
    "limitations",
  ];
  for (const f of fields) {
    if (!(f in p)) continue;
    if (!isOptionalString(p[f])) {
      return { error: `profile.${f} deve ser string ou null` };
    }
  }
  if ("painTolerance" in p && !isOptionalInt(p.painTolerance)) {
    return { error: "profile.painTolerance deve ser inteiro ou null" };
  }
  return p as ProfileInput;
}

function validateAnswers(
  answers: unknown,
): AnswerInput[] | { error: string } {
  if (answers === undefined || answers === null) return [];
  if (!Array.isArray(answers)) {
    return { error: "answers deve ser um array" };
  }
  const out: AnswerInput[] = [];
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i] as Record<string, unknown> | null;
    if (!a || typeof a !== "object" || Array.isArray(a)) {
      return { error: `answers[${i}] deve ser objeto` };
    }
    if (typeof a.questionId !== "string" || a.questionId.length === 0) {
      return { error: `answers[${i}].questionId obrigatório` };
    }
    if (a.preference !== null && a.preference !== undefined) {
      if (typeof a.preference !== "string" || !PREF_SET.has(a.preference)) {
        return {
          error: `answers[${i}].preference inválido: "${String(a.preference)}"`,
        };
      }
    }
    if (a.experience !== null && a.experience !== undefined) {
      if (typeof a.experience !== "string" || !EXP_SET.has(a.experience)) {
        return {
          error: `answers[${i}].experience inválido: "${String(a.experience)}"`,
        };
      }
    }
    if (!isOptionalString(a.notes)) {
      return { error: `answers[${i}].notes deve ser string ou null` };
    }
    out.push({
      questionId: a.questionId,
      preference: (a.preference as string | null | undefined) ?? null,
      experience: (a.experience as string | null | undefined) ?? null,
      notes: (a.notes as string | null | undefined) ?? null,
    });
  }
  return out;
}

export async function GET() {
  const user = await prisma.user.findUnique({
    where: { slug: "jose" },
    include: {
      answers: {
        include: { question: true },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "body deve ser um objeto" },
      { status: 400 },
    );
  }
  const payload = body as { profile?: unknown; answers?: unknown };

  const profile = validateProfile(payload.profile);
  if ("error" in profile) {
    return Response.json({ error: profile.error }, { status: 400 });
  }

  const answers = validateAnswers(payload.answers);
  if ("error" in answers) {
    return Response.json({ error: answers.error }, { status: 400 });
  }

  const jose = await prisma.user.findUnique({ where: { slug: "jose" } });
  if (!jose) {
    return Response.json(
      { error: "Usuário José não está provisionado. Rode o seed." },
      { status: 500 },
    );
  }

  if (answers.length > 0) {
    const ids = Array.from(new Set(answers.map((a) => a.questionId)));
    const found = await prisma.question.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((q) => q.id));
    const unknown = ids.filter((id) => !foundIds.has(id));
    if (unknown.length > 0) {
      return Response.json(
        {
          error: "questionId desconhecido",
          unknown,
        },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(profile).length > 0) {
      await tx.user.update({
        where: { id: jose.id },
        data: {
          role: profile.role ?? undefined,
          specificFetishes: profile.specificFetishes ?? undefined,
          painTolerance: profile.painTolerance ?? undefined,
          orientation: profile.orientation ?? undefined,
          medicalCondition: profile.medicalCondition ?? undefined,
          limitations: profile.limitations ?? undefined,
        },
      });
    }

    for (const a of answers) {
      await tx.answer.upsert({
        where: {
          userId_questionId: {
            userId: jose.id,
            questionId: a.questionId,
          },
        },
        update: {
          preference: a.preference,
          experience: a.experience,
          notes: a.notes,
        },
        create: {
          userId: jose.id,
          questionId: a.questionId,
          preference: a.preference,
          experience: a.experience,
          notes: a.notes,
        },
      });
    }
  });

  const updated = await prisma.user.findUnique({
    where: { id: jose.id },
    include: { _count: { select: { answers: true } } },
  });

  return Response.json({
    ok: true,
    profile: updated,
    savedAnswers: answers.length,
    totalAnswers: updated?._count.answers ?? 0,
  });
}
