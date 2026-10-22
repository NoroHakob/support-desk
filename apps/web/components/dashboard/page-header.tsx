export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
