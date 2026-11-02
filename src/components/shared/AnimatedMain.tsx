'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

/**
 * Conteúdo da página surge suavemente ao navegar entre páginas. Só anima depois da primeira
 * página, para não atrasar a carga inicial, e sem remontar nada: o AdSlot continua no mesmo lugar.
 */
export function AnimatedMain({ className, children }: { className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mainRef.current?.animate(
      { opacity: [0, 1], transform: ['translateY(6px)', 'none'] },
      { duration: 200, easing: 'ease-out' }
    );
  }, [pathname]);

  return (
    <main ref={mainRef} className={className}>
      {children}
    </main>
  );
}
