import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

// Red banner for form-level errors (e.g. "Invalid email/username or password").
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border-[1.5px] border-error/25 bg-error/6 px-4 py-3 text-[13px] font-medium text-error"
    >
      <CircleAlert size={16} className="mt-px shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
