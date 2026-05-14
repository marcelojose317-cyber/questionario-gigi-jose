"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ProgressBar } from "@/components/ProgressBar";
import {
  PREFERENCES,
  PREFERENCE_LABELS,
  EXPERIENCES,
  EXPERIENCE_LABELS,
  type Preference,
  type Experience,
} from "@/data/questionnaire";

type Question = {
  id: string;
  category: string;
  activity: string;
  order: number;
};
type Group = { category: string; items: Question[] };

type ProfileState = {
  name: string;
  role: string;
  specificFetishes: string;
  painTolerance: number | null;
  orientation: string;
  medicalCondition: string;
  limitations: string;
};

type AnswerState = {
  preference: Preference | null;
  experience: Experience | null;
  notes: string;
};

type Props = {
  groups: Group[];
  profile: ProfileState;
  existing: Record<string, AnswerState>;
};

const EMPTY_ANSWER: AnswerState = {
  preference: null,
  experience: null,
  notes: "",
};

type Feedback = { type: "ok" | "error"; text: string } | null;

export function JoseForm({
  groups,
  profile: initialProfile,
  existing,
}: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(existing);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const existingIds = useMemo(
    () => new Set(Object.keys(existing)),
    [existing],
  );

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const answered = Object.values(answers).filter(
    (a) => a.preference !== null,
  ).length;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  function setAnswer(qid: string, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] ?? EMPTY_ANSWER), ...patch },
    }));
  }

  function setProfileField<K extends keyof ProfileState>(
    key: K,
    value: ProfileState[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload() {
    const toSave = Object.entries(answers)
      .filter(([qid, a]) => {
        if (existingIds.has(qid)) return true;
        return (
          a.preference !== null ||
          a.experience !== null ||
          a.notes.trim() !== ""
        );
      })
      .map(([questionId, a]) => ({
        questionId,
        preference: a.preference,
        experience: a.experience,
        notes: a.notes.trim() ? a.notes.trim() : null,
      }));

    const profilePayload = {
      role: profile.role.trim() || null,
      specificFetishes: profile.specificFetishes.trim() || null,
      painTolerance:
        typeof profile.painTolerance === "number"
          ? profile.painTolerance
          : null,
      orientation: profile.orientation.trim() || null,
      medicalCondition: profile.medicalCondition.trim() || null,
      limitations: profile.limitations.trim() || null,
    };

    return { profile: profilePayload, answers: toSave };
  }

  async function submit(redirectAfter: boolean) {
    setFeedback(null);
    const payload = buildPayload();

    startTransition(async () => {
      try {
        const res = await fetch("/api/responses/jose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Erro ${res.status}`);
        }
        if (redirectAfter) {
          setFeedback({ type: "ok", text: "Finalizado. Levando para o mapa…" });
          setTimeout(() => router.push("/"), 600);
        } else {
          setFeedback({ type: "ok", text: "Progresso salvo." });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha ao salvar";
        setFeedback({ type: "error", text: msg });
      }
    });
  }

  return (
    <div className="space-y-10 pb-32">
      <header className="space-y-3 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
          Suas respostas, <span className="lilac-text">José</span>
        </h1>
        <p className="muted-text text-base leading-relaxed">
          Responda no seu tempo. O foco é consentimento, limites e
          compatibilidade.{" "}
          <span className="lilac-text">Limite rígido é absoluto</span> — prevalece
          sobre qualquer outra preferência.
        </p>
      </header>

      <SafetyNotice />

      <ProfileBlock value={profile} onField={setProfileField} />

      <ProgressBlock total={total} answered={answered} percent={percent} />

      <div className="space-y-3">
        {groups.map((group) => (
          <CategoryAccordion
            key={group.category}
            group={group}
            answers={answers}
            onAnswer={setAnswer}
          />
        ))}
      </div>

      <Actions
        feedback={feedback}
        pending={pending}
        onSave={() => submit(false)}
        onFinish={() => submit(true)}
      />
    </div>
  );
}

function ProfileBlock({
  value,
  onField,
}: {
  value: ProfileState;
  onField: <K extends keyof ProfileState>(key: K, v: ProfileState[K]) => void;
}) {
  const tol = typeof value.painTolerance === "number" ? value.painTolerance : 5;
  return (
    <details open className="glass-card p-6 sm:p-7">
      <summary className="cursor-pointer flex items-center justify-between gap-3">
        <h2 className="section-title">Perfil</h2>
        <span className="text-[10px] uppercase tracking-[0.2em] muted-text">
          Abrir / fechar
        </span>
      </summary>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome" value={value.name} readOnly />
        <Field
          label="Função identificada"
          placeholder="Ex.: Dominante, Switch…"
          value={value.role}
          onChange={(v) => onField("role", v)}
        />
        <Field
          label="Fetiches específicos"
          placeholder="Texto livre"
          value={value.specificFetishes}
          onChange={(v) => onField("specificFetishes", v)}
        />
        <Field
          label="Orientação sexual"
          placeholder="Ex.: Heterossexual, Bissexual…"
          value={value.orientation}
          onChange={(v) => onField("orientation", v)}
        />
        <Field
          label="Condição médica"
          placeholder="Algo relevante para o cuidado"
          value={value.medicalCondition}
          onChange={(v) => onField("medicalCondition", v)}
        />
        <Field
          label="Limitação física/mental"
          placeholder="Algo que peça atenção"
          value={value.limitations}
          onChange={(v) => onField("limitations", v)}
        />

        <div className="sm:col-span-2">
          <span className="text-[11px] uppercase tracking-[0.18em] muted-text">
            Tolerância à dor
          </span>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={tol}
              onChange={(e) => onField("painTolerance", Number(e.target.value))}
              className="flex-1 lilac-range"
              aria-label="Tolerância à dor de 0 a 10"
            />
            <span className="lilac-text font-medium tabular-nums w-8 text-right text-lg">
              {tol}
            </span>
          </div>
          <div className="flex justify-between text-[10px] muted-text mt-1.5">
            <span>0 · nenhuma</span>
            <span>10 · máxima</span>
          </div>
        </div>
      </div>
    </details>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] muted-text">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full px-4 py-3 rounded-xl text-sm transition-colors"
        style={{
          background: readOnly
            ? "rgba(20, 20, 28, 0.4)"
            : "rgba(20, 20, 28, 0.6)",
          border: "1px solid var(--border-soft)",
          color: readOnly ? "var(--text-muted)" : "var(--text-primary)",
          outline: "none",
        }}
      />
    </label>
  );
}

function ProgressBlock({
  total,
  answered,
  percent,
}: {
  total: number;
  answered: number;
  percent: number;
}) {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] muted-text">
          Progresso geral
        </div>
        <div className="text-sm">
          <span className="muted-text">
            {answered} de {total}
          </span>{" "}
          <span className="lilac-text font-medium tabular-nums">
            · {percent}%
          </span>
        </div>
      </div>
      <ProgressBar value={percent} ariaLabel={`Progresso geral: ${percent}%`} />
    </div>
  );
}

function CategoryAccordion({
  group,
  answers,
  onAnswer,
}: {
  group: Group;
  answers: Record<string, AnswerState>;
  onAnswer: (qid: string, patch: Partial<AnswerState>) => void;
}) {
  const total = group.items.length;
  const answered = group.items.filter(
    (q) => answers[q.id]?.preference != null,
  ).length;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <details className="glass-card overflow-hidden" style={{ padding: 0 }}>
      <summary className="cursor-pointer p-5 sm:p-6 flex items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium tracking-tight truncate">
            {group.category}
          </div>
          <div className="text-xs muted-text mt-0.5">
            {answered} de {total} respondidas
          </div>
        </div>
        <div className="w-20 sm:w-40 shrink-0">
          <ProgressBar
            value={percent}
            ariaLabel={`${group.category}: ${percent}%`}
          />
        </div>
        <div className="lilac-text text-sm tabular-nums font-medium w-12 text-right shrink-0">
          {percent}%
        </div>
      </summary>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        {group.items.map((q, idx) => (
          <QuestionRow
            key={q.id}
            question={q}
            answer={answers[q.id] ?? EMPTY_ANSWER}
            onAnswer={onAnswer}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </details>
  );
}

function QuestionRow({
  question,
  answer,
  onAnswer,
  isFirst,
}: {
  question: Question;
  answer: AnswerState;
  onAnswer: (qid: string, patch: Partial<AnswerState>) => void;
  isFirst: boolean;
}) {
  const [showNotes, setShowNotes] = useState(answer.notes.length > 0);

  return (
    <div
      className="px-5 sm:px-6 py-5"
      style={
        isFirst ? undefined : { borderTop: "1px solid var(--border-soft)" }
      }
    >
      <div className="text-sm font-medium leading-snug">{question.activity}</div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.2em] muted-text mb-2">
          Preferência
        </div>
        <SegmentedGroup
          options={PREFERENCES.map((p) => ({
            value: p,
            label: PREFERENCE_LABELS[p],
            danger: p === "limite_rigido",
          }))}
          value={answer.preference}
          onChange={(v) =>
            onAnswer(question.id, { preference: v as Preference | null })
          }
        />
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.2em] muted-text mb-2">
          Experiência
        </div>
        <SegmentedGroup
          options={EXPERIENCES.map((e) => ({
            value: e,
            label: EXPERIENCE_LABELS[e],
          }))}
          value={answer.experience}
          onChange={(v) =>
            onAnswer(question.id, { experience: v as Experience | null })
          }
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowNotes((s) => !s)}
          className="text-xs lilac-text"
          aria-expanded={showNotes}
        >
          {showNotes ? "Ocultar notas" : "Adicionar notas (opcional)"}
        </button>
        {showNotes ? (
          <textarea
            value={answer.notes}
            onChange={(e) => onAnswer(question.id, { notes: e.target.value })}
            rows={2}
            placeholder="Notas privadas para você ou para conversar depois…"
            className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm resize-y transition-colors"
            style={{
              background: "rgba(20, 20, 28, 0.6)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function SegmentedGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; danger?: boolean }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        const style: React.CSSProperties = selected
          ? opt.danger
            ? {
                background: "rgba(20, 20, 28, 0.95)",
                color: "#fff",
                border: "1px solid var(--border-strong)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(196, 168, 255, 0.18)",
              }
            : {
                background: "var(--gradient-primary)",
                color: "#fff",
                border: "1px solid transparent",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.2), var(--glow-lilac)",
              }
          : {
              background: "rgba(255, 255, 255, 0.04)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-soft)",
            };
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(selected ? null : opt.value)}
            aria-pressed={selected}
            title={selected ? "Clique para desmarcar" : opt.label}
            className="px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
            style={style}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Actions({
  feedback,
  pending,
  onSave,
  onFinish,
}: {
  feedback: Feedback;
  pending: boolean;
  onSave: () => void;
  onFinish: () => void;
}) {
  return (
    <div
      className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky bottom-4 z-10"
      style={{ background: "rgba(10, 10, 15, 0.85)" }}
    >
      <div
        className="text-xs min-h-[1.25rem]"
        style={{
          color: feedback?.type === "error" ? "#fca5a5" : "var(--text-lilac)",
        }}
        role="status"
        aria-live="polite"
      >
        {feedback?.text ?? (pending ? "Salvando…" : "")}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="btn-secondary"
        >
          Salvar progresso
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={pending}
          className="btn-primary"
        >
          Finalizar questionário
        </button>
      </div>
    </div>
  );
}
