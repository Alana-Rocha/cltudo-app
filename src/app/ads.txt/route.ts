import { site } from '@/config/site';

// f08c47fec0942fa0 é o ID de certificação (TAG) do Google, igual para todo publisher do AdSense.
export function GET() {
  const publisherId = site.ads.adsenseClient.replace(/^ca-/, '');
  if (!publisherId) return new Response('Not found', { status: 404 });
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
