import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-linear-135 from-[#00B2FF]/12 to-[#B620E0]/12">
        <Icon size={34} strokeWidth={1.5} className="text-primary" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
