import { LoaderCircle, Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '@/lib/connection';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/cn';

const TEXT = {
  offline: 'You’re offline — messages will send when you’re back online',
  reconnecting: 'Reconnecting…',
  back: 'Back online',
};

// Per the design: a slim bar across the top of the app (timing lives in lib/connection).
export function ConnectionBanner() {
  const { banner } = useConnection();
  if (!banner) return null;
  return (
    <div
      role="status"
      className={cn(
        'z-50 flex shrink-0 items-center gap-2.5 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2 text-[13px] font-semibold text-white transition-colors duration-300',
        banner === 'offline' ? 'bg-[#B37D00]' : 'bg-success',
      )}
    >
      {banner === 'offline' && <WifiOff size={15} aria-hidden />}
      {banner === 'reconnecting' && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
      {banner === 'back' && <Wifi size={15} aria-hidden />}
      <span className="min-w-0 flex-1">{TEXT[banner]}</span>
      {banner === 'offline' && (
        <button type="button" onClick={() => getSocket().connect()} className="shrink-0 rounded-[5px] bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30">
          Reconnect
        </button>
      )}
    </div>
  );
}
