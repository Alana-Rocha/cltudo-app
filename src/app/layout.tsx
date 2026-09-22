import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Calculadora Trabalhista',
    template: '%s | Calculadora Trabalhista',
  },
  description:
    'Calcule salário, rescisão, férias, 13º, FGTS e outros valores trabalhistas de forma simples.',
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
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <a href="/" className="transition hover:opacity-80">
              <Logo />
            </a>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t">
          <p className="mx-auto max-w-4xl px-4 py-8 text-sm text-gray-500">
            Os valores apresentados são estimativas com finalidade informativa e podem variar
            conforme regras vigentes, convenções coletivas, contrato de trabalho, benefícios e
            situações específicas. Para valores oficiais, consulte seu holerite, a empresa, um
            contador ou um advogado trabalhista.
          </p>
        </footer>
      </body>
    </html>
  );
}
