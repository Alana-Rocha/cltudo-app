import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { RelatedCalculators } from '@/components/shared/RelatedCalculators';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SiteNav } from '@/components/shared/SiteNav';
import { SiteFooter } from '@/components/shared/SiteFooter';
import { AdSlot } from '@/components/shared/AdSlot';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { ThirdPartyScripts } from '@/components/shared/ThirdPartyScripts';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'CLTudo — calculadora trabalhista',
    template: '%s | CLTudo',
  },
  description:
    'CLTudo: calcule salário líquido, rescisão, férias, 13º, FGTS e compare CLT x PJ, com as regras de 2026 e o passo a passo de cada conta.',
  applicationName: 'CLTudo',
};

// Aplica o tema salvo (ou a preferência do sistema) antes da 1ª pintura,
// evitando o flash de tela clara ao carregar em modo escuro.
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
  // Imprime sempre no tema claro (texto claro some no papel).
  var wasDark = false;
  window.addEventListener('beforeprint', function () {
    wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
  });
  window.addEventListener('afterprint', function () {
    if (wasDark) document.documentElement.classList.add('dark');
  });
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="transition hover:opacity-80">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <SiteNav />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <Breadcrumb />
          {children}
          <AdSlot />
          <RelatedCalculators />
        </main>
        <SiteFooter />
        <CookieBanner />
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
