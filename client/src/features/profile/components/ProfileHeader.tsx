import type { ReactNode } from 'react';
import { CalendarDays, Camera, Globe, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { usePresence } from '@/features/chat/liveState';
import { formatLastSeen } from '@/lib/time';
import type { Profile } from '../types';

const compact = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

// Per the design: gradient cover, big avatar, name, @username, bio, joined/website/location, stats.
export function ProfileHeader({ profile: p, actions, onAvatarClick }: { profile: Profile; actions: ReactNode; onAvatarClick?: () => void }) {
  const presence = usePresence(p);
  const joined = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const avatar = <Avatar name={p.displayName} src={p.avatarUrl} size={88} status={!p.isMe && presence.online ? 'online' : undefined} className="rounded-full ring-4 ring-card" />;

  return (
    <section className="overflow-hidden bg-card sm:rounded-xl sm:shadow-card">
      <div className="gradient-brand relative h-28 overflow-hidden sm:h-36" aria-hidden>
        <span className="absolute -top-5 -right-5 size-48 rounded-full bg-white/7" />
        <span className="absolute -bottom-5 left-10 size-28 rounded-full bg-white/5" />
      </div>
      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-11 mb-3 flex items-end justify-between gap-3">
          {onAvatarClick ? (
            <button type="button" onClick={onAvatarClick} aria-label="Change profile photo" className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {avatar}
              <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary-solid text-white shadow transition-transform group-hover:scale-110">
                <Camera size={15} />
              </span>
            </button>
          ) : (
            <span className="relative">{avatar}</span>
          )}
          <div className="flex items-center gap-2 pb-1">{actions}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-bold tracking-tight text-text-primary">{p.displayName}</h1>
          {p.role !== 'user' && <RoleBadge role={p.role} />}
        </div>
        <p className="text-[15px] text-text-secondary">
          @{p.username}
          {!p.isMe && (presence.online || presence.lastSeenAt) && (
            <span className={presence.online ? 'text-success' : ''}> · {formatLastSeen(presence.online, presence.lastSeenAt)}</span>
          )}
        </p>
        {p.bio && <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed whitespace-pre-wrap text-text-primary">{p.bio}</p>}

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-text-secondary">
          <li className="flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden /> Joined {joined}
          </li>
          {p.website && (
            <li className="flex items-center gap-1.5">
              <Globe size={14} aria-hidden />
              <a href={`https://${p.website}`} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-primary hover:underline">
                {p.website}
              </a>
            </li>
          )}
          {p.location && (
            <li className="flex items-center gap-1.5">
              <MapPin size={14} aria-hidden /> {p.location}
            </li>
          )}
        </ul>

        <dl className="mt-5 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-[14px] border border-border">
          {[
            { label: 'Communities', value: p.stats.communities },
            { label: 'Posts', value: p.stats.posts },
            { label: 'Likes', value: p.stats.likes },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center py-3">
              <dt className="text-xs text-text-secondary">{s.label}</dt>
              <dd className="text-lg font-bold text-text-primary">{compact(s.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
