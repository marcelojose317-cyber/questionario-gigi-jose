import type { ReactNode } from "react";
import { Header } from "./Header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {children}
      </main>
      <footer className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] muted-text">
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: "var(--text-lilac)" }}
          />
          Espaço privado · Apenas adultos · Consentimento e respeito
        </div>
      </footer>
    </div>
  );
}
