import { cn } from "cn";

export function SettingsSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="@container divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  className,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "div";
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 @xl:flex-row @xl:items-start @xl:gap-8",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 @xl:w-48 @xl:shrink-0 @xl:pt-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function SettingsBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
