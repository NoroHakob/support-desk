import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { hero } from "@/components/landing/content";
import { TrustRow } from "@/components/landing/trust-row";
import { Button } from "@/components/ui/button";

const headlineDelays = ["0.12s", "0.3s"];

export function Hero() {
  return (
    <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col items-center justify-center text-center">
      <TrustRow className="animate-reveal [animation-delay:0.05s] motion-reduce:animate-none" />
      <h1 className="mt-[clamp(18px,3.2vh,32px)] font-display text-[clamp(30px,10.2vw,80px)] leading-[1.12] font-normal tracking-[-0.04em] text-white max-nav:leading-[1.05] max-nav:tracking-[-0.03em] max-xs:leading-[1.04] max-xs:tracking-[-0.04em] [@media(max-height:700px)]:mt-4">
        {hero.headline.map((line, index) => (
          <span
            key={line}
            className="block animate-headline whitespace-nowrap motion-reduce:animate-none"
            style={{ animationDelay: headlineDelays[index] }}
          >
            {line}
          </span>
        ))}
      </h1>
      <p className="mt-[clamp(14px,2.4vh,24px)] max-w-[min(500px,92%)] animate-reveal text-[clamp(calc(13.5px+2pt),calc(1.55vw+2pt),calc(16.5px+2pt))] leading-[1.55] text-hero-subhead/80 [animation-delay:0.28s] motion-reduce:animate-none [@media(max-height:700px)]:mt-3">
        {hero.subhead}
      </p>
      <Button
        variant="glow"
        size="cta"
        nativeButton={false}
        render={<Link href={hero.cta.href} />}
        className="mt-[clamp(22px,4vh,40px)] animate-reveal-pulse [animation-delay:0.4s] motion-reduce:animate-none [@media(max-height:700px)]:mt-5"
      >
        {hero.cta.label}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </section>
  );
}
