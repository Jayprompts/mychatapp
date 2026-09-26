import type { ReactNode } from 'react';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/cn';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

const ROLE_META: Record<Role, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'gradient-brand text-white' },
  content_mod: { label: 'Content Mod', className: 'bg-primary-solid text-white' },
  community_mgr: { label: 'Community Mgr', className: 'bg-community text-white' },
  user: { label: 'Member', className: 'bg-surface-2 text-text-secondary' },
};

export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
