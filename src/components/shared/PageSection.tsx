/** Seção de texto das páginas institucionais (privacidade, sobre, contato). */
export function PageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-gray-600">{children}</div>
    </section>
  );
}
