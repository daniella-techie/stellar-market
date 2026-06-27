export default function TransactionRowSkeleton() {
  return (
    <article className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center animate-pulse">
      <div className="flex min-w-0 items-start gap-4">
        {/* direction icon */}
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-theme-border bg-theme-bg">
          <div className="h-4 w-4 rounded bg-theme-border" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {/* type badge + title row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-20 rounded-full bg-theme-border" />
            <div className="h-4 w-40 rounded bg-theme-border" />
          </div>

          {/* counterparty + milestone + date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="h-4 w-32 rounded-full bg-theme-border" />
            <div className="h-3.5 w-28 rounded bg-theme-border" />
            <div className="h-3.5 w-24 rounded bg-theme-border" />
          </div>
        </div>
      </div>

      {/* amount + explorer link */}
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="h-4 w-24 rounded bg-theme-border" />
        <div className="h-3.5 w-28 rounded bg-theme-border" />
      </div>
    </article>
  );
}
