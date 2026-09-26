import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { buttonClasses } from '@/components/ui/buttonClasses';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-linear-135 from-[#00B2FF]/12 to-[#B620E0]/12">
        <Compass size={44} strokeWidth={1.5} className="text-primary" aria-hidden />
      </div>
      <p className="gradient-brand-text text-5xl font-bold">404</p>
      <h1 className="mt-3 text-[22px] font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 max-w-xs text-[15px] text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className={buttonClasses({ className: 'mt-8' })}>
        Go back home
      </Link>
    </main>
  );
}
