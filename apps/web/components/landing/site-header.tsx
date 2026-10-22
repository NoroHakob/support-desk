import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { navLinks, signInLink } from "@/components/landing/content";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="relative z-60 mx-auto flex w-full max-w-[720px] shrink-0 animate-slide-down items-center justify-between gap-[clamp(18px,2.8vw,28px)] motion-reduce:animate-none">
      <Link
        href="/"
        aria-label="SupportDesk home"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-soft transition-[translate] duration-300 ease-out-expo hover:-translate-y-px"
      >
        <LogoMark className="size-[72%]" />
      </Link>
      <nav
        aria-label="Main"
        className="flex h-[clamp(44px,5.2vw,48px)] max-w-[430px] flex-1 items-center justify-between rounded-full bg-white px-2 shadow-soft max-nav:hidden"
      >
        {navLinks.map((link) => (
          <Button
            key={link.label}
            variant="nav"
            nativeButton={false}
            render={<Link href={link.href} />}
            aria-current={link.current ? "page" : undefined}
            className="h-9 px-3 text-[clamp(13px,1.4vw,15px)]"
          >
            {link.label}
          </Button>
        ))}
      </nav>
      <Button
        variant="ink"
        size="pill"
        nativeButton={false}
        render={<Link href={signInLink.href} />}
        className="max-nav:hidden"
      >
        {signInLink.label}
      </Button>
      <MobileMenu className="nav:hidden" />
    </header>
  );
}
