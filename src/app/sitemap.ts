import type { MetadataRoute } from 'next';
import { registry } from '@/registry';

const BASE_URL = process.env.SITE_URL ?? 'https://cltudo.example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
  ];

  const calculatorEntries: MetadataRoute.Sitemap = registry
    .filter((c) => c.status === 'available')
    .map((c) => ({
      url: `${BASE_URL}/${c.slug}`,
      changeFrequency: 'yearly',
      priority: 0.8,
    }));

  return [...staticEntries, ...calculatorEntries];
}
