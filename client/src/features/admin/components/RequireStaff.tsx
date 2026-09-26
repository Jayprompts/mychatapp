import { Link, Outlet } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useMe } from '@/features/auth/api';
import type { Role } from '@/features/auth/types';
import { isStaff } from '../types';

// Admin pages: staff only (optionally narrower). The server checks every request too — this just
// keeps people from landing on a page that can't load.
export function RequireStaff({ roles }: { roles?: Role[] }) {
  const { data: me } = useMe();
  const allowed = !!me && isStaff(me.role) && (!roles || me.role === 'super_admin' || roles.includes(me.role));
  if (allowed) return <Outlet />;
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this"
        description="This part of Grove is for the admin team."
        action={
          <Link to="/chats" className={buttonClasses({ variant: 'secondary' })}>
            Back to Grove
          </Link>
        }
      />
    </div>
  );
}
