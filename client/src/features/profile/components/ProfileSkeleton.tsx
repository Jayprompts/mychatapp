import { Skeleton } from '@/components/ui/Skeleton';

export function ProfileSkeleton() {
  return (
    <div className="overflow-hidden bg-card sm:rounded-xl sm:shadow-card">
      <Skeleton className="h-28 rounded-none sm:h-36" />
      <div className="px-5 pb-5 sm:px-6">
        <Skeleton className="-mt-11 size-[88px] rounded-full ring-4 ring-card" />
        <Skeleton className="mt-3 h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-28" />
        <Skeleton className="mt-5 h-16 w-full rounded-[14px]" />
      </div>
    </div>
  );
}
