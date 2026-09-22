import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Calculadora Trabalhista',
    template: '%s | Calculadora Trabalhista',
  },
  description:
    'Calcule salário, rescisão, férias, 13º, FGTS e outros valores trabalhistas de forma simples.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <a href="/" className="text-lg font-semibold text-brand-700">
              Calculadora Trabalhista
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-sm text-gray-500">
          Os valores apresentados são estimativas com finalidade informativa e podem variar
          conforme regras vigentes, convenções coletivas, contrato de trabalho, benefícios e
          situações específicas. Para valores oficiais, consulte seu holerite, a empresa, um
          contador ou um advogado trabalhista.
        </footer>
      </body>
    </html>
  );
}
