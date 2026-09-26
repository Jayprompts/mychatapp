import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router';
import { MessageCircle, Newspaper, ShieldCheck, User, Users, type LucideIcon } from 'lucide-react';
import { ConnectionBanner } from '@/components/layout/ConnectionBanner';
import { Avatar } from '@/components/ui/Avatar';
import { LiveToaster } from '@/components/ui/LiveToaster';
import { LogoMark } from '@/components/ui/Logo';
import { useMe } from '@/features/auth/api';
import { useConversations } from '@/features/chat/api';
import { useChatRealtime } from '@/features/chat/useChatRealtime';
import { RailBell } from '@/features/notifications/components/NotificationBell';
import { useNotificationsRealtime } from '@/features/notifications/useNotificationsRealtime';
import { closeSearchIfMoved, openSearch } from '@/features/search/api';
import { SearchButton } from '@/features/search/SearchButton';
import { SearchOverlay } from '@/features/search/SearchOverlay';
import { cn } from '@/lib/cn';

type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number };

// Logged-in app frame:
//   mobile  (<640)  content + fixed bottom tab bar (hidden inside an open conversation, post or editor)
//   tablet+ (640+)  slim icon rail on the left + content
export function AppShell() {
  const { data: user } = useMe();
  useChatRealtime(user?.id); // live connection for the whole logged-in app
  useNotificationsRealtime(user); // notifications + "New message from…" toasts

  // ⌘K / Ctrl+K opens search from anywhere; any navigation closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const { pathname, search } = useLocation();
  useEffect(() => closeSearchIfMoved(), [pathname, search]);

  const { data: conversations } = useConversations();
  const unreadOf = (community: boolean) =>
    conversations?.reduce((sum, c) => sum + ((c.type === 'community') === community ? c.unreadCount : 0), 0) ?? 0;
  const inChat = useMatch('/chats/:conversationId') !== null;
  const inCommunity = useMatch('/communities/:communityId') !== null;
  const inPost = useMatch('/blog/:postId') !== null; // reading and writing are full-screen
  const inEditor = useMatch('/blog/write/:postId?') !== null;
  const inStackedPage = [useMatch('/profile/edit'), useMatch('/settings'), useMatch('/u/:username'), useMatch('/notifications')].some(Boolean); // own back button
  const inConversation = inChat || inCommunity || inPost || inEditor || inStackedPage;

  const nav: NavItem[] = [
    { to: '/chats', label: 'Chats', icon: MessageCircle, badge: unreadOf(false) },
    { to: '/communities', label: 'Communities', icon: Users, badge: unreadOf(true) },
    { to: '/blog', label: 'Blog', icon: Newspaper },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <ConnectionBanner />
      <div className="flex min-h-0 flex-1">
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
          <div className="mt-2 flex flex-col items-center gap-1">
            <SearchButton variant="rail" />
            <RailBell />
            {user && user.role !== 'user' && (
              <Link to="/admin" aria-label="Admin panel" title="Admin panel" className="flex size-11 items-center justify-center rounded-[14px] text-text-secondary transition-colors hover:bg-bg hover:text-text-primary">
                <ShieldCheck size={22} strokeWidth={1.8} />
              </Link>
            )}
          </div>

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
      </div>

      <LiveToaster />
      <SearchOverlay />

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
        'absolute flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-error-solid px-1 text-[9px] font-bold text-white',
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
