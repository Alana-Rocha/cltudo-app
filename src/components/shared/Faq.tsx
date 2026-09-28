import { ChevronDown } from 'lucide-react';

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
    <section className="mt-12 max-w-3xl print:hidden" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-semibold">
        Perguntas frequentes
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <details key={i} className="card group px-5 py-4" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
