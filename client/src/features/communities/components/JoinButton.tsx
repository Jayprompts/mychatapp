import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useCancelRequest, useJoinCommunity } from '../api';
import type { CommunityCard } from '../types';

// Join (public) · Request to join (private) · Requested — tap to cancel · Joined ✓
export function JoinButton({ community, size = 'sm', onJoined }: { community: CommunityCard; size?: 'sm' | 'md'; onJoined?: () => void }) {
  const join = useJoinCommunity();
  const cancel = useCancelRequest();
  const busy = join.isPending || cancel.isPending;
  const fail = (err: unknown) => toast(errorMessage(err), 'error');

  if (community.myStatus === 'member') {
    return (
      <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-success px-4 text-sm font-bold text-success">
        <Check size={15} strokeWidth={2.5} /> Joined
      </span>
    );
  }

  if (community.myStatus === 'requested') {
    return (
      <Button
        size={size}
        variant="outline"
        loading={busy}
        onClick={(e) => {
          e.preventDefault();
          cancel.mutate(community.id, { onError: fail });
        }}
        className="border-warning/60 bg-warning/10 text-warning-ink hover:bg-warning/15"
        title="Tap to cancel your request"
      >
        <Clock size={15} /> Requested
      </Button>
    );
  }

  return (
    <Button
      size={size}
      loading={busy}
      onClick={(e) => {
        e.preventDefault(); // cards are links — don't navigate
        join.mutate(community.id, {
          onSuccess: (c) => {
            if (c.myStatus === 'member') {
              toast(`Welcome to ${c.name} 🎉`);
              onJoined?.();
            } else toast('Request sent — an admin will review it');
          },
          onError: fail,
        });
      }}
    >
      {community.visibility === 'private' ? 'Request to join' : 'Join'}
    </Button>
  );
}
