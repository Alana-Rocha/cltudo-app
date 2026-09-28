// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildShareUrl, readSharedState } from '../shareState';

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
    window.history.replaceState(null, '', url.pathname + url.search);

    expect(readSharedState()).toEqual({
      'calculadora-ferias:gross': '3.000,00',
      'calculadora-ferias:daysSold': '10',
    });
  });

  it('remove o parâmetro da barra de endereço depois de ler', async () => {
    localStorage.setItem('calculadora-ferias:gross', JSON.stringify('Férias & 13º'));
    const url = new URL(buildShareUrl('calculadora-ferias'));
    window.history.replaceState(null, '', url.pathname + url.search);

    expect(readSharedState()?.['calculadora-ferias:gross']).toBe('Férias & 13º');
    await flushMicrotasks();
    expect(window.location.search).toBe('');
    expect(readSharedState()).toBeNull();
  });

  it('ignora um parâmetro corrompido', async () => {
    window.history.replaceState(null, '', '/calculadora-ferias?dados=%%%nao-e-base64');
    expect(readSharedState()).toBeNull();
    await flushMicrotasks();
  });
});
