import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { BackgroundVideo } from "@/components/landing/background-video";
import { authShowcase } from "@/components/landing/content";
import { TrustRow } from "@/components/landing/trust-row";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <div className="dark grid min-h-dvh bg-black text-foreground lg:grid-cols-2">
      <div className="flex flex-col gap-8 px-4 py-6 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex w-fit animate-slide-down items-center gap-3 font-semibold text-white motion-reduce:animate-none"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-black shadow-soft">
            <LogoMark className="size-[72%]" />
          </span>
          SupportDesk
        </Link>
        <main className="flex flex-1 items-center justify-center pb-10">
          <div className="w-full max-w-[400px] animate-reveal rounded-2xl border border-white/10 bg-background p-6 shadow-sheet [animation-delay:0.05s] motion-reduce:animate-none sm:p-8">
            {children}
          </div>
        </main>
      </div>
      <div className="relative m-3 hidden overflow-hidden rounded-2xl bg-ink lg:block">
        <BackgroundVideo media="(min-width: 64rem)" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-6 p-10 text-white">
          <TrustRow className="animate-reveal [animation-delay:0.2s] motion-reduce:animate-none" />
          <h2 className="font-display text-[clamp(36px,3.8vw,56px)] leading-[1.05] tracking-[-0.03em]">
            {authShowcase.headline.map((line, index) => (
              <span
                key={line}
                className="block animate-headline whitespace-nowrap motion-reduce:animate-none"
                style={{ animationDelay: `${0.12 + index * 0.18}s` }}
              >
                {line}
              </span>
            ))}
          </h2>
        </div>
      </div>
    </div>
  );
}
