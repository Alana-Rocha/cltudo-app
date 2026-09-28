import type { MetadataRoute } from 'next';
import { registry } from '@/registry';
import { site } from '@/config/site';

const BASE_URL = site.url;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
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
