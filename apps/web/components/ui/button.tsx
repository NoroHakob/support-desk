import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,translate,scale] duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-white font-semibold text-black shadow-glow duration-300 ease-out-expo hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-glow-strong focus-visible:ring-white/50",
        ink: "bg-ink text-ink-foreground shadow-soft duration-300 ease-out-expo hover:-translate-y-px hover:bg-ink-hover hover:text-white focus-visible:ring-white/30",
        "form-primary":
          "relative z-10 bg-white font-semibold text-black shadow-glow hover:shadow-glow-strong focus-visible:ring-white/50",
        "form-secondary":
          "border-white/10 bg-ink text-ink-foreground hover:bg-ink-hover hover:text-white focus-visible:ring-white/30",
        "form-ghost":
          "text-ink-foreground/60 hover:text-white focus-visible:ring-white/30",
        nav: "relative font-medium tracking-[-0.01em] text-nav-foreground opacity-50 after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-[15px] after:-translate-x-1/2 after:bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.6px)] after:bg-size-[5px_3px] after:opacity-0 hover:opacity-75 aria-[current=page]:opacity-100 aria-[current=page]:after:opacity-100",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        pill: "h-[clamp(44px,5.2vw,48px)] gap-2 rounded-full px-[clamp(16px,2vw,22px)]",
        cta: "h-auto gap-2 rounded-full px-[clamp(22px,2.8vw,30px)] py-[clamp(12px,1.4vw,15px)] text-[clamp(13.5px,1.5vw,14.5px)]",
        "icon-pill":
          "size-12 rounded-full [&_svg:not([class*='size-'])]:size-5",
        field: "h-12 gap-2 rounded-lg px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
