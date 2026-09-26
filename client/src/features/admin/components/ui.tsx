import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import type { AdminUser } from '../types';

// The admin's denser building blocks (per the design: 4px badges, 13px tables, 10px cards).

const ROLE_STYLE: Record<Role, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'gradient-brand text-white' },
  content_mod: { label: 'Content Mod', className: 'bg-primary text-white' },
  community_mgr: { label: 'Community Mgr', className: 'bg-community text-white' },
  user: { label: 'User', className: 'bg-surface-2 text-text-secondary' },
};
export function AdminRoleBadge({ role }: { role: Role }) {
  const r = ROLE_STYLE[role];
  return <span className={cn('inline-flex shrink-0 items-center rounded-[4px] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', r.className)}>{r.label}</span>;
}

const STATUS_STYLE: Record<AdminUser['status'], { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-success' },
  suspended: { label: 'Suspended', className: 'text-[#B68A00]' },
  banned: { label: 'Banned', className: 'text-error' },
};
export function StatusBadge({ status, reason }: { status: AdminUser['status']; reason?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', s.className)} title={reason || undefined}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:border-primary sm:max-w-xs">
      <Search size={15} className="shrink-0 text-text-secondary" aria-hidden />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-tertiary" />
    </label>
  );
}

export function FilterSelect<T extends string>({ label, value, onChange, options }: { label: string; value: T | ''; onChange: (v: T | '') => void; options: { value: T; label: string }[] }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T | '')}
      className="h-9 rounded-md border border-border bg-card px-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
    >
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TableCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}
export const th = 'bg-[#F4F5F7] px-3 py-2.5 text-left text-[11px] font-bold tracking-[0.05em] whitespace-nowrap text-text-secondary uppercase';
export const td = 'px-3 py-2.5 align-middle text-[13px]';

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const btn = 'flex size-7 items-center justify-center rounded-[5px] border border-border bg-card text-text-primary disabled:bg-[#F4F5F7] disabled:text-text-tertiary';
  return (
    <div className="flex items-center justify-between border-t border-border px-3.5 py-2.5 text-xs text-text-secondary">
      <span>
        Showing {from}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <span className="px-2">
          {page} / {pages}
        </span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
