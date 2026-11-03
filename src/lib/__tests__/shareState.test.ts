// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildShareUrl, readSharedState, buildWhatsAppUrl } from '../shareState';

const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  localStorage.clear();
  window.history.replaceState(null, '', '/calculadora-ferias');
  await flushMicrotasks();
});

describe('shareState', () => {
  it('o link carrega só as chaves da calculadora e volta com os mesmos valores', async () => {
    localStorage.setItem('calculadora-ferias:gross', JSON.stringify('3.000,00'));
    localStorage.setItem('calculadora-ferias:daysSold', JSON.stringify('10'));
    localStorage.setItem('calculadora-rescisao:gross', JSON.stringify('9.999,00'));
    localStorage.setItem('theme', JSON.stringify('dark'));

    const url = new URL(buildShareUrl('calculadora-ferias'));
    window.history.replaceState(null, '', url.pathname + url.hash);

    expect(readSharedState()).toEqual({
      'calculadora-ferias:gross': '3.000,00',
      'calculadora-ferias:daysSold': '10',
    });
  });

  it('leva os dados no hash, que o navegador não envia ao servidor', () => {
    localStorage.setItem('calculadora-ferias:gross', JSON.stringify('3.000,00'));
    const url = new URL(buildShareUrl('calculadora-ferias'));

    expect(url.search).toBe('');
    expect(url.hash).toMatch(/^#dados=/);
  });

  it('remove o parâmetro da barra de endereço depois de ler', async () => {
    localStorage.setItem('calculadora-ferias:gross', JSON.stringify('Férias & 13º'));
    const url = new URL(buildShareUrl('calculadora-ferias'));
    window.history.replaceState(null, '', url.pathname + url.hash);

    expect(readSharedState()?.['calculadora-ferias:gross']).toBe('Férias & 13º');
    await flushMicrotasks();
    expect(window.location.hash).toBe('');
    expect(readSharedState()).toBeNull();
  });

  it('ignora um parâmetro corrompido', async () => {
    window.history.replaceState(null, '', '/calculadora-ferias#dados=%%%nao-e-base64');
    expect(readSharedState()).toBeNull();
    await flushMicrotasks();
  });
});

describe('buildWhatsAppUrl', () => {
  it('leva a mensagem e o endereço limpo, com UTM e sem os valores do cálculo', () => {
    const url = new URL(buildWhatsAppUrl('https://cltudo.com.br/calculadora-fgts#dados=abc', 'FGTS no CLTudo'));

    expect(url.origin).toBe('https://wa.me');
    expect(url.searchParams.get('text')).toBe(
      'FGTS no CLTudo\nhttps://cltudo.com.br/calculadora-fgts?utm_source=whatsapp&utm_medium=share',
    );
    expect(url.href).not.toContain('dados');
    expect(url.search).toContain('FGTS%20no%20CLTudo'); // o WhatsApp espera %20, não +
  });
});
