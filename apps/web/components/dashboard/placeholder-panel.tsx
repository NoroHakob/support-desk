export function PlaceholderPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-6 lg:px-6">
      <div className="flex min-h-64 items-center justify-center rounded-xl p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}
