export default function JobCardSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* category + status + bookmark row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-20 bg-theme-border rounded" />
          <div className="h-5 w-16 bg-theme-border rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-theme-border rounded" />
          <div className="h-8 w-8 rounded-full bg-theme-border" />
        </div>
      </div>

      {/* image placeholder */}
      <div className="h-48 w-full bg-theme-border rounded-lg mb-4" />

      {/* title */}
      <div className="h-5 w-3/4 bg-theme-border rounded mb-2" />

      {/* description lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-3.5 w-full bg-theme-border rounded" />
        <div className="h-3.5 w-5/6 bg-theme-border rounded" />
      </div>

      {/* category tag + skills pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-20 bg-theme-border rounded-full" />
        <div className="h-6 w-16 bg-theme-border rounded-full" />
        <div className="h-6 w-24 bg-theme-border rounded-full" />
        <div className="h-6 w-20 bg-theme-border rounded-full" />
        <div className="h-6 w-14 bg-theme-border rounded-full" />
      </div>

      {/* meta row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <div className="h-3.5 w-4 bg-theme-border rounded" />
          <div className="h-3.5 w-20 bg-theme-border rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3.5 w-4 bg-theme-border rounded" />
          <div className="h-3.5 w-20 bg-theme-border rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3.5 w-4 bg-theme-border rounded" />
          <div className="h-3.5 w-20 bg-theme-border rounded" />
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-theme-border" />
          <div className="h-3.5 w-20 bg-theme-border rounded" />
        </div>
        <div className="h-6 w-14 bg-theme-border rounded-full" />
      </div>
    </div>
  );
}
