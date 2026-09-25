import type { ReactNode } from 'react';

// Sticky top bar for main app pages.
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <h1 className="text-[22px] font-bold tracking-tight text-text-primary">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
