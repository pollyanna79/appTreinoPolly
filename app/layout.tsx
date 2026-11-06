import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treino+ | Seu treino, no seu ritmo",
  description: "Acompanhe seus treinos e evolua com consistência.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "const tema = localStorage.getItem('treino-theme'); if (tema === 'light' || tema === 'dark') document.documentElement.dataset.theme = tema;",
          }}
        />
        {children}
      </body>
    </html>
  );
}
