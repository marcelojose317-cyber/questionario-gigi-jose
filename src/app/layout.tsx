import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privado",
  description: "Espaço privado para diálogo entre dois adultos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full app-bg">{children}</body>
    </html>
  );
}
