export default function DisputeHistoryCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
        <div className="flex-1 space-y-4">
          {/* title + ID + status */}
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <div className="h-6 w-64 rounded bg-theme-border" />
              <div className="h-3.5 w-32 rounded bg-theme-border" />
            </div>
            <div className="h-6 w-28 rounded-full bg-theme-border shrink-0" />
          </div>

          {/* 4-column detail grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-theme-border" />
              <div className="h-4 w-24 rounded bg-theme-border" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-theme-border" />
              <div className="h-4 w-24 rounded bg-theme-border" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-12 rounded bg-theme-border" />
              <div className="h-4 w-20 rounded bg-theme-border" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-12 rounded bg-theme-border" />
              <div className="h-4 w-20 rounded bg-theme-border" />
            </div>
          </div>

          {/* reason box */}
          <div className="p-3 rounded-lg bg-theme-bg-secondary space-y-1">
            <div className="h-3 w-12 rounded bg-theme-border" />
            <div className="h-3.5 w-full rounded bg-theme-border" />
            <div className="h-3.5 w-3/4 rounded bg-theme-border" />
          </div>
        </div>

        {/* outcome panel placeholder */}
        <div className="md:w-48 p-4 rounded-lg bg-theme-border/30 space-y-2">
          <div className="h-3 w-16 rounded bg-theme-border" />
          <div className="h-4 w-full rounded bg-theme-border" />
        </div>
      </div>
    </div>
  );
}
