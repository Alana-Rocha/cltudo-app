import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLiveCalculation, type FieldError } from '../useLiveCalculation';
import type { CalculationResult } from '@/engine/types';

const fakeResult: CalculationResult = {
  items: [],
  totals: { gross: 100, deductions: 0, net: 100 },
  steps: [],
  included: [],
  excluded: [],
  warnings: [],
  rulesVersion: 'test',
};

const submitEvent = { preventDefault() {} } as React.FormEvent;

describe('useLiveCalculation', () => {
  it('repassa o resultado sem precisar de submit', () => {
    const { result } = renderHook(() => useLiveCalculation(fakeResult));
    expect(result.current.result).toBe(fakeResult);
    expect(result.current.error).toBeUndefined();
  });

  it('esconde o erro até o primeiro submit', () => {
    const { result } = renderHook(() => useLiveCalculation('Campo obrigatório'));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeUndefined();

    act(() => result.current.handleSubmit(submitEvent));
    expect(result.current.error).toBe('Campo obrigatório');
  });

  it('errorFor só devolve a mensagem para o campo com erro', () => {
    const outcome: FieldError = { field: 'admission', message: 'Data inválida' };
    const { result } = renderHook(() => useLiveCalculation(outcome));
    act(() => result.current.handleSubmit(submitEvent));

    expect(result.current.errorFor('admission')).toBe('Data inválida');
    expect(result.current.errorFor('gross')).toBeUndefined();
  });

  it('o erro some assim que o cálculo volta a ser válido', () => {
    const { result, rerender } = renderHook(({ outcome }) => useLiveCalculation(outcome), {
      initialProps: { outcome: 'Campo obrigatório' as CalculationResult | string },
    });
    act(() => result.current.handleSubmit(submitEvent));
    expect(result.current.error).toBe('Campo obrigatório');

    rerender({ outcome: fakeResult });
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBe(fakeResult);
  });
});
