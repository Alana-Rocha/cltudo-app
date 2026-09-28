import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Select } from '@/components/ui/Select';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

const OPTIONS = [
  { value: 'percent', label: 'Percentual (%)' },
  { value: 'amount', label: 'Valor em reais a mais' },
  { value: 'newSalary', label: 'Novo salário bruto' },
];

function Harness({ onChange = () => {} }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState('percent');
  return (
    <>
      <Select
        id="mode"
        label="Como informar"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
        options={OPTIONS}
      />
      <button type="button">fora</button>
    </>
  );
}

const combobox = () => screen.getByRole('combobox', { name: 'Como informar' });

describe('Select', () => {
  it('abre com clique e escolhe uma opção', () => {
    render(<Harness />);
    fireEvent.click(combobox());
    expect(combobox().getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('option', { name: 'Novo salário bruto' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(combobox().textContent).toContain('Novo salário bruto');
  });

  it('teclado: seta para baixo abre, seta move, Enter escolhe', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    expect(combobox().getAttribute('aria-activedescendant')).toBe('mode-option-0');

    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    expect(combobox().getAttribute('aria-activedescendant')).toBe('mode-option-1');
    fireEvent.keyDown(combobox(), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('amount');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Esc fecha sem mudar o valor', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    fireEvent.keyDown(combobox(), { key: 'End' });
    fireEvent.keyDown(combobox(), { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('digitar a primeira letra pula para a opção, ignorando acentos', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(combobox(), { key: 'n' });
    expect(onChange).toHaveBeenCalledWith('newSalary');
  });

  it('clicar fora fecha a lista', () => {
    render(<Harness />);
    fireEvent.click(combobox());
    fireEvent.pointerDown(screen.getByRole('button', { name: 'fora' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marca a opção escolhida com aria-selected', () => {
    render(<Harness />);
    fireEvent.click(combobox());
    expect(screen.getByRole('option', { name: 'Percentual (%)' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Valor em reais a mais' }).getAttribute('aria-selected')).toBe('false');
  });
});
