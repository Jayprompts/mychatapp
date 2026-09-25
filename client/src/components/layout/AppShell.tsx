import { Link, NavLink, Outlet } from 'react-router';
import { MessageCircle, Newspaper, User, Users, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { useMe } from '@/features/auth/api';
import { cn } from '@/lib/cn';

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { to: '/chats', label: 'Chats', icon: MessageCircle },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/profile', label: 'Profile', icon: User },
];

// Logged-in app frame:
//   mobile  (<640)  content + fixed bottom tab bar
//   tablet+ (640+)  slim icon rail on the left + content
export function AppShell() {
  const { data: user } = useMe();

  return (
    <div className="flex h-dvh bg-bg">
      {/* Icon rail — tablet & desktop */}
      <aside className="hidden w-[76px] shrink-0 flex-col items-center border-r border-border bg-card py-3 sm:flex">
        <Link to="/chats" aria-label="Grove home" className="mb-4 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <LogoMark size={40} />
        </Link>

        <nav aria-label="Main" className="flex flex-col items-center gap-1">
          {NAV.filter((item) => item.to !== '/profile').map((item) => (
            <RailLink key={item.to} item={item} />
          ))}
        </nav>

        {user && (
          <NavLink
            to="/profile"
            aria-label="Your profile"
            className={({ isActive }) =>
              cn(
                'mt-auto rounded-full p-0.5 ring-2 transition-shadow focus-visible:outline-2 focus-visible:outline-primary',
                isActive ? 'ring-primary' : 'ring-transparent hover:ring-border',
              )
            }
          >
            <Avatar name={user.displayName} src={user.avatarUrl} size={38} status="online" />
          </NavLink>
        )}
      </aside>

      {/* Page content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0">
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}

function RailLink({ item: { to, label, icon: Icon } }: { item: NavItem }) {
  return (
    <NavLink to={to} className="group flex w-16 flex-col items-center gap-1 rounded-lg py-1.5 focus-visible:outline-2 focus-visible:outline-primary">
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-[14px] transition-colors',
              isActive ? 'bg-primary/12 text-primary' : 'text-text-secondary group-hover:bg-bg group-hover:text-text-primary',
            )}
          >
            <Icon size={22} strokeWidth={1.8} />
          </span>
          <span className={cn('text-[10px]', isActive ? 'font-semibold text-primary' : 'text-text-secondary')}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function TabLink({ item: { to, label, icon: Icon } }: { item: NavItem }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
          isActive ? 'font-semibold text-primary' : 'text-text-secondary',
        )
      }
    >
      <Icon size={22} strokeWidth={1.8} />
      {label}
    </NavLink>
  );
}
