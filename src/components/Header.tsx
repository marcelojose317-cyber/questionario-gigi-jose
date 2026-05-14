"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/questionario/jose", label: "José" },
  { href: "/questionario/gigi", label: "Gigi" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: "rgba(10, 10, 15, 0.65)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span
            className="w-8 h-8 rounded-full"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--glow-lilac)",
            }}
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-medium tracking-tight">Privado</span>
            <span className="text-[10px] uppercase tracking-[0.22em] muted-text">
              G & J
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-full transition-colors"
                style={
                  active
                    ? {
                        color: "var(--text-primary)",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--border-soft)",
                      }
                    : {
                        color: "var(--text-muted)",
                      }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
