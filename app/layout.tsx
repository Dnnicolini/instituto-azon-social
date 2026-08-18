import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instituto Azon Social",
  description: "Ancestralidade, cuidado e transformação social em Sepetiba, Rio de Janeiro.",
  metadataBase: new URL("https://azonsocial.org"),
  openGraph: { title: "Instituto Azon Social", description: "Ações sociais, culturais e ambientais que fortalecem pessoas e territórios.", type: "website" },
  other: { "codex-preview": "development" },
  icons: { icon: "/azon-social-logo.png", shortcut: "/azon-social-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
