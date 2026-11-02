'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '/calculadora-salario-liquido', label: 'Salário líquido' },
  { href: '/calculadora-rescisao', label: 'Rescisão' },
  { href: '/calculadora-ferias', label: 'Férias' },
  { href: '/calculadora-clt-x-pj', label: 'CLT x PJ' },
];

type Pill = { left: number; width: number; visible: boolean; slide: boolean };

export function SiteNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<Pill | null>(null);

  const activeHref = LINKS.some((link) => link.href === pathname) ? pathname : null;
  const highlighted = hovered ?? activeHref;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    function place() {
      const link = highlighted ? nav!.querySelector<HTMLElement>(`a[href="${highlighted}"]`) : null;
      setPill((prev) =>
        link?.offsetWidth
          ? // Só desliza se já estava visível; ao reaparecer, surge direto no lugar.
            { left: link.offsetLeft, width: link.offsetWidth, visible: true, slide: Boolean(prev?.visible) }
          : { left: prev?.left ?? 0, width: prev?.width ?? 0, visible: false, slide: false }
      );
    }
    place();
    // A largura dos links muda quando a fonte carrega e quando o menu volta a aparecer no breakpoint.
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [highlighted]);

  const linkProps = (href: string) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === 'mouse') setHovered(href);
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(':focus-visible')) setHovered(href);
    },
    onBlur: () => setHovered(null),
    className: `relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
      highlighted === href ? 'text-brand-700' : 'text-gray-600'
    } ${
      // Até medir (e sem JS) o link ativo mantém o fundo próprio, para não piscar ao carregar.
      !pill && activeHref === href ? 'bg-brand-50' : ''
    }`,
  });

  return (
    <nav
      ref={navRef}
      aria-label="Principais calculadoras"
      className="relative hidden items-center gap-1 md:flex"
      onPointerLeave={() => setHovered(null)}
    >
      {pill && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 rounded-md bg-brand-50 duration-300 ease-out motion-reduce:transition-none ${
            pill.slide ? 'transition-[transform,width,opacity]' : 'transition-opacity'
          } ${pill.visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      )}
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={activeHref === link.href ? 'page' : undefined} {...linkProps(link.href)}>
          {link.label}
        </Link>
      ))}
      <Link href="/" {...linkProps('/')}>
        Todas
      </Link>
    </nav>
  );
}
