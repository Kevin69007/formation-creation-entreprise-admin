import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formation Entreprise API",
  description: "Backend API for Formation Entreprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
