import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SafetyNotice } from "@/components/SafetyNotice";
import { prisma } from "@/lib/prisma";
import {
  CATEGORIES,
  PREFERENCE_LABELS,
  EXPERIENCE_LABELS,
  type Category,
  type Experience,
  type Preference,
} from "@/data/questionnaire";

export const dynamic = "force-dynamic";

type GigiAnswer = {
  questionId: string;
  category: string;
  activity: string;
  order: number;
  experience: string | null;
  preference: string | null;
  notes: string | null;
  updatedAt: Date;
};

export default async function Page() {
  const user = await prisma.user.findUnique({
    where: { slug: "gigi" },
    include: {
      answers: { include: { question: true } },
    },
  });

  if (!user) {
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

  const { answers, ...profile } = user;

  const flat: GigiAnswer[] = answers.map((a) => ({
    questionId: a.questionId,
    category: a.question.category,
    activity: a.question.activity,
    order: a.question.order,
    experience: a.experience,
    preference: a.preference,
    notes: a.notes,
    updatedAt: a.updatedAt,
  }));

  const groups = CATEGORIES.filter((c) => c !== "Notas Adicionais").map(
    (category) => ({
      category,
      items: flat
        .filter((a) => a.category === category)
        .sort((a, b) => a.order - b.order),
    }),
  );

  const totalAnswered = flat.filter((a) => a.preference !== null).length;

  return (
    <AppShell>
      <div className="space-y-10">
        <div>
          <Link href="/" className="btn-secondary text-xs">
            ← Voltar ao dashboard
          </Link>
        </div>

        <header className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Respostas de <span className="lilac-text">{profile.name}</span>
          </h1>
          <p className="muted-text text-base leading-relaxed">
            Apenas leitura. {totalAnswered} preferências registradas, organizadas
            por categoria.{" "}
            <span className="lilac-text">
              Limite rígido é absoluto
            </span>
            : prevalece sobre qualquer outra preferência.
          </p>
        </header>

        <SafetyNotice />

        <ProfileCard profile={profile} />

        <section className="space-y-3">
          <h2 className="section-title">Respostas por categoria</h2>
          <div className="space-y-3">
            {groups.map((group) => (
              <CategoryBlock
                key={group.category}
                category={group.category}
                items={group.items}
              />
            ))}
          </div>
        </section>

        <div className="pt-2">
          <Link href="/" className="btn-primary">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

type ProfileLike = {
  name: string;
  role: string | null;
  specificFetishes: string | null;
  painTolerance: number | null;
  orientation: string | null;
  medicalCondition: string | null;
  limitations: string | null;
};

function ProfileCard({ profile }: { profile: ProfileLike }) {
  const fields: { label: string; value: string }[] = [
    { label: "Nome", value: profile.name },
    { label: "Função identificada", value: profile.role ?? "—" },
    {
      label: "Tolerância à dor",
      value:
        typeof profile.painTolerance === "number"
          ? `${profile.painTolerance} / 10`
          : "—",
    },
    { label: "Orientação sexual", value: profile.orientation ?? "—" },
    { label: "Fetiches específicos", value: profile.specificFetishes ?? "—" },
    { label: "Condição médica", value: profile.medicalCondition ?? "—" },
    {
      label: "Limitação física/mental",
      value: profile.limitations ?? "—",
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="section-title">Perfil</h2>
      <div className="glass-card p-6 sm:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] muted-text">
                {f.label}
              </div>
              <div
                className="mt-1.5 text-sm leading-relaxed break-words"
                style={{ color: "var(--text-primary)" }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  items,
}: {
  category: Category;
  items: GigiAnswer[];
}) {
  const total = items.length;
  const answered = items.filter((i) => i.preference !== null).length;

  return (
    <details className="glass-card overflow-hidden" style={{ padding: 0 }}>
      <summary className="cursor-pointer p-5 sm:p-6 flex items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium tracking-tight truncate">
            {category}
          </div>
          <div className="text-xs muted-text mt-0.5">
            {answered} de {total} respondidas
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] muted-text shrink-0">
          Abrir / fechar
        </span>
      </summary>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        {items.map((item, idx) => (
          <AnswerRow
            key={item.questionId}
            item={item}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </details>
  );
}

function AnswerRow({
  item,
  isFirst,
}: {
  item: GigiAnswer;
  isFirst: boolean;
}) {
  const pref = item.preference as Preference | null;
  const exp = item.experience as Experience | null;

  return (
    <div
      className="px-5 sm:px-6 py-4"
      style={
        isFirst ? undefined : { borderTop: "1px solid var(--border-soft)" }
      }
    >
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="min-w-0 flex-1 text-sm leading-snug">
          {item.activity}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {exp ? <ExperienceTag exp={exp} /> : null}
          <PreferencePill pref={pref} />
        </div>
      </div>
      {item.notes ? (
        <div
          className="mt-3 text-xs leading-relaxed"
          style={{
            color: "var(--text-secondary)",
            borderLeft: "2px solid var(--border-medium)",
            paddingLeft: "0.75rem",
          }}
        >
          {item.notes}
        </div>
      ) : null}
    </div>
  );
}

function PreferencePill({ pref }: { pref: Preference | null }) {
  const label = pref ? PREFERENCE_LABELS[pref] : "Sem resposta";
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
          : pref === "tolerar"
            ? {
                color: "var(--text-muted)",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-soft)",
              }
            : {
                color: "var(--text-muted)",
                background: "transparent",
                border: "1px dashed var(--border-soft)",
              };
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={style}
    >
      {label}
    </span>
  );
}

function ExperienceTag({ exp }: { exp: Experience }) {
  const short =
    exp === "nenhum"
      ? "Nenhum"
      : exp === "inic"
        ? "Iniciante"
        : exp === "int"
          ? "Intermediário"
          : "Avançado";
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] whitespace-nowrap"
      style={{
        color: "var(--text-muted)",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-soft)",
      }}
      title={EXPERIENCE_LABELS[exp]}
    >
      {short}
    </span>
  );
}
