import { useId } from 'react';

/** "C" de CLT com um ✓ saindo pela abertura: a conta fechada e conferida. */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
      <path d="M29.96 19.13A10 10 0 1 1 20.87 10.04" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M14.5 20.5l4 4 10-11.5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="text-xl leading-tight tracking-tight text-gray-900" aria-hidden="true">
        <span className="font-extrabold">CLT</span>
        <span className="font-semibold text-brand-500">udo</span>
      </span>
      <span className="sr-only">CLTudo — calculadora trabalhista</span>
    </span>
  );
}
