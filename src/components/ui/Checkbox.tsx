'use client';

import { Check } from 'lucide-react';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  description?: string;
};

/** O input nativo continua lá (teclado e leitor de tela); só a caixa é desenhada. */
export function Checkbox({ checked, onChange, children, description }: Props) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1 ${
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </span>
      <span>
        <span className={description ? 'font-medium' : undefined}>{children}</span>
        {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
      </span>
    </label>
  );
}
