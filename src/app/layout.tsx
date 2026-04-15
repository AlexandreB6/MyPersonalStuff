import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutGrid, Film, Paintbrush, BookOpen, LogIn, LogOut } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { DemoBanner } from "@/components/DemoBanner";
import { Toaster } from "sonner";
import { isOwnerGateEnabled, isOwnerAuthenticated } from "@/lib/owner";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Police principale — Plus Jakarta Sans via Google Fonts */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyPersonalStuff",
  description: "Mon espace personnel",
};

/**
 * Layout racine de l'application.
 * Inclut le header sticky avec navigation desktop/mobile et le conteneur principal.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showOwnerButton = isOwnerGateEnabled();
  const isOwner = showOwnerButton && (await isOwnerAuthenticated());

  return (
    <html lang="fr" className="dark">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {/* Skip-to-content link — visible uniquement au focus clavier */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium"
        >
          Aller au contenu principal
        </a>

        {IS_DEMO && <DemoBanner />}

        {/* Header sticky avec navigation */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between md:justify-start gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <LayoutGrid className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold tracking-tight">MyPersonalStuff</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 ml-8 text-sm" aria-label="Navigation principale">
              <Link href="/cinema" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" aria-hidden="true" />
                Cinema
              </Link>
              <Link href="/peinture" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                Peinture
              </Link>
              <Link href="/manga" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Manga
              </Link>
            </nav>
            {showOwnerButton && (
              <div className="hidden md:flex ml-auto">
                {isOwner ? (
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Se déconnecter"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      Déconnexion
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Se connecter"
                  >
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    Connexion
                  </Link>
                )}
              </div>
            )}
            <MobileNav />
          </div>
        </header>

        {/* Conteneur principal — cible du skip-link */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <Toaster richColors position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
