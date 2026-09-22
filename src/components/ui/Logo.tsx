export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
      <rect x="9" y="8" width="22" height="8" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="12" y="11" width="11" height="2" rx="1" fill="#15803d" />
      <g fill="white">
        <circle cx="12.5" cy="22.5" r="2" />
        <circle cx="20" cy="22.5" r="2" />
        <circle cx="27.5" cy="22.5" r="2" />
        <circle cx="12.5" cy="29.5" r="2" />
        <circle cx="20" cy="29.5" r="2" />
        <circle cx="27.5" cy="29.5" r="2" />
      </g>
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
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
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className="text-lg font-semibold leading-tight text-gray-900">
        Calculadora<span className="font-normal text-gray-500"> Trabalhista</span>
      </span>
    </span>
  );
}
