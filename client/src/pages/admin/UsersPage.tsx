import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Ban, CircleCheck, CirclePause, Trash2, UserCog } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { useBulkUsers, useAdminUsers, useDeleteUser, useSetRole, useSetStatus } from '@/features/admin/api';
import { ReasonDialog } from '@/features/admin/components/ReasonDialog';
import { AdminRoleBadge, FilterSelect, PageTitle, Pagination, SearchBox, StatusBadge, TableCard, td, th } from '@/features/admin/components/ui';
import { ROLE_LABELS, type AdminUser } from '@/features/admin/types';
import { useMe } from '@/features/auth/api';
import type { Role } from '@/features/auth/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAgo, formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

type Pending =
  | { kind: 'suspend' | 'ban' | 'activate' | 'delete'; users: AdminUser[] }
  | { kind: 'role'; users: [AdminUser] }
  | null;

const ROLES = Object.keys(ROLE_LABELS) as Role[];

// /admin/users — everyone, searchable and filterable; Super Admins can act on accounts (alone or in bulk).
export function UsersPage() {
  const { data: me } = useMe();
  const canAct = me?.role === 'super_admin';
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const debounced = useDebouncedValue(q, 300);
  const role = (params.get('role') ?? '') as Role | '';
  const status = (params.get('status') ?? '') as AdminUser['status'] | '';
  const page = Number(params.get('page') ?? 1) || 1;
  const set = (patch: Record<string, string>) =>
    setParams((p) => {
      for (const [k, v] of Object.entries(patch)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      if (!('page' in patch)) p.delete('page');
      return p;
    });

  const list = useAdminUsers({ q: debounced || undefined, role: role || undefined, status: status || undefined, page });
  const users = list.data?.users ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);
  const selectedUsers = users.filter((u) => selected.has(u.id));
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s).add(id)));
  const selectable = (u: AdminUser) => u.id !== me?.id && u.role !== 'super_admin';

  const menuFor = (u: AdminUser): MenuItem[] => {
    if (!canAct || u.id === me?.id) return [];
    const items: MenuItem[] = [{ label: 'Change role…', icon: <UserCog size={15} />, onSelect: () => setPending({ kind: 'role', users: [u] }) }];
    if (u.role === 'super_admin') return items;
    if (u.status !== 'active') items.push({ label: 'Reactivate', icon: <CircleCheck size={15} />, onSelect: () => setPending({ kind: 'activate', users: [u] }) });
    if (u.status !== 'suspended') items.push({ label: 'Suspend…', icon: <CirclePause size={15} />, onSelect: () => setPending({ kind: 'suspend', users: [u] }) });
    if (u.status !== 'banned') items.push({ label: 'Ban…', icon: <Ban size={15} />, danger: true, onSelect: () => setPending({ kind: 'ban', users: [u] }) });
    items.push({ label: 'Delete account…', icon: <Trash2 size={15} />, danger: true, onSelect: () => setPending({ kind: 'delete', users: [u] }) });
    return items;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Users" description={list.data ? `${list.data.total.toLocaleString()} people` : ' '} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => (setQ(v), set({ q: v }))} placeholder="Search name, @username or email" />
        <FilterSelect label="Role" value={role} onChange={(v) => set({ role: v })} options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => set({ status: v })}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'banned', label: 'Banned' },
          ]}
        />
      </div>

      {/* Bulk bar (per the design): appears once 1+ rows are selected */}
      {canAct && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-primary/20 bg-primary/6 px-3 py-2 text-[13px]" role="toolbar" aria-label="Bulk actions">
          <strong className="text-text-primary">{selected.size} selected</strong>
          <span className="text-text-tertiary">—</span>
          <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'suspend', users: selectedUsers })}>Suspend</Button>
          <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'ban', users: selectedUsers })}>Ban</Button>
          <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'activate', users: selectedUsers })}>Reactivate</Button>
          <Button size="sm" variant="danger-outline" onClick={() => setPending({ kind: 'delete', users: selectedUsers })}>Delete</Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-text-secondary hover:text-text-primary">
            Cancel
          </button>
        </div>
      )}

      <TableCard footer={list.data && <Pagination page={page} pageSize={list.data.pageSize} total={list.data.total} onPage={(p) => set({ page: String(p) })} />}>
        {/* Tablet & desktop: a table */}
        <table className={cn('hidden w-full min-w-[760px] border-collapse md:table', list.isPlaceholderData && 'opacity-60')}>
          <thead>
            <tr className="border-b border-border">
              {canAct && (
                <th className={cn(th, 'w-9')}>
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={users.some(selectable) && users.filter(selectable).every((u) => selected.has(u.id))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(users.filter(selectable).map((u) => u.id)) : new Set())}
                  />
                </th>
              )}
              {['User', 'Email', 'Role', 'Status', 'Joined', 'Last active', ''].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={cn('border-b border-[#ECEEF2] last:border-0 hover:bg-[#FAFBFC]', selected.has(u.id) && 'bg-primary/4')}>
                {canAct && (
                  <td className={td}>
                    <input type="checkbox" aria-label={`Select ${u.displayName}`} disabled={!selectable(u)} checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                  </td>
                )}
                <td className={td}>
                  <Link to={`/u/${u.username}`} className="flex items-center gap-2.5 hover:underline">
                    <Avatar name={u.displayName} src={u.avatarUrl} size={28} status={u.online ? 'online' : undefined} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-text-primary">{u.displayName}{u.id === me?.id && ' (you)'}</span>
                      <span className="block truncate text-xs text-text-secondary">@{u.username}</span>
                    </span>
                  </Link>
                </td>
                <td className={cn(td, 'text-text-secondary')}>{u.email}</td>
                <td className={td}><AdminRoleBadge role={u.role} /></td>
                <td className={td}><StatusBadge status={u.status} reason={u.statusReason} /></td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{formatPostDate(u.createdAt)}</td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{u.online ? 'Now' : u.lastSeenAt ? formatAgo(u.lastSeenAt) : '—'}</td>
                <td className={cn(td, 'w-10 text-right')}>
                  <Menu items={menuFor(u)} label={`Actions for ${u.displayName}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phones: a card per person (per the design's mobile fallback) */}
        <ul className="divide-y divide-border md:hidden">
          {users.map((u) => (
            <li key={u.id} className="flex items-start gap-3 p-3">
              {canAct && <input type="checkbox" className="mt-2" aria-label={`Select ${u.displayName}`} disabled={!selectable(u)} checked={selected.has(u.id)} onChange={() => toggle(u.id)} />}
              <Avatar name={u.displayName} src={u.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{u.displayName}</p>
                <p className="truncate text-xs text-text-secondary">@{u.username} · {u.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <AdminRoleBadge role={u.role} />
                  <StatusBadge status={u.status} reason={u.statusReason} />
                  <span className="text-[11px] text-text-tertiary">Joined {formatPostDate(u.createdAt)}</span>
                </div>
              </div>
              <Menu items={menuFor(u)} label={`Actions for ${u.displayName}`} />
            </li>
          ))}
        </ul>
        {list.data && users.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">No one matches these filters.</p>}
        {list.isPending && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">Loading…</p>}
      </TableCard>

      <ActionDialogs pending={pending} onClose={() => setPending(null)} onDone={() => setSelected(new Set())} />
    </div>
  );
}

const COPY = {
  suspend: { title: 'Suspend', verb: 'Suspend', body: 'They’re signed out everywhere right away and can’t sign in until reactivated. Nothing is deleted.', reason: true },
  ban: { title: 'Ban', verb: 'Ban', body: 'They’re signed out everywhere and blocked from signing in. Use this for serious or repeated abuse. It can be undone by reactivating.', reason: true },
  activate: { title: 'Reactivate', verb: 'Reactivate', body: 'They can sign in again straight away.', reason: false },
  delete: { title: 'Delete', verb: 'Delete for good', body: 'Their profile, posts, comments and photos are deleted and they leave every group. Messages stay in other people’s chats as “Deleted user”. This can’t be undone.', reason: false },
} as const;

function ActionDialogs({ pending, onClose, onDone }: { pending: Pending; onClose: () => void; onDone: () => void }) {
  const setStatus = useSetStatus();
  const del = useDeleteUser();
  const bulk = useBulkUsers();
  const setRole = useSetRole();
  const [role, setRoleValue] = useState<Role | ''>('');

  if (pending?.kind === 'role') {
    const u = pending.users[0];
    const value = role || u.role;
    return (
      <Modal open onClose={() => (setRoleValue(''), onClose())} title={`Change ${u.displayName}'s role`}>
        <div className="flex flex-col gap-3 p-5">
          <select value={value} onChange={(e) => setRoleValue(e.target.value as Role)} aria-label="Role" className="h-10 rounded-md border-[1.5px] border-border px-3 text-sm outline-none focus:border-primary">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <p className="text-xs text-text-secondary">It takes effect on their very next action — no need to sign out.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => (setRoleValue(''), onClose())}>Cancel</Button>
            <Button
              loading={setRole.isPending}
              disabled={value === u.role}
              onClick={() =>
                setRole.mutate(
                  { id: u.id, role: value },
                  { onSuccess: () => (toast(`${u.displayName} is now ${ROLE_LABELS[value]}`), setRoleValue(''), onClose()), onError: (e) => toast(errorMessage(e), 'error') },
                )
              }
            >
              Save role
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!pending) return null;
  const c = COPY[pending.kind];
  const many = pending.users.length > 1;
  const who = many ? `${pending.users.length} people` : pending.users[0].displayName;
  const busy = setStatus.isPending || del.isPending || bulk.isPending;
  const error = setStatus.error ?? del.error ?? bulk.error;

  const confirm = (reason: string) => {
    const done = (msg: string) => {
      toast(msg);
      onDone();
      onClose();
    };
    if (many) {
      bulk.mutate(
        { ids: pending.users.map((u) => u.id), action: pending.kind, reason: reason || undefined },
        { onSuccess: (r) => done(r.skipped.length ? `Done for ${r.done.length} · skipped ${r.skipped.length}: ${r.skipped[0].reason}` : `Done for ${r.done.length} people`) },
      );
    } else if (pending.kind === 'delete') {
      del.mutate(pending.users[0].id, { onSuccess: () => done(`${who}'s account was deleted`) });
    } else {
      const status = pending.kind === 'activate' ? 'active' : pending.kind === 'suspend' ? 'suspended' : 'banned';
      setStatus.mutate({ id: pending.users[0].id, status, reason }, { onSuccess: () => done(`${who} ${status === 'active' ? 'reactivated' : status}`) });
    }
  };

  return (
    <ReasonDialog
      open
      title={`${c.title} ${who}?`}
      body={c.body}
      confirmLabel={c.verb}
      withReason={c.reason}
      danger={pending.kind !== 'activate'}
      loading={busy}
      error={error ? errorMessage(error) : null}
      onCancel={() => {
        setStatus.reset();
        del.reset();
        bulk.reset();
        onClose();
      }}
      onConfirm={confirm}
    />
  );
}
