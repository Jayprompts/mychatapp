import { useState } from 'react';
import { Check, Minus, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAdminUsers, useSetRole, useStaff } from '@/features/admin/api';
import { AdminRoleBadge, PageTitle, SearchBox, SkeletonRows, TableCard, td, th } from '@/features/admin/components/ui';
import { ROLE_LABELS, STAFF_ROLES } from '@/features/admin/types';
import { useMe } from '@/features/auth/api';
import type { Role } from '@/features/auth/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

const ROLES = Object.keys(ROLE_LABELS) as Role[];
// Mirrors the server's rules (Phase 8 RBAC) — shown so everyone knows what a role means.
const MATRIX: [string, Record<Exclude<Role, 'user'>, boolean>][] = [
  ['Dashboard & user list', { super_admin: true, content_mod: true, community_mgr: true }],
  ['Suspend, ban, delete accounts', { super_admin: true, content_mod: false, community_mgr: false }],
  ['Assign roles · audit log', { super_admin: true, content_mod: false, community_mgr: false }],
  ['Reports & blog moderation', { super_admin: true, content_mod: true, community_mgr: false }],
  ['Community management', { super_admin: true, content_mod: false, community_mgr: true }],
];

// /admin/roles — Super Admin: who's on the team and what they can do.
export function RolesPage() {
  const { data: me } = useMe();
  const staff = useStaff();
  const setRole = useSetRole();
  const [adding, setAdding] = useState(false);

  const change = (id: string, name: string, role: Role) =>
    setRole.mutate({ id, role }, { onSuccess: () => toast(`${name} is now ${ROLE_LABELS[role]}`), onError: (e) => toast(errorMessage(e), 'error') });

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Role management"
        description="Give people on your team the access they need — nothing more."
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus size={15} /> Add a team member
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {STAFF_ROLES.map((r) => (
          <div key={r} className="rounded-[10px] border border-border bg-card p-3.5">
            <AdminRoleBadge role={r} />
            <p className="mt-2 text-2xl font-extrabold text-text-primary">{staff.data?.counts[r] ?? '–'}</p>
          </div>
        ))}
      </div>

      <TableCard>
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {['Team member', 'Email', 'Role'].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {staff.isPending && <SkeletonRows cols={3} rows={3} />}
            {(staff.data?.users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-row-line last:border-0">
                <td className={td}>
                  <span className="flex items-center gap-2.5">
                    <Avatar name={u.displayName} src={u.avatarUrl} size={28} />
                    <span>
                      <span className="block font-semibold text-text-primary">{u.displayName}{u.id === me?.id && ' (you)'}</span>
                      <span className="block text-xs text-text-secondary">@{u.username}</span>
                    </span>
                  </span>
                </td>
                <td className={`${td} text-text-secondary`}>{u.email}</td>
                <td className={td}>
                  {u.id === me?.id ? (
                    <AdminRoleBadge role={u.role} />
                  ) : (
                    <select
                      aria-label={`Role for ${u.displayName}`}
                      value={u.role}
                      disabled={setRole.isPending}
                      onChange={(e) => change(u.id, u.displayName, e.target.value as Role)}
                      className="h-8 rounded-md border border-border bg-card px-2 text-[13px] outline-none focus:border-primary"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <h2 className="mt-6 mb-2 text-[15px] font-bold text-text-primary">What each role can do</h2>
      <TableCard>
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Permission</th>
              {STAFF_ROLES.map((r) => <th key={r} className={th}><AdminRoleBadge role={r} /></th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map(([label, allowed]) => (
              <tr key={label} className="border-b border-row-line last:border-0">
                <td className={td}>{label}</td>
                {STAFF_ROLES.map((r) => (
                  <td key={r} className={td} aria-label={allowed[r as Exclude<Role, 'user'>] ? 'Yes' : 'No'}>
                    {allowed[r as Exclude<Role, 'user'>] ? <Check size={16} className="text-success" /> : <Minus size={16} className="text-text-tertiary" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <AddMember open={adding} onClose={() => setAdding(false)} onPick={(id, name, role) => (change(id, name, role), setAdding(false))} />
    </div>
  );
}

function AddMember({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string, name: string, role: Role) => void }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role>('content_mod');
  const debounced = useDebouncedValue(q, 300);
  const results = useAdminUsers({ q: debounced || undefined, role: 'user', status: 'active', page: 1 });
  return (
    <Modal open={open} onClose={onClose} title="Add a team member">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Find someone by name or @username" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Give them the role" className="h-9 rounded-md border border-border px-2 text-[13px]">
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <ul className="max-h-72 overflow-y-auto">
          {/* only results for what's typed now — never the previous search while the next one loads */}
          {debounced &&
            !results.isPlaceholderData &&
            (results.data?.users ?? []).slice(0, 8).map((u) => (
              <li key={u.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-0">
                <Avatar name={u.displayName} src={u.avatarUrl} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{u.displayName}</span>
                  <span className="block truncate text-xs text-text-secondary">@{u.username}</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => onPick(u.id, u.displayName, role)}>
                  Make {ROLE_LABELS[role]}
                </Button>
              </li>
            ))}
          {debounced && !results.isPlaceholderData && results.data?.users.length === 0 && <li className="py-4 text-center text-[13px] text-text-secondary">No regular members match.</li>}
        </ul>
      </div>
    </Modal>
  );
}
