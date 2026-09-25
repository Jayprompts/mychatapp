import { CalendarDays, LogOut, Mail, MonitorSmartphone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useLogout, useLogoutAll, useMe } from '@/features/auth/api';
import { errorMessage } from '@/lib/api';

// Minimal profile for now — full profile, edit, avatar upload and settings arrive in Phase 7.
export function ProfilePage() {
  const { data: user } = useMe();
  const logout = useLogout();
  const logoutAll = useLogoutAll();

  if (!user) return null; // RequireAuth guarantees a user; this just narrows the type

  const joined = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const signOutError = logout.error ?? logoutAll.error;

  return (
    <>
      <PageHeader title="Profile" />

      <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
        <section className="overflow-hidden rounded-xl bg-card shadow-card">
          <div className="gradient-brand h-24" />
          <div className="px-6 pb-6">
            <Avatar name={user.displayName} src={user.avatarUrl} size={88} className="-mt-11 rounded-full ring-4 ring-card" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[22px] font-bold tracking-tight text-text-primary">{user.displayName}</h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-[15px] text-text-secondary">@{user.username}</p>

            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-text-secondary">
              <li className="flex items-center gap-2.5">
                <Mail size={16} aria-hidden /> {user.email}
              </li>
              <li className="flex items-center gap-2.5">
                <CalendarDays size={16} aria-hidden /> Joined {joined}
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-3 rounded-xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-text-primary">Session</h3>
          {signOutError && <FormAlert>{errorMessage(signOutError)}</FormAlert>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => logout.mutate()} loading={logout.isPending}>
              <LogOut size={17} aria-hidden /> Log out
            </Button>
            <Button variant="danger-outline" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}>
              <MonitorSmartphone size={17} aria-hidden /> Log out of all devices
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
