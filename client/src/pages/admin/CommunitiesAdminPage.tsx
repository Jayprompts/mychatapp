import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Crown, Lock, Star, StarOff, Trash2, UserMinus, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminCommunities, useCommunityAction, useCommunityMembers, useRemoveCommunityMember, useSetCommunityRole } from '@/features/admin/api';
import { ReasonDialog } from '@/features/admin/components/ReasonDialog';
import { FilterSelect, PageTitle, Pagination, SearchBox, TableCard, td, th } from '@/features/admin/components/ui';
import type { AdminCommunity, CommunityMember } from '@/features/admin/types';
import { CommunityAvatar } from '@/features/communities/components/CommunityAvatar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

const ROLE_LABEL: Record<CommunityMember['role'], string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

// /admin/communities — every community: feature, delete, and manage members.
export function AdminCommunitiesPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const debounced = useDebouncedValue(q, 300);
  const featured = params.get('featured') === 'true' ? 'true' : '';
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

  const list = useAdminCommunities({ q: debounced || undefined, featured: featured || undefined, page });
  const communities = list.data?.communities ?? [];
  const action = useCommunityAction();
  const [deleting, setDeleting] = useState<AdminCommunity | null>(null);
  const [managing, setManaging] = useState<AdminCommunity | null>(null);

  const feature = (c: AdminCommunity, on: boolean) =>
    action.mutate({ id: c.id, action: on ? 'feature' : 'unfeature' }, { onSuccess: () => toast(on ? `${c.name} featured` : `${c.name} unfeatured`), onError: (e) => toast(errorMessage(e), 'error') });
  const menuFor = (c: AdminCommunity): MenuItem[] => [
    { label: 'Manage members', icon: <Users size={15} />, onSelect: () => setManaging(c) },
    c.featured
      ? { label: 'Unfeature', icon: <StarOff size={15} />, onSelect: () => feature(c, false) }
      : { label: 'Feature', icon: <Star size={15} />, onSelect: () => feature(c, true) },
    { label: 'Delete community…', icon: <Trash2 size={15} />, danger: true, onSelect: () => setDeleting(c) },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Communities" description={list.data ? `${list.data.total.toLocaleString()} communities` : ' '} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => (setQ(v), set({ q: v }))} placeholder="Search communities" />
        <FilterSelect label="Featured" value={featured} onChange={(v) => set({ featured: v })} options={[{ value: 'true', label: 'Featured only' }]} />
      </div>

      <TableCard footer={list.data && <Pagination page={page} pageSize={list.data.pageSize} total={list.data.total} onPage={(p) => set({ page: String(p) })} />}>
        <table className={cn('w-full min-w-[720px] border-collapse', list.isPlaceholderData && 'opacity-60')}>
          <thead>
            <tr className="border-b border-border">
              {['Community', 'Owner', 'Members', 'Category', 'Created', ''].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {communities.map((c) => (
              <tr key={c.id} className="border-b border-[#ECEEF2] last:border-0 hover:bg-[#FAFBFC]">
                <td className={td}>
                  <Link to={`/communities/${c.id}`} className="flex items-center gap-2.5 hover:underline">
                    <CommunityAvatar icon={c.icon} theme={c.theme} size={30} />
                    <span className="truncate font-semibold text-text-primary">{c.name}</span>
                    {c.visibility === 'private' && <Lock size={13} className="shrink-0 text-text-tertiary" aria-label="Private" />}
                    {c.featured && <Star size={14} className="shrink-0 fill-[#F5B400] text-[#F5B400]" aria-label="Featured" />}
                  </Link>
                </td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{c.owner ? `@${c.owner.username}` : '—'}</td>
                <td className={cn(td, 'whitespace-nowrap')}>
                  <button type="button" onClick={() => setManaging(c)} aria-label={`Manage ${c.memberCount} members of ${c.name}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                    <Users size={13} /> {c.memberCount.toLocaleString()}
                  </button>
                  {c.admins > 0 && <span className="text-text-secondary"> · {c.admins} admin{c.admins === 1 ? '' : 's'}</span>}
                </td>
                <td className={cn(td, 'text-text-secondary')}>{c.category}</td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{formatPostDate(c.createdAt)}</td>
                <td className={cn(td, 'w-10 text-right')}><Menu items={menuFor(c)} label={`Actions for ${c.name}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && communities.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">No communities match these filters.</p>}
        {list.isPending && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">Loading…</p>}
      </TableCard>

      {deleting && (
        <ReasonDialog
          open
          title={`Delete ${deleting.name}?`}
          body={`Its chat, channels and photos are deleted for all ${deleting.memberCount.toLocaleString()} members. The owner is told why (without your name). This can’t be undone.`}
          confirmLabel="Delete community"
          withReason
          loading={action.isPending}
          error={action.error ? errorMessage(action.error) : null}
          onCancel={() => (action.reset(), setDeleting(null))}
          onConfirm={(reason) =>
            action.mutate({ id: deleting.id, action: 'delete', reason }, { onSuccess: () => (toast(`${deleting.name} was deleted`), setDeleting(null)) })
          }
        />
      )}
      {managing && <MembersModal community={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}

type Confirm = { kind: 'owner' | 'remove'; member: CommunityMember } | null;

function MembersModal({ community, onClose }: { community: AdminCommunity; onClose: () => void }) {
  const members = useCommunityMembers(community.id);
  const setRole = useSetCommunityRole();
  const remove = useRemoveCommunityMember();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [filter, setFilter] = useState('');
  const shown = (members.data ?? []).filter((m) => !filter || `${m.user.displayName} ${m.user.username}`.toLowerCase().includes(filter.toLowerCase()));

  const changeRole = (m: CommunityMember, role: CommunityMember['role']) => {
    if (role === 'owner') return setConfirm({ kind: 'owner', member: m });
    setRole.mutate(
      { id: community.id, userId: m.user.id, role },
      { onSuccess: () => toast(`${m.user.displayName} is now ${ROLE_LABEL[role].toLowerCase()}`), onError: (e) => toast(errorMessage(e), 'error') },
    );
  };

  return (
    <>
      <Modal open={!confirm} onClose={onClose} title={`${community.name} · members`}>
        <div className="flex max-h-[70vh] flex-col">
          <div className="border-b border-border p-3">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter members" aria-label="Filter members" className="h-9 w-full rounded-md border border-border px-3 text-[13px] outline-none focus:border-primary" />
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Members">
            {members.isPending && Array.from({ length: 4 }, (_, i) => <li key={i} className="p-3"><Skeleton className="h-8 rounded-md" /></li>)}
            {shown.map((m) => (
              <li key={m.user.id} className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar name={m.user.displayName} src={m.user.avatarUrl} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">
                    {m.user.displayName} {m.role === 'owner' && <Crown size={13} className="text-[#F5B400]" aria-label="Owner" />}
                  </p>
                  <p className="truncate text-xs text-text-secondary">@{m.user.username} · joined {formatPostDate(m.joinedAt)}</p>
                </div>
                {m.role === 'owner' ? (
                  <span className="text-xs font-semibold text-text-secondary">Owner</span>
                ) : (
                  <>
                    <select
                      value={m.role}
                      aria-label={`Role for ${m.user.displayName}`}
                      disabled={setRole.isPending}
                      onChange={(e) => changeRole(m, e.target.value as CommunityMember['role'])}
                      className="h-8 rounded-md border border-border bg-card px-2 text-[13px] outline-none focus:border-primary"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Make owner…</option>
                    </select>
                    <button type="button" onClick={() => setConfirm({ kind: 'remove', member: m })} aria-label={`Remove ${m.user.displayName}`} className="flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-error/8 hover:text-error">
                      <UserMinus size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
            {members.data && shown.length === 0 && <li className="p-6 text-center text-[13px] text-text-secondary">No one matches.</li>}
          </ul>
        </div>
      </Modal>

      {confirm && (
        <ReasonDialog
          open
          title={confirm.kind === 'owner' ? `Make ${confirm.member.user.displayName} the owner?` : `Remove ${confirm.member.user.displayName}?`}
          body={
            confirm.kind === 'owner'
              ? `They take over ${community.name}. The current owner stays on as an admin.`
              : `They leave ${community.name} and its chat straight away. They can join again unless the community is private.`
          }
          confirmLabel={confirm.kind === 'owner' ? 'Transfer ownership' : 'Remove'}
          danger={confirm.kind === 'remove'}
          loading={setRole.isPending || remove.isPending}
          error={(setRole.error ?? remove.error) ? errorMessage((setRole.error ?? remove.error)!) : null}
          onCancel={() => (setRole.reset(), remove.reset(), setConfirm(null))}
          onConfirm={() => {
            const m = confirm.member;
            const done = (msg: string) => (toast(msg), setConfirm(null));
            if (confirm.kind === 'owner') setRole.mutate({ id: community.id, userId: m.user.id, role: 'owner' }, { onSuccess: () => done(`${m.user.displayName} now owns ${community.name}`) });
            else remove.mutate({ id: community.id, userId: m.user.id }, { onSuccess: () => done(`${m.user.displayName} was removed`) });
          }}
        />
      )}
    </>
  );
}
