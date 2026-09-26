import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ArrowLeft, Flag, LayoutDashboard, LogOut, Menu, Newspaper, PanelLeftClose, PanelLeftOpen, ScrollText, Settings, ShieldCheck, UserCog, Users, UsersRound, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LogoMark } from '@/components/ui/Logo';
import { useLogout, useMe } from '@/features/auth/api';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import { useOpenReportCount } from '../api';
import { AdminRoleBadge } from './ui';

type Item = { to: string; label: string; icon: LucideIcon; roles?: Role[]; end?: boolean };
// Which screens each role sees (the server enforces the same rules on every request).
const NAV: Item[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: Flag, roles: ['content_mod'] },
  { to: '/admin/posts', label: 'Blog posts', icon: Newspaper, roles: ['content_mod'] },
  { to: '/admin/communities', label: 'Communities', icon: UsersRound, roles: ['community_mgr'] },
  { to: '/admin/roles', label: 'Role management', icon: UserCog, roles: ['super_admin'] },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: ['super_admin'] },
];
const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'User management',
  '/admin/reports': 'Moderation queue',
  '/admin/posts': 'Blog management',
  '/admin/communities': 'Community management',
  '/admin/roles': 'Role assignment',
  '/admin/audit': 'Audit log',
};

// The admin panel's own frame (per the design): dark sidebar, dense content, a top bar with your role.
//   desktop  full sidebar · tablet  icon rail (tap to expand) · phone  menu drawer
export function AdminLayout() {
  const { data: me } = useMe();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false); // tablet only: the rail opens to the full sidebar
  const [drawerOn, setDrawerOn] = useState<string | null>(null); // the page the drawer was opened on
  const [confirmOut, setConfirmOut] = useState(false);
  const logout = useLogout();
  const canModerate = me?.role === 'super_admin' || me?.role === 'content_mod';
  const { data: openReports = 0 } = useOpenReportCount(canModerate);
  if (!me) return null;
  const items = NAV.filter((i) => !i.roles || i.roles.includes(me.role) || me.role === 'super_admin');
  const drawer = drawerOn === pathname; // navigating closes it

  const sidebar = (mini: boolean) => (
    <div className="flex h-full flex-col bg-[#1C1E21] text-[#D0D2D6]">
      <div className={cn('flex h-[52px] shrink-0 items-center gap-2.5 border-b border-white/7', mini ? 'justify-center px-2' : 'px-4')}>
        <LogoMark size={26} />
        {!mini && (
          <span className="text-[13px] font-bold whitespace-nowrap text-white">
            Grove <span className="font-normal text-[#8A8C91]">Admin</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={mini ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto hidden rounded p-1 text-[#8A8C91] hover:text-white md:flex lg:hidden"
        >
          {mini ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      {!mini && <p className="px-4 pt-3.5 pb-1 text-[10px] font-bold tracking-[0.1em] text-[#8A8C91] uppercase">Navigation</p>}
      <nav aria-label="Admin" className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={mini ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] whitespace-nowrap transition-colors',
                mini && 'justify-center',
                isActive ? 'bg-[#3A3C42] font-semibold text-white' : 'hover:bg-[#2D2F33]',
              )
            }
          >
            <span className="relative shrink-0">
              <Icon size={17} />
              {mini && to === '/admin/reports' && openReports > 0 && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-error" />}
            </span>
            {!mini && <span className="flex-1">{label}</span>}
            {!mini && to === '/admin/reports' && openReports > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">{openReports > 99 ? '99+' : openReports}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col gap-0.5 border-t border-white/7 p-2 text-xs text-[#8A8C91]">
        {[
          { to: '/chats', label: 'Back to Grove', icon: ArrowLeft },
          { to: '/settings', label: 'Account settings', icon: Settings },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} title={mini ? label : undefined} className={cn('flex items-center gap-2.5 rounded-[7px] px-2.5 py-1.5 hover:bg-[#2D2F33] hover:text-white', mini && 'justify-center')}>
            <Icon size={15} /> {!mini && label}
          </Link>
        ))}
        <button type="button" onClick={() => setConfirmOut(true)} title={mini ? 'Sign out' : undefined} className={cn('flex items-center gap-2.5 rounded-[7px] px-2.5 py-1.5 text-left hover:bg-[#2D2F33] hover:text-white', mini && 'justify-center')}>
          <LogOut size={15} /> {!mini && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-[#F4F5F7]">
      {/* tablet: icon rail (tap to expand) · desktop: always the full sidebar */}
      <aside className={cn('hidden shrink-0 transition-[width] duration-200 md:block lg:w-[220px]', expanded ? 'md:w-[220px]' : 'md:w-[52px]')}>
        <div className="h-full lg:hidden">{sidebar(!expanded)}</div>
        <div className="hidden h-full lg:block">{sidebar(false)}</div>
      </aside>

      {/* phone drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setDrawerOn(null)}>
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative h-full w-64" onClick={(e) => e.stopPropagation()}>
            {sidebar(false)}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => setDrawerOn(pathname)} aria-label="Open admin menu" className="flex size-9 items-center justify-center rounded-md hover:bg-bg md:hidden">
              <Menu size={19} />
            </button>
            <ShieldCheck size={17} className="hidden shrink-0 text-primary sm:block" />
            <span className="truncate text-sm font-bold text-text-primary">{TITLES[pathname] ?? 'Admin'}</span>
            <span className="hidden text-xs text-text-secondary sm:inline">/ {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-[#F4F5F7] py-1 pr-2.5 pl-1.5">
            <Avatar name={me.displayName} src={me.avatarUrl} size={24} />
            <span className="hidden text-xs font-bold text-text-primary sm:inline">{me.displayName}</span>
            <AdminRoleBadge role={me.role} />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        body="You'll need your email and password to sign back in."
        confirmLabel="Sign out"
        loading={logout.isPending}
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => logout.mutate()}
      />
    </div>
  );
}
