import { cn } from "cn";

export function FormAlert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "notice";
}) {
  if (!children) {
    return null;
  }

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "text-center text-sm text-balance",
        tone === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
