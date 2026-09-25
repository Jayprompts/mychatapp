import { LogoMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

// Shown while we check the session on first load — or if the API can't be reached.
export function SplashScreen({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <LogoMark size={64} className={error ? undefined : 'animate-pulse'} />
      {error && (
        <div className="flex flex-col items-center gap-4">
          <p className="max-w-xs text-sm text-text-secondary">{error}</p>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
