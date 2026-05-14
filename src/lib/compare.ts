import type { Preference } from "@/data/questionnaire";

export const PREFERENCE_SCORES: Record<Preference, number> = {
  limite_rigido: -2,
  tolerar: -1,
  curioso: 1,
  aproveitar: 2,
  amar: 3,
};

export const JOSE_MIN_ANSWERS_FOR_REPORT = 25;

type AnswerLike = {
  questionId: string;
  preference: Preference | null;
};

type QuestionLike = {
  id: string;
  category: string;
  activity: string;
  order: number;
};

export type ComparisonFlags = {
  strongCompat: boolean;
  sharedCuriosity: boolean;
  sharedLimit: boolean;
  attention: boolean;
  largeGap: boolean;
};

export type CompareItem = {
  questionId: string;
  category: string;
  activity: string;
  order: number;
  gigi: Preference | null;
  jose: Preference | null;
  gigiScore: number | null;
  joseScore: number | null;
  gap: number | null;
  flags: ComparisonFlags;
};

export type CategorySummary = {
  category: string;
  totalQuestions: number;
  bothAnswered: number;
  strongCompat: number;
  sharedCuriosity: number;
  sharedLimit: number;
  attention: number;
  largeGap: number;
  compatibilityPercent: number;
};

export type CompareMetrics = {
  totalQuestions: number;
  joseAnswered: number;
  gigiAnswered: number;
  bothAnswered: number;
  strongCompat: number;
  sharedCuriosity: number;
  sharedLimit: number;
  attention: number;
  largeGap: number;
  compatibilityPercent: number;
};

export type CompareReport =
  | {
      status: "waiting_for_jose";
      joseAnswered: number;
      threshold: number;
    }
  | {
      status: "ready";
      metrics: CompareMetrics;
      insights: string[];
      topQuestions: CompareItem[];
      categorySummary: CategorySummary[];
    };

function isEnjoyOrLove(p: Preference | null): boolean {
  return p === "aproveitar" || p === "amar";
}

export function compareItem(
  question: QuestionLike,
  gigi: Preference | null,
  jose: Preference | null,
): CompareItem {
  const gigiScore = gigi ? PREFERENCE_SCORES[gigi] : null;
  const joseScore = jose ? PREFERENCE_SCORES[jose] : null;

  const bothAnswered = gigi !== null && jose !== null;

  const flags: ComparisonFlags = {
    strongCompat: bothAnswered && isEnjoyOrLove(gigi) && isEnjoyOrLove(jose),
    sharedCuriosity: gigi === "curioso" && jose === "curioso",
    sharedLimit: gigi === "limite_rigido" && jose === "limite_rigido",
    attention:
      bothAnswered &&
      ((isEnjoyOrLove(gigi) && jose === "limite_rigido") ||
        (isEnjoyOrLove(jose) && gigi === "limite_rigido")),
    largeGap: false,
  };

  let gap: number | null = null;
  if (gigiScore !== null && joseScore !== null) {
    gap = Math.abs(gigiScore - joseScore);
    flags.largeGap = gap >= 4;
  }

  return {
    questionId: question.id,
    category: question.category,
    activity: question.activity,
    order: question.order,
    gigi,
    jose,
    gigiScore,
    joseScore,
    gap,
    flags,
  };
}

function priorityScore(item: CompareItem): number {
  if (item.flags.attention) return 1000 + (item.gap ?? 0);
  if (item.flags.largeGap) return 500 + (item.gap ?? 0);
  if (item.flags.sharedLimit) return 100;
  if (item.flags.strongCompat) return 50;
  if (item.flags.sharedCuriosity) return 25;
  return 0;
}

function pickInsights(metrics: CompareMetrics): string[] {
  const out: string[] = [];

  if (metrics.bothAnswered === 0) {
    out.push(
      "Ainda não há perguntas respondidas pelos dois para comparar — vale conversar item a item.",
    );
    return out;
  }

  if (metrics.strongCompat > 0) {
    out.push(
      `${metrics.strongCompat} ${
        metrics.strongCompat === 1 ? "prática" : "práticas"
      } com forte compatibilidade — base segura para conversar abertamente.`,
    );
  }

  if (metrics.sharedLimit > 0) {
    out.push(
      `${metrics.sharedLimit} ${
        metrics.sharedLimit === 1 ? "limite rígido" : "limites rígidos"
      } em comum — alinhamento claro sobre o que ambos não querem.`,
    );
  }

  if (metrics.sharedCuriosity > 0) {
    out.push(
      `${metrics.sharedCuriosity} ${
        metrics.sharedCuriosity === 1 ? "curiosidade" : "curiosidades"
      } em comum — terreno para diálogo, sem pressa.`,
    );
  }

  if (metrics.attention > 0) {
    out.push(
      `${metrics.attention} ${
        metrics.attention === 1 ? "ponto de atenção" : "pontos de atenção"
      }: um lado marcou como limite rígido o que o outro tem como prazer. O limite prevalece — converse antes de qualquer coisa.`,
    );
  }

  if (metrics.largeGap > 0) {
    out.push(
      `${metrics.largeGap} ${
        metrics.largeGap === 1 ? "divergência grande" : "divergências grandes"
      } de preferência — vale revisitar com calma para entender o que cada um sentiu.`,
    );
  }

  if (out.length === 0) {
    out.push(
      "Respostas alinhadas até aqui — bom momento para conversar sobre o que ainda não foi marcado.",
    );
  }

  return out.slice(0, 5);
}

export function buildCompareReport(
  questions: QuestionLike[],
  gigiAnswers: AnswerLike[],
  joseAnswers: AnswerLike[],
  threshold = JOSE_MIN_ANSWERS_FOR_REPORT,
): CompareReport {
  const joseAnsweredCount = joseAnswers.filter(
    (a) => a.preference !== null,
  ).length;

  if (joseAnsweredCount < threshold) {
    return {
      status: "waiting_for_jose",
      joseAnswered: joseAnsweredCount,
      threshold,
    };
  }

  const gigiByQ = new Map<string, Preference | null>();
  for (const a of gigiAnswers) gigiByQ.set(a.questionId, a.preference);

  const joseByQ = new Map<string, Preference | null>();
  for (const a of joseAnswers) joseByQ.set(a.questionId, a.preference);

  const items: CompareItem[] = questions.map((q) =>
    compareItem(q, gigiByQ.get(q.id) ?? null, joseByQ.get(q.id) ?? null),
  );

  const bothAnswered = items.filter(
    (i) => i.gigi !== null && i.jose !== null,
  ).length;
  const gigiAnsweredTotal = items.filter((i) => i.gigi !== null).length;

  let strongCompat = 0;
  let sharedCuriosity = 0;
  let sharedLimit = 0;
  let attention = 0;
  let largeGap = 0;

  for (const i of items) {
    if (i.flags.strongCompat) strongCompat++;
    if (i.flags.sharedCuriosity) sharedCuriosity++;
    if (i.flags.sharedLimit) sharedLimit++;
    if (i.flags.attention) attention++;
    if (i.flags.largeGap) largeGap++;
  }

  const positiveAlignment = strongCompat + sharedCuriosity + sharedLimit;
  const compatibilityPercent =
    bothAnswered > 0
      ? Math.round((positiveAlignment / bothAnswered) * 100)
      : 0;

  const metrics: CompareMetrics = {
    totalQuestions: questions.length,
    joseAnswered: joseAnsweredCount,
    gigiAnswered: gigiAnsweredTotal,
    bothAnswered,
    strongCompat,
    sharedCuriosity,
    sharedLimit,
    attention,
    largeGap,
    compatibilityPercent,
  };

  const topQuestions = [...items]
    .filter((i) => i.gigi !== null && i.jose !== null)
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5);

  const byCategory = new Map<string, CompareItem[]>();
  for (const i of items) {
    const arr = byCategory.get(i.category) ?? [];
    arr.push(i);
    byCategory.set(i.category, arr);
  }

  const categorySummary: CategorySummary[] = [];
  for (const [category, list] of byCategory.entries()) {
    const both = list.filter((i) => i.gigi !== null && i.jose !== null);
    const sc = both.filter((i) => i.flags.strongCompat).length;
    const cu = both.filter((i) => i.flags.sharedCuriosity).length;
    const sl = both.filter((i) => i.flags.sharedLimit).length;
    const at = both.filter((i) => i.flags.attention).length;
    const lg = both.filter((i) => i.flags.largeGap).length;
    const pos = sc + cu + sl;
    categorySummary.push({
      category,
      totalQuestions: list.length,
      bothAnswered: both.length,
      strongCompat: sc,
      sharedCuriosity: cu,
      sharedLimit: sl,
      attention: at,
      largeGap: lg,
      compatibilityPercent:
        both.length > 0 ? Math.round((pos / both.length) * 100) : 0,
    });
  }

  return {
    status: "ready",
    metrics,
    insights: pickInsights(metrics),
    topQuestions,
    categorySummary,
  };
}
