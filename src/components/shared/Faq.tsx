export type FaqItem = { question: string; answer: string };

export function Faq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section className="mt-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-semibold">
        Perguntas frequentes
      </h2>
      <dl className="mt-4 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <dt className="font-medium">{item.question}</dt>
            <dd className="mt-1 text-sm text-gray-600">{item.answer}</dd>
          </div>
        ))}
      </dl>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
