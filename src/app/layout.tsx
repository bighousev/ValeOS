import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValeOS",
  description: "Operação clara, do primeiro contato à entrega.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
