import { Link, NavLink, Outlet, useMatch } from 'react-router';
import { MessageCircle, Newspaper, User, Users, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { Toaster } from '@/components/ui/Toaster';
import { useMe } from '@/features/auth/api';
import { useConversations } from '@/features/chat/api';
import { useChatRealtime } from '@/features/chat/useChatRealtime';
import { cn } from '@/lib/cn';

type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number };

// Logged-in app frame:
//   mobile  (<640)  content + fixed bottom tab bar (hidden inside an open conversation)
//   tablet+ (640+)  slim icon rail on the left + content
export function AppShell() {
  const { data: user } = useMe();
  useChatRealtime(user?.id); // live connection for the whole logged-in app

  const { data: conversations } = useConversations();
  const unread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
  const inConversation = useMatch('/chats/:conversationId') !== null;

  const nav: NavItem[] = [
    { to: '/chats', label: 'Chats', icon: MessageCircle, badge: unread },
    { to: '/communities', label: 'Communities', icon: Users },
    { to: '/blog', label: 'Blog', icon: Newspaper },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-dvh bg-bg">
      {/* Icon rail — tablet & desktop */}
      <aside className="hidden w-[76px] shrink-0 flex-col items-center border-r border-border bg-card py-3 sm:flex">
        <Link
          to="/chats"
          aria-label="Grove home"
          className="mb-4 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <LogoMark size={40} />
        </Link>

        <nav aria-label="Main" className="flex flex-col items-center gap-1">
          {nav
            .filter((item) => item.to !== '/profile')
            .map((item) => (
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
      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col overflow-y-auto sm:pb-0',
          !inConversation && 'pb-[calc(64px+env(safe-area-inset-bottom))]',
        )}
      >
        <Outlet />
      </main>

      <Toaster />

      {/* Bottom tab bar — mobile */}
      {!inConversation && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
        >
          {nav.map((item) => (
            <TabLink key={item.to} item={item} />
          ))}
        </nav>
      )}
    </div>
  );
}

function CountBadge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        'absolute flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-error px-1 text-[9px] font-bold text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function RailLink({ item: { to, label, icon: Icon, badge } }: { item: NavItem }) {
  return (
    <NavLink
      to={to}
      aria-label={badge ? `${label}, ${badge} unread` : undefined}
      className="group flex w-16 flex-col items-center gap-1 rounded-lg py-1.5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'relative flex size-11 items-center justify-center rounded-[14px] transition-colors',
              isActive ? 'bg-primary/12 text-primary' : 'text-text-secondary group-hover:bg-bg group-hover:text-text-primary',
            )}
          >
            <Icon size={22} strokeWidth={1.8} />
            <CountBadge count={badge} className="-top-0.5 -right-0.5" />
          </span>
          <span className={cn('text-[10px]', isActive ? 'font-semibold text-primary' : 'text-text-secondary')}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function TabLink({ item: { to, label, icon: Icon, badge } }: { item: NavItem }) {
  return (
    <NavLink
      to={to}
      aria-label={badge ? `${label}, ${badge} unread` : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
          isActive ? 'font-semibold text-primary' : 'text-text-secondary',
        )
      }
    >
      <span className="relative">
        <Icon size={22} strokeWidth={1.8} />
        <CountBadge count={badge} className="-top-1.5 -right-2.5" />
      </span>
      {label}
    </NavLink>
  );
}
