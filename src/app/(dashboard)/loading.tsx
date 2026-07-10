export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-bg-secondary" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-bg-secondary" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="price-tag-card h-24 animate-pulse rounded-xl bg-bg-secondary" />
        ))}
      </div>
      <div className="price-tag-card h-64 animate-pulse rounded-xl bg-bg-secondary" />
    </div>
  );
}
