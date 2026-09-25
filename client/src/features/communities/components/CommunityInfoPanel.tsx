import { useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Camera, Globe, Link2, Lock, LogOut, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAddMembers, useRemoveMember } from '@/features/chat/api';
import { MemberRow, SharedMedia } from '@/features/chat/components/ChatInfoPanel';
import { ROLE_ORDER, sectionTitle } from '@/features/chat/infoShared';
import { PeoplePicker } from '@/features/chat/components/PeoplePicker';
import type { Conversation, UserSummary } from '@/features/chat/types';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { useAnswerRequest, useCommunity, useDeleteCommunity, useResetInvite, useUpdateCommunity, useUploadCover } from '../api';
import { THEME_GRADIENTS } from '../themes';
import { COMMUNITY_CATEGORIES, COMMUNITY_ICONS, COMMUNITY_THEMES, type CommunityDetail } from '../types';
import { CommunityAvatar, CommunityCover } from './CommunityAvatar';

type Props = { conversation: Conversation; myId: string; onClose: () => void };

// Community info, per the design: cover, invite, join requests (admins), members, photos, leave/delete.
export function CommunityInfoPanel({ conversation: c, myId, onClose }: Props) {
  const community = useCommunity(c.community?.id);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const leave = useRemoveMember(c.id);
  const del = useDeleteCommunity();

  const d = community.data;
  const isAdmin = c.myRole === 'owner' || c.myRole === 'admin';
  const members = [...c.members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.displayName.localeCompare(b.user.displayName),
  );

  return (
    <aside aria-label="Chat info" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card">
      <CommunityCover coverUrl={d?.coverUrl ?? c.community?.coverUrl ?? null} theme={d?.theme ?? c.community?.theme ?? 'grove'} className="h-32 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat info"
          className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/50 lg:right-3 lg:left-auto"
        >
          <ArrowLeft size={18} className="lg:hidden" />
          <X size={18} className="hidden lg:block" />
        </button>
      </CommunityCover>

      <div className="border-b border-border px-4 pb-4">
        <div className="flex items-end justify-between">
          <CommunityAvatar icon={d?.icon ?? c.community?.icon ?? '🌱'} theme={d?.theme ?? c.community?.theme ?? 'grove'} size={64} className="relative -mt-8 ring-4 ring-card" />
          <div className="flex gap-2">
            {isAdmin && d && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil size={14} /> Edit
              </Button>
            )}
            <Button size="sm" onClick={() => setInviting(true)} disabled={!d}>
              <UserPlus size={15} /> Invite
            </Button>
          </div>
        </div>
        <h2 className="mt-3 text-lg font-bold text-text-primary">{c.name}</h2>
        {d ? (
          <>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-text-secondary">
              {d.visibility === 'private' ? <Lock size={13} /> : <Globe size={13} />}
              {d.visibility === 'private' ? 'Private' : 'Public'} community · {d.memberCount.toLocaleString()} {d.memberCount === 1 ? 'member' : 'members'}
              {d.onlineCount > 0 && <span className="text-success">· {d.onlineCount} online</span>}
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-bold text-primary">{d.category}</span>
            {d.description && <p className="mt-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-text-primary">{d.description}</p>}
          </>
        ) : (
          <Skeleton className="mt-2 h-3.5 w-3/5" />
        )}
      </div>

      {isAdmin && d && d.joinRequests.length > 0 && <JoinRequests community={d} />}

      <section className="border-b border-border px-4 pt-3 pb-2">
        <h3 className={sectionTitle}>Members · {c.members.length}</h3>
        <ul>
          {members.map((m) => (
            <MemberRow key={m.user.id} member={m} conversation={c} myId={myId} />
          ))}
        </ul>
      </section>

      <SharedMedia conversationId={c.id} />

      <div className="mt-auto flex flex-col gap-2 p-4">
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-error/30 bg-error/6 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10"
        >
          <LogOut size={16} /> Leave community
        </button>
        {c.myRole === 'owner' && d && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-error hover:underline"
          >
            <Trash2 size={15} /> Delete community
          </button>
        )}
      </div>

      {d && <InviteDialog open={inviting} onClose={() => setInviting(false)} community={d} conversation={c} />}
      {d && <EditCommunityDialog open={editing} onClose={() => setEditing(false)} community={d} />}

      <ConfirmDialog
        open={confirmLeave}
        title={`Leave ${c.name}?`}
        body={
          c.members.length === 1
            ? "You're the last member — leaving deletes the community and its messages for good."
            : d?.visibility === 'private'
              ? "You'll lose access to the chat. To come back you'll need an invite or an approved request."
              : "You'll lose access to the chat. You can join again any time from Discover."
        }
        confirmLabel="Leave"
        loading={leave.isPending}
        error={leave.isError ? errorMessage(leave.error) : null}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => leave.mutate(myId)} // the hook navigates away
      />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${c.name}?`}
        body="This permanently deletes the community, its chat, messages and files for everyone. This can't be undone."
        confirmLabel="Delete forever"
        loading={del.isPending}
        error={del.isError ? errorMessage(del.error) : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => d && del.mutate(d.id)} // the hook toasts and navigates away
      />
    </aside>
  );
}

function JoinRequests({ community }: { community: CommunityDetail }) {
  const answer = useAnswerRequest(community.id);
  return (
    <section className="border-b border-border bg-warning/5 px-4 pt-3 pb-2">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-[#B68A00] uppercase">
        Join requests
        <span className="rounded-full bg-warning px-1.5 text-[10px] text-white">{community.joinRequests.length}</span>
      </h3>
      <ul>
        {community.joinRequests.map(({ user }) => (
          <li key={user.id} className="flex items-center gap-2.5 py-2">
            <Avatar name={user.displayName} src={user.avatarUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-text-primary">{user.displayName}</p>
              <p className="truncate text-[11px] text-text-secondary">@{user.username}</p>
            </div>
            <button
              type="button"
              disabled={answer.isPending}
              onClick={() => answer.mutate({ userId: user.id, approve: false }, { onError: (e) => toast(errorMessage(e), 'error') })}
              className="rounded-full border border-error/25 bg-error/6 px-3 py-1 text-xs font-bold text-error disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={answer.isPending}
              onClick={() =>
                answer.mutate(
                  { userId: user.id, approve: true },
                  { onSuccess: () => toast(`${user.displayName} joined`), onError: (e) => toast(errorMessage(e), 'error') },
                )
              }
              className="gradient-message rounded-full px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Invite, per the design: "From contacts" (adds them) · "Share link".
function InviteDialog({
  open,
  onClose,
  community,
  conversation,
}: {
  open: boolean;
  onClose: () => void;
  community: CommunityDetail;
  conversation: Conversation;
}) {
  const isAdmin = community.myRole === 'owner' || community.myRole === 'admin';
  const canAdd = community.visibility === 'public' || isAdmin; // private: only admins add people directly
  const [tab, setTab] = useState<'contacts' | 'link'>(canAdd ? 'contacts' : 'link');
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const add = useAddMembers(conversation.id);
  const reset = useResetInvite(community.id);
  const link = community.inviteCode ? `${window.location.origin}/join/${community.inviteCode}` : '';

  const close = () => {
    setSelected([]);
    add.reset();
    onClose();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Invite link copied');
    } catch {
      toast("Couldn't copy — select the link and copy it", 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Invite to ${community.name}`}
      footer={
        tab === 'contacts' ? (
          <>
            {add.isError && (
              <div className="mb-3">
                <FormAlert>{errorMessage(add.error)}</FormAlert>
              </div>
            )}
            <Button
              fullWidth
              disabled={selected.length === 0}
              loading={add.isPending}
              onClick={() =>
                add.mutate(
                  selected.map((u) => u.id),
                  { onSuccess: () => (toast(`Added ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`), close()) },
                )
              }
            >
              {selected.length === 0 ? 'Pick people to add' : `Add ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex gap-1 border-b border-border px-5 pt-3">
        {canAdd && <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')}>From contacts</TabButton>}
        <TabButton active={tab === 'link'} onClick={() => setTab('link')}>Share link</TabButton>
      </div>

      {tab === 'contacts' ? (
        <PeoplePicker selected={selected} onChange={setSelected} alreadyIn={new Set(conversation.members.map((m) => m.user.id))} autoFocus />
      ) : (
        <div className="flex flex-col gap-3 p-5">
          <p className="text-sm text-text-secondary">
            Anyone with this link can join{community.visibility === 'private' ? ' — even though the community is private' : ''}.
          </p>
          <div className="flex items-center gap-2 rounded-md border-[1.5px] border-border bg-bg px-3 py-2.5">
            <Link2 size={16} className="shrink-0 text-text-secondary" aria-hidden />
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none" />
          </div>
          <Button onClick={() => void copy()}>Copy link</Button>
          {isAdmin && (
            <button
              type="button"
              disabled={reset.isPending}
              onClick={() => reset.mutate(undefined, { onSuccess: () => toast('New link created — the old one no longer works') })}
              className="self-center text-xs font-semibold text-text-secondary hover:text-error hover:underline"
            >
              Reset link (the current one stops working)
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('-mb-px border-b-2 px-3 pb-2.5 text-sm font-semibold transition-colors', active ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary')}
    >
      {children}
    </button>
  );
}

function EditCommunityDialog({ open, onClose, community: c }: { open: boolean; onClose: () => void; community: CommunityDetail }) {
  const [form, setForm] = useState({ name: c.name, description: c.description, category: c.category, visibility: c.visibility, icon: c.icon, theme: c.theme });
  const update = useUpdateCommunity(c.id);
  const cover = useUploadCover(c.id);
  const fileRef = useRef<HTMLInputElement>(null);

  // Start from the latest values each time it opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({ name: c.name, description: c.description, category: c.category, visibility: c.visibility, icon: c.icon, theme: c.theme });
      update.reset();
    }
  }

  const input =
    'w-full rounded-md border-[1.5px] border-border bg-card px-4 py-2.5 text-[15px] text-text-primary outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit community"
      footer={
        <Button
          fullWidth
          disabled={form.name.trim().length < 3}
          loading={update.isPending}
          onClick={() => update.mutate({ ...form, name: form.name.trim(), description: form.description.trim() }, { onSuccess: onClose })}
        >
          Save changes
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        {update.isError && <FormAlert>{errorMessage(update.error)}</FormAlert>}

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Cover</span>
          <CommunityCover coverUrl={c.coverUrl} theme={form.theme} className="h-24 rounded-lg">
            <div className="absolute right-2 bottom-2 flex gap-1.5">
              {c.coverUrl && (
                <button
                  type="button"
                  onClick={() => update.mutate({ removeCover: true })}
                  className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white"
                >
                  Remove photo
                </button>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={cover.isPending}
                className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
              >
                <Camera size={13} /> {cover.isPending ? 'Uploading…' : c.coverUrl ? 'Change photo' : 'Add photo'}
              </button>
            </div>
          </CommunityCover>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) cover.mutate(file, { onError: (err) => toast(errorMessage(err), 'error') });
            }}
          />
          <div className="mt-2 flex gap-2">
            {COMMUNITY_THEMES.map((t) => (
              <button
                key={t}
                type="button"
                aria-label={`${t} theme`}
                aria-pressed={form.theme === t}
                onClick={() => setForm((f) => ({ ...f, theme: t }))}
                className={cn('size-7 rounded-full ring-offset-2', form.theme === t && 'ring-2 ring-primary')}
                style={{ background: THEME_GRADIENTS[t] }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Icon</span>
          <div className="grid grid-cols-8 gap-1.5">
            {COMMUNITY_ICONS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`Icon ${e}`}
                aria-pressed={form.icon === e}
                onClick={() => setForm((f) => ({ ...f, icon: e }))}
                className={cn('flex aspect-square items-center justify-center rounded-md text-lg', form.icon === e ? 'bg-primary/12 ring-2 ring-primary/40' : 'hover:bg-bg')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Name</span>
          <input value={form.name} maxLength={50} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={input} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Description</span>
          <textarea
            value={form.description}
            maxLength={300}
            rows={3}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={cn(input, 'resize-none')}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Category</span>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof f.category }))} className={input}>
            {COMMUNITY_CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          {(['public', 'private'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={form.visibility === v}
              onClick={() => setForm((f) => ({ ...f, visibility: v }))}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md border-[1.5px] py-2.5 text-sm font-semibold capitalize',
                form.visibility === v ? 'border-primary bg-primary/6 text-primary' : 'border-border text-text-secondary',
              )}
            >
              {v === 'public' ? <Globe size={16} /> : <Lock size={16} />} {v}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
