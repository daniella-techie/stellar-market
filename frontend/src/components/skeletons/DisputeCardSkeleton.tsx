export default function DisputeCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div className="flex-1 space-y-3">
          {/* status badge + date */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 rounded-full bg-theme-border" />
            <div className="h-3.5 w-24 rounded bg-theme-border" />
          </div>

          {/* title */}
          <div className="h-6 w-3/4 rounded bg-theme-border" />

          {/* reason */}
          <div className="h-4 w-full rounded bg-theme-border" />

          {/* initiator vs respondent + escrow */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-theme-border" />
              <div className="h-3.5 w-36 rounded bg-theme-border" />
            </div>
            <div className="h-3.5 w-28 rounded bg-theme-border" />
          </div>
        </div>

        {/* voting progress section */}
        <div className="w-full md:w-64 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-theme-border md:pl-6 flex flex-col justify-center gap-3">
          {/* progress label + count */}
          <div className="flex justify-between">
            <div className="h-3.5 w-24 rounded bg-theme-border" />
            <div className="h-3.5 w-20 rounded bg-theme-border" />
          </div>

          {/* progress bar */}
          <div className="h-2 w-full rounded-full bg-theme-border" />

          {/* CTA */}
          <div className="flex justify-end">
            <div className="h-4 w-28 rounded bg-theme-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
