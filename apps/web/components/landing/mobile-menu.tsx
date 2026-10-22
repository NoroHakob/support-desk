"use client";

import Link from "next/link";
import { useState } from "react";

import { navLinks, signInLink } from "@/components/landing/content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ink"
            size="icon-pill"
            aria-label={open ? "Close menu" : "Open menu"}
            className={className}
          />
        }
      >
        <span aria-hidden="true" className="relative block h-3 w-[18px]">
          <span className="absolute inset-x-0 top-0.5 h-0.5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out-expo group-data-popup-open/button:translate-y-[3px] group-data-popup-open/button:rotate-45" />
          <span className="absolute inset-x-0 bottom-0.5 h-0.5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out-expo group-data-popup-open/button:-translate-y-[3px] group-data-popup-open/button:-rotate-45" />
        </span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/62 supports-backdrop-filter:backdrop-blur-[6px] data-open:animate-overlay-in motion-reduce:animate-none"
        className="top-[calc(clamp(16px,2.4vh,28px)+60px)] right-[clamp(14px,3vw,32px)] left-[clamp(14px,3vw,32px)] w-auto max-w-none translate-x-0 translate-y-0 gap-1 rounded-[28px] bg-white p-3 text-nav-foreground shadow-sheet ring-0 motion-reduce:animate-none sm:max-w-none data-open:animate-menu-in"
      >
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <nav aria-label="Main" className="flex flex-col">
          {navLinks.map((link, index) => (
            <Button
              key={link.label}
              variant="nav"
              nativeButton={false}
              render={<Link href={link.href} onClick={() => setOpen(false)} />}
              aria-current={link.current ? "page" : undefined}
              className="h-12 animate-link-in justify-start px-4 text-base after:left-4 after:translate-x-0 motion-reduce:animate-none"
              style={{ animationDelay: `${0.06 + index * 0.04}s` }}
            >
              {link.label}
            </Button>
          ))}
        </nav>
        <Button
          variant="ink"
          size="pill"
          nativeButton={false}
          render={
            <Link href={signInLink.href} onClick={() => setOpen(false)} />
          }
          className="mt-2 w-full animate-link-in motion-reduce:animate-none"
          style={{ animationDelay: `${0.06 + navLinks.length * 0.04}s` }}
        >
          {signInLink.label}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
