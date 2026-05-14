import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SafetyNotice } from "@/components/SafetyNotice";
import { UserStatusCard } from "@/components/UserStatusCard";
import { MetricCard } from "@/components/MetricCard";
import { InsightCard } from "@/components/InsightCard";
import { ProgressBar } from "@/components/ProgressBar";
import { prisma } from "@/lib/prisma";
import {
  buildCompareReport,
  type CompareItem,
  type CompareReport,
} from "@/lib/compare";
import { PREFERENCE_LABELS, type Preference } from "@/data/questionnaire";

export const dynamic = "force-dynamic";

type ReadyReport = Extract<CompareReport, { status: "ready" }>;
type WaitingReport = Extract<CompareReport, { status: "waiting_for_jose" }>;

async function loadData() {
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
    throw new Error("Usuários não provisionados. Rode o seed.");
  }

  const gigiAnsweredCount = gigi.answers.filter(
    (a) => a.preference !== null,
  ).length;
  const joseAnsweredCount = jose.answers.filter(
    (a) => a.preference !== null,
  ).length;

  const report = buildCompareReport(
    questions,
    gigi.answers.map((a) => ({
      questionId: a.questionId,
      preference: (a.preference as Preference | null) ?? null,
    })),
    jose.answers.map((a) => ({
      questionId: a.questionId,
      preference: (a.preference as Preference | null) ?? null,
    })),
  );

  return {
    users: {
      gigi: {
        role: gigi.role,
        orientation: gigi.orientation,
        answeredCount: gigiAnsweredCount,
      },
      jose: {
        role: jose.role,
        orientation: jose.orientation,
        answeredCount: joseAnsweredCount,
      },
    },
    totalQuestions: questions.length,
    report,
  };
}

export default async function Home() {
  const { users, totalQuestions, report } = await loadData();

  const gigiStatus = "Concluído";
  const joseStatus =
    users.jose.answeredCount === 0
      ? "Pendente"
      : `Em progresso · ${users.jose.answeredCount} de ${totalQuestions}`;

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Mapa de <span className="lilac-text">Compatibilidade</span>
          </h1>
          <p className="muted-text text-base leading-relaxed">
            Preferências, limites e pontos de conversa em um espaço privado.
          </p>
        </header>

        <SafetyNotice />

        <section className="grid sm:grid-cols-2 gap-4">
          <UserStatusCard
            name="Giovana"
            slug="gigi"
            status={gigiStatus}
            answered={users.gigi.answeredCount}
            total={totalQuestions}
          />
          <UserStatusCard
            name="José"
            slug="jose"
            status={joseStatus}
            answered={users.jose.answeredCount}
            total={totalQuestions}
          />
        </section>

        {report.status === "waiting_for_jose" ? (
          <WaitingState report={report} />
        ) : (
          <ReadyState report={report} />
        )}
      </div>
    </AppShell>
  );
}

function WaitingState({ report }: { report: WaitingReport }) {
  return (
    <div className="glass-card p-8 sm:p-10">
      <div className="flex items-start gap-5">
        <div
          className="hidden sm:block w-1 h-14 rounded-full shrink-0 mt-1"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--glow-lilac)",
          }}
          aria-hidden
        />
        <div className="space-y-4 max-w-xl">
          <h2 className="section-title">Aguardando José</h2>
          <p className="muted-text text-sm leading-relaxed">
            O comparativo completo será liberado depois que José finalizar o
            questionário.
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Atualmente:{" "}
            <span className="lilac-text">
              {report.joseAnswered} de {report.threshold}
            </span>{" "}
            respostas mínimas para liberar o relatório.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/questionario/jose" className="btn-primary">
              Responder como José
            </Link>
            <Link href="/questionario/gigi" className="btn-secondary">
              Ver respostas da Gigi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyState({ report }: { report: ReadyReport }) {
  const m = report.metrics;
  return (
    <>
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Métricas</h2>
          <span className="text-[11px] muted-text uppercase tracking-[0.22em]">
            Visão geral
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Compatibilidade"
            value={`${m.compatibilityPercent}%`}
            hint={`em ${m.bothAnswered} perguntas`}
            accent="lilac"
          />
          <MetricCard
            label="Total"
            value={m.totalQuestions}
            hint="perguntas no questionário"
          />
          <MetricCard
            label="Gigi"
            value={m.gigiAnswered}
            hint="respostas registradas"
          />
          <MetricCard
            label="José"
            value={m.joseAnswered}
            hint="respostas registradas"
          />
          <MetricCard
            label="Fortes"
            value={m.strongCompat}
            hint="ambos gostam ou amam"
          />
          <MetricCard
            label="Curiosidades"
            value={m.sharedCuriosity}
            hint="em comum"
          />
          <MetricCard
            label="Limites"
            value={m.sharedLimit}
            hint="rígidos compartilhados"
          />
          <MetricCard
            label="Atenção"
            value={m.attention}
            hint="conversar antes"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Mini relatório</h2>
        <div className="glass-card p-6 sm:p-7">
          <p className="text-base leading-relaxed text-white/90">
            {report.summary}
          </p>
        </div>
      </section>

      {report.insights.length > 0 ? (
        <section className="space-y-4">
          <h2 className="section-title">Insights</h2>
          <div className="space-y-2.5">
            {report.insights.map((text, i) => (
              <InsightCard key={i} text={text} index={i + 1} />
            ))}
          </div>
        </section>
      ) : null}

      {report.topQuestions.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="section-title">Para conversar primeiro</h2>
            <p className="muted-text text-sm mt-1">
              Cinco perguntas onde há mais o que ouvir — sem julgamento.
            </p>
          </div>
          <div className="space-y-2.5">
            {report.topQuestions.map((q) => (
              <TopQuestion key={q.questionId} item={q} />
            ))}
          </div>
        </section>
      ) : null}

      {report.categorySummary.length > 0 ? (
        <section className="space-y-4">
          <h2 className="section-title">Por categoria</h2>
          <div className="soft-card overflow-hidden" style={{ padding: 0 }}>
            {report.categorySummary.map((c, idx) => (
              <div
                key={c.category}
                className="grid grid-cols-[1fr_90px_56px] sm:grid-cols-[1fr_180px_60px] items-center gap-4 px-5 py-4"
                style={
                  idx === 0
                    ? undefined
                    : { borderTop: "1px solid var(--border-soft)" }
                }
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {c.category}
                  </div>
                  <div className="text-xs muted-text mt-0.5">
                    {c.bothAnswered} de {c.totalQuestions} respondidas pelos
                    dois
                  </div>
                </div>
                <ProgressBar
                  value={c.compatibilityPercent}
                  ariaLabel={`${c.category}: ${c.compatibilityPercent}%`}
                />
                <div
                  className="text-right text-sm tabular-nums font-medium"
                  style={{ color: "var(--text-lilac)" }}
                >
                  {c.compatibilityPercent}%
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function TopQuestion({ item }: { item: CompareItem }) {
  const tag = priorityTag(item);
  return (
    <div className="soft-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] muted-text">
            {item.category}
          </div>
          <div className="text-sm font-medium leading-snug">
            {item.activity}
          </div>
        </div>
        {tag ? (
          <span
            className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
            style={{
              background: "rgba(167, 139, 250, 0.08)",
              color: "var(--text-lilac)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {tag}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <PrefPill name="Gigi" pref={item.gigi} />
        <PrefPill name="José" pref={item.jose} />
      </div>
    </div>
  );
}

function PrefPill({ name, pref }: { name: string; pref: Preference | null }) {
  const label = pref ? PREFERENCE_LABELS[pref] : "—";
  const style: React.CSSProperties =
    pref === "limite_rigido"
      ? {
          color: "#f5f3fa",
          background: "rgba(20, 20, 28, 0.85)",
          border: "1px solid var(--border-strong)",
        }
      : pref === "amar" || pref === "aproveitar"
        ? {
            color: "var(--text-lilac)",
            background: "rgba(167, 139, 250, 0.1)",
            border: "1px solid rgba(167, 139, 250, 0.3)",
          }
        : pref === "curioso"
          ? {
              color: "var(--text-secondary)",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-soft)",
            }
          : {
              color: "var(--text-muted)",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-soft)",
            };
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={style}
    >
      <span className="muted-text">{name}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

function priorityTag(item: CompareItem): string | null {
  if (item.flags.attention) return "Ponto de atenção";
  if (item.flags.largeGap) return "Divergência grande";
  if (item.flags.sharedLimit) return "Limite compartilhado";
  if (item.flags.strongCompat) return "Compatibilidade forte";
  if (item.flags.sharedCuriosity) return "Curiosidade em comum";
  return null;
}
