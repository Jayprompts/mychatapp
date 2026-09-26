import { Link } from 'react-router';
import { ArrowLeft, Globe, Lock, Users } from 'lucide-react';
import { buttonClasses } from '@/components/ui/buttonClasses';
import type { CommunityDetail } from '../types';
import { CommunityAvatar, CommunityCover } from './CommunityAvatar';
import { JoinButton } from './JoinButton';

// What non-members see: the public card, and how to get in.
export function CommunityPreview({ community: c, invited = false }: { community: CommunityDetail; invited?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-bg">
      <CommunityCover coverUrl={c.coverUrl} theme={c.theme} className="h-40 sm:h-52">
        <Link
          to="/communities"
          aria-label="Back to communities"
          className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/50 md:hidden"
        >
          <ArrowLeft size={18} />
        </Link>
      </CommunityCover>
      <div className="mx-auto max-w-xl px-4 pb-10 sm:px-6">
        <CommunityAvatar icon={c.icon} theme={c.theme} size={80} className="relative -mt-10 ring-4 ring-bg" />
        {invited && <p className="mt-4 text-sm font-semibold text-primary">You've been invited to join</p>}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{c.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-text-secondary">
          {c.visibility === 'private' ? <Lock size={14} /> : <Globe size={14} />}
          {c.visibility === 'private' ? 'Private' : 'Public'} community
          <span>·</span>
          <Users size={14} /> {c.memberCount.toLocaleString()} {c.memberCount === 1 ? 'member' : 'members'}
          {c.onlineCount > 0 && <span className="text-success">· {c.onlineCount} online</span>}
        </p>
        <span className="mt-3 inline-block rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary-ink">{c.category}</span>
        <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-text-primary">{c.description || 'No description yet.'}</p>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          {c.myStatus === 'member' && c.conversationId ? (
            <Link to={`/communities/${c.id}`} className={buttonClasses({ fullWidth: true })}>
              Open community
            </Link>
          ) : (
            <>
              <p className="mb-3 text-sm text-text-secondary">
                {c.myStatus === 'requested'
                  ? 'Your request is waiting for an admin to approve it. Tap below to cancel it.'
                  : c.visibility === 'private'
                    ? 'This is a private community. Ask to join and an admin will review your request.'
                    : 'Join to read and send messages, voice notes and photos.'}
              </p>
              <JoinButton community={c} size="md" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
