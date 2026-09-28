import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NumberInput } from '@/components/ui/NumberInput';

afterEach(cleanup);

function Harness(props: { initial?: string; min?: number; max?: number; decimal?: boolean; negative?: boolean }) {
  const [value, setValue] = useState(props.initial ?? '');
  return (
    <>
      <NumberInput id="n" label="Horas" value={value} onChange={setValue} {...props} />
      <output data-testid="raw">{value}</output>
    </>
  );
}

const field = () => screen.getByRole('spinbutton', { name: 'Horas' }) as HTMLInputElement;
const raw = () => screen.getByTestId('raw').textContent;

describe('NumberInput', () => {
  it('mostra vírgula na tela e guarda ponto no valor', () => {
    render(<Harness decimal />);
    fireEvent.change(field(), { target: { value: '10,5' } });
    expect(field().value).toBe('10,5');
    expect(raw()).toBe('10.5');
  });

  it('ignora letras e, sem decimal, também a vírgula', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '1a2,3' } });
    expect(raw()).toBe('123');
  });

  it('só aceita sinal negativo quando permitido', () => {
    render(<Harness negative />);
    fireEvent.change(field(), { target: { value: '-8' } });
    expect(raw()).toBe('-8');
    cleanup();
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '-8' } });
    expect(raw()).toBe('8');
  });

  it('setas do teclado e botões respeitam os limites', () => {
    render(<Harness initial="9" min={0} max={10} />);
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(raw()).toBe('10');
    expect((screen.getByRole('button', { name: 'Aumentar' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Diminuir' }));
    expect(raw()).toBe('9');
  });

  it('valor fora da faixa mostra aviso próprio em vez do balão do navegador', () => {
    render(<Harness initial="12" max={10} />);
    expect(screen.getByText('Use no máximo 10.')).toBeTruthy();
    expect(field().getAttribute('aria-invalid')).toBe('true');
  });
});
