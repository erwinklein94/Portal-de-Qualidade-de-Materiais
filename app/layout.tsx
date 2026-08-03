import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Portal de Qualidade de Materiais | Rumo",
  description:
    "Ambiente integrado para gestão da qualidade de materiais e relacionamento com fornecedores Rumo.",
  icons: {
    icon: `${basePath}/rumo-logo.png`,
    shortcut: `${basePath}/rumo-logo.png`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
