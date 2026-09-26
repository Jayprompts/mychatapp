import { Link } from 'react-router';
import { Lock, Star } from 'lucide-react';
import type { CommunityCard } from '../types';
import { CommunityAvatar, CommunityCover } from './CommunityAvatar';
import { JoinButton } from './JoinButton';

// Discover card, per the design: cover, private/featured badges, icon + name, counts, category, blurb, join.
export function CommunityCardView({ community: c }: { community: CommunityCard }) {
  return (
    <Link
      to={`/communities/${c.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-modal focus-visible:outline-2 focus-visible:outline-primary"
    >
      <CommunityCover coverUrl={c.coverUrl} theme={c.theme} className="h-20 shrink-0">
        {c.visibility === 'private' && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white">
            <Lock size={10} strokeWidth={2.5} /> Private
          </span>
        )}
        {c.featured && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-warning/90 px-2.5 py-1 text-[10px] font-bold text-white">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        )}
      </CommunityCover>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center gap-2.5">
          <CommunityAvatar icon={c.icon} theme={c.theme} size={44} />
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-text-primary">{c.name}</h3>
            <p className="text-xs text-text-secondary">
              {c.memberCount.toLocaleString()} {c.memberCount === 1 ? 'member' : 'members'}
              {c.onlineCount > 0 && <span className="text-success"> · {c.onlineCount} online</span>}
            </p>
          </div>
        </div>
        <span className="self-start rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-bold text-primary-ink">{c.category}</span>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-text-secondary">{c.description || 'No description yet.'}</p>
        <div className="self-start">
          <JoinButton community={c} />
        </div>
      </div>
    </Link>
  );
}
