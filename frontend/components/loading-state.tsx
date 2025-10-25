export function LoadingState() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border">
        <div className="col-span-3 h-4 bg-muted animate-pulse rounded" />
        <div className="col-span-2 h-4 bg-muted animate-pulse rounded" />
        <div className="col-span-3 h-4 bg-muted animate-pulse rounded" />
        <div className="col-span-2 h-4 bg-muted animate-pulse rounded" />
        <div className="col-span-2 h-4 bg-muted animate-pulse rounded" />
      </div>

      {/* Skeleton Rows */}
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
            <div className="col-span-3 flex items-center gap-3">
              <div className="h-6 w-6 bg-muted animate-pulse rounded" />
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="col-span-3">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
