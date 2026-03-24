interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-theme-card border border-theme-border rounded-lg ${className}`}
    />
  );
}
