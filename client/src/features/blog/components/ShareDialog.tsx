import { useState } from 'react';
import { ArrowLeft, Check, Copy, MessageCircle, Search, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useMe } from '@/features/auth/api';
import { useConversations } from '@/features/chat/api';
import { ConversationAvatar } from '@/features/chat/components/ConversationAvatar';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { authorName, postUrl } from '../format';
import type { PostCard } from '../types';
import { PostCover } from './PostCover';

// Share, per the design: copy link · send in a chat (mini conversation picker) · X · the phone's share sheet.
export function ShareDialog({ post, open, onClose }: { post: PostCard; open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'main' | 'chat'>('main');
  const close = () => {
    setMode('main');
    onClose();
  };
  const url = postUrl(post.id);
  const canNativeShare = typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast("Couldn't copy — select the link and copy it", 'error');
    }
  };

  const tile = 'flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-[11px] font-semibold text-text-primary transition-colors hover:border-primary/25 hover:bg-primary/4';

  return (
    <Modal open={open} onClose={close} title={mode === 'chat' ? 'Send in a chat' : 'Share post'}>
      {mode === 'chat' ? (
        <ChatPicker post={post} onBack={() => setMode('main')} />
      ) : (
        <div className="flex flex-col gap-4 p-5">
          <PostPreview post={post} />
          <div className={cn('grid gap-2.5', canNativeShare ? 'grid-cols-4' : 'grid-cols-3')}>
            <button type="button" className={tile} onClick={() => void copy()}>
              <Copy size={20} className="text-primary" /> Copy link
            </button>
            <button type="button" className={tile} onClick={() => setMode('chat')}>
              <MessageCircle size={20} className="text-primary" /> Message
            </button>
            <a
              className={tile}
              href={`https://twitter.com/intent/tweet?${new URLSearchParams({ text: post.title, url })}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-lg leading-5 font-bold">𝕏</span> Post on X
            </a>
            {canNativeShare && (
              <button type="button" className={tile} onClick={() => void navigator.share({ title: post.title, url }).catch(() => undefined)}>
                <Share2 size={20} className="text-primary" /> More
              </button>
            )}
          </div>
          <div className="flex overflow-hidden rounded-xl border-[1.5px] border-border bg-bg">
            <input readOnly value={url} aria-label="Post link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 font-mono text-xs text-text-secondary outline-none" />
            <button type="button" onClick={() => void copy()} className="border-l border-border bg-primary/8 px-4 text-[13px] font-bold text-primary hover:bg-primary/12">
              Copy
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function PostPreview({ post }: { post: PostCard }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-2.5">
      <PostCover coverUrl={post.coverUrl} theme={post.coverTheme} className="size-12 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-text-primary">{post.title}</p>
        <p className="text-xs text-text-secondary">
          {authorName(post)} · {post.readMinutes} min read
        </p>
      </div>
    </div>
  );
}

function ChatPicker({ post, onBack }: { post: PostCard; onBack: () => void }) {
  const { data: me } = useMe();
  const { data: conversations = [] } = useConversations();
  const [q, setQ] = useState('');
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const shown = conversations.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  // Sent as a normal message; the chat shows it as a post card (see PostLinkPreview).
  const send = async (conversationId: string) => {
    setSending(conversationId);
    try {
      await api(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { text: `${post.title}\n${postUrl(post.id)}`, clientId: crypto.randomUUID() },
      });
      setSent((s) => new Set(s).add(conversationId));
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <button type="button" onClick={onBack} aria-label="Back to share options" className="flex size-8 items-center justify-center rounded-full hover:bg-bg">
          <ArrowLeft size={18} />
        </button>
        <label className="flex flex-1 items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2">
          <Search size={15} className="text-text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
          />
        </label>
      </div>
      <div className="border-b border-border bg-primary/3 px-4 py-2.5">
        <PostPreview post={post} />
      </div>
      <ul className="max-h-[50dvh] overflow-y-auto">
        {shown.length === 0 && <li className="px-5 py-8 text-center text-sm text-text-secondary">{conversations.length ? 'No chats match.' : 'No chats yet.'}</li>}
        {shown.map((c) => (
          <li key={c.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
            <ConversationAvatar conversation={c} myId={me?.id} size={40} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{c.name}</span>
            {sent.has(c.id) ? (
              <span className="flex items-center gap-1 text-xs font-bold text-success">
                <Check size={14} /> Sent
              </span>
            ) : (
              <button
                type="button"
                disabled={sending === c.id}
                onClick={() => void send(c.id)}
                aria-label={`Send to ${c.name}`}
                className="rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/12 disabled:opacity-50"
              >
                {sending === c.id ? 'Sending…' : 'Send'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
