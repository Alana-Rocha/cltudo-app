import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CookieBanner, CookiePreferencesButton } from '@/components/shared/CookieBanner';
import { SponsoredOffer } from '@/components/shared/SponsoredOffer';

vi.mock('next/navigation', () => ({ usePathname: () => '/calculadora-clt-x-pj' }));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('CookieBanner', () => {
  it('aparece enquanto não há escolha e some depois de recusar, guardando a decisão', () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).toBeNull();
    expect(JSON.parse(localStorage.getItem('cookie-consent')!).choice).toBe('rejected');
  });

  it('"Preferências de cookies" reabre o aviso', () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ choice: 'accepted', version: 1 }));
    render(
      <>
        <CookieBanner />
        <CookiePreferencesButton />
      </>
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Preferências de cookies' })));
    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeTruthy();
  });

  it('uma escolha de versão antiga pede consentimento de novo', () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ choice: 'accepted', version: 0 }));
    render(<CookieBanner />);
    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeTruthy();
  });
});

describe('SponsoredOffer', () => {
  const offer = {
    partner: 'Parceiro Teste',
    title: 'Abra seu CNPJ',
    description: 'Contabilidade online.',
    cta: 'Conhecer',
    href: 'https://parceiro.example.com/?utm_source=cltudo',
  };

  it('sem oferta cadastrada para a página, não renderiza nada', () => {
    const { container } = render(<SponsoredOffer offers={{}} />);
    expect(container.innerHTML).toBe('');
  });

  it('mostra a oferta identificada como parceiro, com link patrocinado', () => {
    render(<SponsoredOffer offers={{ 'calculadora-clt-x-pj': offer }} />);
    expect(screen.getByText(/Parceiro · Parceiro Teste/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /Conhecer/ });
    expect(link.getAttribute('rel')).toContain('sponsored');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
