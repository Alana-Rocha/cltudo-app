import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const highlights = ['Salário líquido', 'Rescisão', 'Férias', '13º', 'FGTS', 'CLT x PJ'];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        color: 'white',
        backgroundImage: 'linear-gradient(135deg, #22c55e, #166534)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <svg width="112" height="112" viewBox="8 8 24 24" fill="none">
          <path d="M29.96 19.13A10 10 0 1 1 20.87 10.04" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M14.5 20.5l4 4 10-11.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 104, fontWeight: 700 }}>{site.name}</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 50, fontWeight: 700, lineHeight: 1.15 }}>{site.tagline}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 48 }}>
        {highlights.map((item) => (
          <div
            key={item}
            style={{ padding: '10px 22px', borderRadius: 999, fontSize: 28, backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
