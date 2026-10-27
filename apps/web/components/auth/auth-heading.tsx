export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
      {description ? (
        <p className="text-sm text-balance text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
