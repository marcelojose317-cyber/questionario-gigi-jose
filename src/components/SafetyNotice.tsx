export function SafetyNotice() {
  return (
    <div className="soft-card p-5">
      <div
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
        style={{ color: "var(--text-lilac)" }}
      >
        <span
          className="inline-block w-1 h-1 rounded-full"
          style={{ background: "var(--text-lilac)" }}
          aria-hidden
        />
        Espaço apenas para adultos · Conteúdo privado
      </div>
      <p className="mt-3 text-sm muted-text leading-relaxed">
        Este site existe para apoiar uma conversa adulta entre duas pessoas
        sobre consentimento, limites e compatibilidade. As respostas ficam
        entre vocês. <span className="lilac-text">Limites rígidos são absolutos</span>:
        prevalecem sobre qualquer outra preferência.
      </p>
    </div>
  );
}
