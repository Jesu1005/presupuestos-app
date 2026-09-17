"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 ${className}`} />;
}

export function TarjetasSkeleton({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <ul className="mt-8 flex flex-col gap-4" aria-hidden>
      {Array.from({ length: cantidad }).map((_, i) => (
        <li key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="mt-2 h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full sm:col-span-2" />
          </div>
          <Skeleton className="mt-4 h-8 w-28" />
        </li>
      ))}
    </ul>
  );
}