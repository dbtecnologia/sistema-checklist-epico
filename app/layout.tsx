import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Épico Checklists", description: "Gestão de auditorias, conformidade e planos de ação" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }

