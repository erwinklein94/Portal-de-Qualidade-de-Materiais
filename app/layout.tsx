import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Qualidade de Materiais | Rumo",
  description:
    "Ambiente integrado para gestão da qualidade de materiais e relacionamento com fornecedores Rumo.",
  icons: {
    icon: "/rumo-logo.png",
    shortcut: "/rumo-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
