import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DateInput } from '@/components/ui/DateInput';
import { formatBrDate } from '@/lib/dates';

afterEach(cleanup);

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <DateInput id="d" label="Data de admissão" value={value} onChange={setValue} />;
}

const field = () => screen.getByRole('textbox', { name: 'Data de admissão' }) as HTMLInputElement;
const trigger = () => screen.getByRole('button', { name: 'Abrir calendário: Data de admissão' });
const focusedLabel = () => document.activeElement?.getAttribute('aria-label');

describe('DateInput', () => {
  it('continua aceitando digitação com máscara', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '15032024' } });
    expect(field().value).toBe('15/03/2024');
  });

  it('abre no mês da data digitada, com o dia em foco, e escolhe outro dia', () => {
    render(<Harness initial="15/03/2024" />);
    fireEvent.click(trigger());
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Março de 2024')).toBeTruthy();
    expect(focusedLabel()).toBe('sexta-feira, 15 de março de 2024');

    fireEvent.click(screen.getByRole('button', { name: 'quarta-feira, 20 de março de 2024' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field().value).toBe('20/03/2024');
  });

  it('teclado: setas movem o dia e PageDown mantém o dia no limite do mês', () => {
    render(<Harness initial="31/01/2026" />);
    fireEvent.click(trigger());
    const grid = screen.getByRole('grid');

    fireEvent.keyDown(grid, { key: 'PageDown' });
    expect(focusedLabel()).toBe('sábado, 28 de fevereiro de 2026');
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(focusedLabel()).toBe('domingo, 1 de março de 2026');
    fireEvent.keyDown(grid, { key: 'ArrowUp' });
    expect(focusedLabel()).toBe('domingo, 22 de fevereiro de 2026');
    fireEvent.keyDown(grid, { key: 'PageUp', shiftKey: true });
    expect(focusedLabel()).toBe('sábado, 22 de fevereiro de 2025');
  });

  it('Esc fecha e devolve o foco ao botão do calendário', () => {
    render(<Harness />);
    fireEvent.click(trigger());
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('clicar no título leva à escolha de ano e depois de mês', () => {
    render(<Harness initial="10/06/2026" />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Junho de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Anos anteriores' }));
    fireEvent.click(screen.getByRole('button', { name: '2015' }));
    fireEvent.click(screen.getByRole('button', { name: 'mar' }));

    expect(screen.getByText('Março de 2015')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'terça-feira, 10 de março de 2015' }));
    expect(field().value).toBe('10/03/2015');
  });

  it('"Hoje" preenche a data de hoje', () => {
    render(<Harness />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    const now = new Date();
    expect(field().value).toBe(formatBrDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))));
  });
});
