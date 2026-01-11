import { Skeleton } from "@/components/ui/skeleton";

const MangaCardSkeleton = () => {
  return (
    <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Skeleton className="w-full h-full" />
        {/* Type badge skeleton */}
        <Skeleton className="absolute top-2 left-2 h-5 w-14 rounded-full" />
        {/* Views badge skeleton */}
        <Skeleton className="absolute top-2 right-2 h-6 w-12 rounded-md" />
      </div>
      
      {/* Info */}
      <div className="p-2.5 md:p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default MangaCardSkeleton;
