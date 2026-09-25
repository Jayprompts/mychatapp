import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, LogOut, MoreVertical, Pencil, ShieldCheck, ShieldMinus, UserMinus, UserPlus, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormAlert } from '@/components/ui/FormAlert';
import { Lightbox } from '@/components/ui/Lightbox';
import { Modal } from '@/components/ui/Modal';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatLastSeen } from '@/lib/time';
import { useAddMembers, useRemoveMember, useSetMemberRole, useSharedMedia, useUpdateGroup } from '../api';
import { usePresence } from '../liveState';
import type { Conversation, ConversationMember, UserSummary } from '../types';
import { ConversationAvatar } from './ConversationAvatar';
import { PeoplePicker } from './PeoplePicker';
import { ROLE_ORDER, sectionTitle } from '../infoShared';
import { CommunityInfoPanel } from '@/features/communities/components/CommunityInfoPanel';

type Props = { conversation: Conversation; myId: string; onClose: () => void };


// Right-hand panel on desktop, full screen on phones/tablets (per the design's Group Info screen).
export function ChatInfoPanel(props: Props) {
  if (props.conversation.type === 'community') return <CommunityInfoPanel {...props} />;
  return <GroupOrDirectInfoPanel {...props} />;
}

function GroupOrDirectInfoPanel({ conversation: c, myId, onClose }: Props) {
  const isGroup = c.type === 'group';
  const isAdmin = c.myRole === 'owner' || c.myRole === 'admin';
  const other = !isGroup ? c.members.find((m) => m.user.id !== myId)?.user : undefined;
  const presence = usePresence(other);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const leave = useRemoveMember(c.id);

  const members = [...c.members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.displayName.localeCompare(b.user.displayName),
  );

  return (
    <aside aria-label="Chat info" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card">
      {/* Header */}
      <div className="gradient-message relative flex shrink-0 flex-col items-center gap-3 px-5 pt-10 pb-6 text-center text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat info"
          className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 lg:right-3 lg:left-auto"
        >
          <ArrowLeft size={18} className="lg:hidden" />
          <X size={18} className="hidden lg:block" />
        </button>
        <ConversationAvatar
          conversation={c}
          myId={myId}
          size={76}
          className={isGroup ? undefined : 'rounded-full ring-[3px] ring-white/40'}
        />
        <div>
          <h2 className="text-lg font-bold">{c.name}</h2>
          <p className="mt-0.5 text-[13px] text-white/80">
            {isGroup ? `Group · ${c.members.length} members` : `@${other?.username} · ${formatLastSeen(presence.online, presence.lastSeenAt)}`}
          </p>
        </div>
        {isGroup && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-full border-[1.5px] border-white/35 bg-white/20 px-4 py-1.5 text-[13px] font-semibold transition-colors hover:bg-white/30"
            >
              <UserPlus size={15} /> Add people
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-full border-[1.5px] border-white/35 bg-white/20 px-4 py-1.5 text-[13px] font-semibold transition-colors hover:bg-white/30"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* About */}
      {isGroup && c.description && (
        <section className="border-b border-border px-4 py-3.5">
          <h3 className={sectionTitle}>About</h3>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-text-primary">{c.description}</p>
        </section>
      )}

      {/* Members */}
      {isGroup && (
        <section className="border-b border-border px-4 pt-3 pb-2">
          <h3 className={sectionTitle}>Members · {c.members.length}</h3>
          <ul>
            {members.map((m) => (
              <MemberRow key={m.user.id} member={m} conversation={c} myId={myId} />
            ))}
          </ul>
        </section>
      )}

      <SharedMedia conversationId={c.id} />

      {isGroup && (
        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-error/30 bg-error/6 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10"
          >
            <LogOut size={16} /> Leave group
          </button>
        </div>
      )}

      <AddPeopleDialog open={adding} onClose={() => setAdding(false)} conversation={c} />
      <EditGroupDialog open={editing} onClose={() => setEditing(false)} conversation={c} />
      <ConfirmDialog
        open={confirmLeave}
        title={`Leave ${c.name}?`}
        body={
          c.members.length === 1
            ? "You're the last member — leaving deletes the group and its messages for good."
            : "You'll lose access to the group chat and won't get its messages anymore. Someone in the group can add you back."
        }
        confirmLabel="Leave group"
        loading={leave.isPending}
        error={leave.isError ? errorMessage(leave.error) : null}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => leave.mutate(myId)} // the hook returns to the chat list
      />
    </aside>
  );
}

export function MemberRow({ member: m, conversation: c, myId }: { member: ConversationMember; conversation: Conversation; myId: string }) {
  const presence = usePresence(m.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const remove = useRemoveMember(c.id);
  const setRole = useSetMemberRole(c.id);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const isMe = m.user.id === myId;
  const canChangeRole = c.myRole === 'owner' && !isMe && m.role !== 'owner';
  const canRemove = !isMe && m.role !== 'owner' && (c.myRole === 'owner' || (c.myRole === 'admin' && m.role === 'member'));
  const actionError = setRole.error ?? remove.error;

  return (
    <li className="relative flex items-center gap-2.5 py-2">
      <Avatar name={m.user.displayName} src={m.user.avatarUrl} size={36} status={presence.online ? 'online' : undefined} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-text-primary">
          {m.user.displayName}
          {isMe && <span className="font-normal text-text-secondary"> (You)</span>}
        </p>
        <p className="truncate text-[11px] text-text-secondary">
          {actionError ? <span className="text-error">{errorMessage(actionError)}</span> : formatLastSeen(presence.online, presence.lastSeenAt)}
        </p>
      </div>
      {m.role !== 'member' && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            m.role === 'owner' ? 'gradient-brand text-white' : 'bg-primary/10 text-primary',
          )}
        >
          {m.role === 'owner' ? 'Owner' : 'Admin'}
        </span>
      )}

      {(canChangeRole || canRemove) && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`Options for ${m.user.displayName}`}
            aria-expanded={menuOpen}
            className="flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute top-9 right-0 z-10 w-48 overflow-hidden rounded-md bg-card py-1 shadow-modal">
              {canChangeRole && (
                <MenuItem
                  icon={m.role === 'admin' ? <ShieldMinus size={16} /> : <ShieldCheck size={16} />}
                  label={m.role === 'admin' ? 'Remove as admin' : 'Make admin'}
                  onClick={() => {
                    setMenuOpen(false);
                    setRole.mutate({ userId: m.user.id, role: m.role === 'admin' ? 'member' : 'admin' });
                  }}
                />
              )}
              {canRemove && (
                <MenuItem
                  danger
                  icon={<UserMinus size={16} />}
                  label="Remove from group"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmRemove(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title={`Remove ${m.user.displayName}?`}
        body={`They'll lose access to ${c.name} and its messages. You can add them back later.`}
        confirmLabel="Remove"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => remove.mutate(m.user.id, { onSuccess: () => setConfirmRemove(false) })}
      />
    </li>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium hover:bg-bg',
        danger ? 'text-error' : 'text-text-primary',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function SharedMedia({ conversationId }: { conversationId: string }) {
  const media = useSharedMedia(conversationId);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const photos = media.data ?? [];

  return (
    <section className="border-b border-border px-4 py-3.5">
      <h3 className={sectionTitle}>Shared photos</h3>
      {media.isPending ? (
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-square rounded-sm" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-[13px] text-text-secondary">Photos you share will show up here.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenAt(i)}
              aria-label="Open photo"
              className="aspect-square overflow-hidden rounded-sm bg-surface-2 transition-opacity hover:opacity-85"
            >
              <img src={p.media!.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {openAt !== null && (
        <Lightbox
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
          images={photos.map((p) => ({ src: p.media!.url, caption: p.text || undefined }))}
        />
      )}
    </section>
  );
}

function AddPeopleDialog({ open, onClose, conversation }: { open: boolean; onClose: () => void; conversation: Conversation }) {
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const add = useAddMembers(conversation.id);
  const alreadyIn = new Set(conversation.members.map((m) => m.user.id));

  const close = () => {
    setSelected([]);
    add.reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add people"
      footer={
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
            onClick={() => add.mutate(selected.map((u) => u.id), { onSuccess: close })}
          >
            {selected.length === 0 ? 'Pick people to add' : `Add ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`}
          </Button>
        </>
      }
    >
      <PeoplePicker selected={selected} onChange={setSelected} alreadyIn={alreadyIn} autoFocus />
    </Modal>
  );
}

function EditGroupDialog({ open, onClose, conversation }: { open: boolean; onClose: () => void; conversation: Conversation }) {
  const [name, setName] = useState(conversation.name);
  const [description, setDescription] = useState(conversation.description);
  const update = useUpdateGroup(conversation.id);

  // Start from the latest values every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(conversation.name);
      setDescription(conversation.description);
      update.reset();
    }
  }

  const inputClass =
    'w-full rounded-md border-[1.5px] border-border bg-card px-4 py-2.5 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit group"
      footer={
        <Button
          fullWidth
          disabled={!name.trim()}
          loading={update.isPending}
          onClick={() => update.mutate({ name: name.trim(), description: description.trim() }, { onSuccess: onClose })}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        {update.isError && <FormAlert>{errorMessage(update.error)}</FormAlert>}
        <label>
          <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">Group name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">About (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="What's this group about?"
            className={cn(inputClass, 'resize-none')}
          />
          <span className="mt-1 block text-right text-xs text-text-tertiary">{description.length}/300</span>
        </label>
      </div>
    </Modal>
  );
}
