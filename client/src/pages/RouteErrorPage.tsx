import { useRouteError } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Catches unexpected render errors anywhere in the app instead of showing a blank white page.
export function RouteErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <TriangleAlert size={44} strokeWidth={1.5} className="mb-5 text-warning" aria-hidden />
      <h1 className="text-[22px] font-semibold text-text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-[15px] text-text-secondary">An unexpected error occurred. Reloading usually fixes it.</p>
      <Button className="mt-8" onClick={() => window.location.reload()}>
        Reload page
      </Button>
    </div>
  );
}
