export default function ProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        {/* avatar */}
        <div className="w-32 h-32 rounded-full bg-theme-border flex-shrink-0 border-4 border-theme-card shadow-xl" />

        <div className="flex-1 space-y-4">
          {/* name + role badge row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-56 bg-theme-border rounded" />
            <div className="h-6 w-20 rounded-full bg-theme-border" />
          </div>

          {/* bio */}
          <div className="space-y-1">
            <div className="h-4 w-full max-w-lg bg-theme-border rounded" />
            <div className="h-4 w-3/4 max-w-sm bg-theme-border rounded" />
          </div>

          {/* skills heading + pills */}
          <div className="space-y-2">
            <div className="h-3.5 w-12 bg-theme-border rounded" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-16 bg-theme-border rounded-full" />
              ))}
            </div>
          </div>

          {/* stats row: wallet, member since, rating */}
          <div className="flex flex-wrap gap-6">
            <div className="h-4 w-32 bg-theme-border rounded" />
            <div className="h-4 w-36 bg-theme-border rounded" />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 w-4 bg-theme-border rounded" />
                ))}
              </div>
              <div className="h-4 w-12 bg-theme-border rounded" />
              <div className="h-4 w-2 bg-theme-border rounded" />
              <div className="h-4 w-16 bg-theme-border rounded" />
            </div>
          </div>

          {/* reputation card */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="h-5 w-40 bg-theme-border rounded" />
                <div className="h-3.5 w-36 bg-theme-border rounded" />
              </div>
              <div className="h-6 w-24 rounded-full bg-theme-border" />
            </div>
            <div className="space-y-1">
              <div className="h-8 w-20 bg-theme-border rounded" />
              <div className="h-3.5 w-48 bg-theme-border rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* left sidebar */}
        <div className="space-y-6">
          {/* completeness card */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-theme-border rounded" />
              <div className="h-5 w-10 bg-theme-border rounded" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-theme-border" />
            <div className="h-3.5 w-64 bg-theme-border rounded" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3.5 w-48 bg-theme-border rounded" />
              ))}
            </div>
            <div className="h-10 w-full rounded-lg bg-theme-border" />
          </div>

          {/* stats card */}
          <div className="card space-y-3">
            <div className="h-5 w-12 bg-theme-border rounded" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-theme-border">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-theme-border rounded" />
                    <div className="h-3.5 w-28 bg-theme-border rounded" />
                  </div>
                  <div className="h-4 w-16 bg-theme-border rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* verified card */}
          <div className="card space-y-3">
            <div className="h-5 w-16 bg-theme-border rounded" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-theme-border rounded" />
                  <div className="h-3.5 w-28 bg-theme-border rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* tabs */}
          <div className="flex gap-8 border-b border-theme-border pb-px">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-32 bg-theme-border rounded pb-4" />
            ))}
          </div>

          {/* review cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-theme-border shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-theme-border rounded" />
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="h-3.5 w-3.5 bg-theme-border rounded" />
                      ))}
                    </div>
                  </div>
                  <div className="h-3 w-24 bg-theme-border rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-theme-border rounded" />
              <div className="h-4 w-4/5 bg-theme-border rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
