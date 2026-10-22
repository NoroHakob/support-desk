"use client";

import { useEffect, useRef } from "react";

import { stats } from "@/components/landing/content";

const revealDelay = (index: number) => 0.5 + index * 0.08;
const countDuration = 1400;

export function Stats() {
  const listRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (
      !list ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const frames = new Set<number>();
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const countUp = (element: HTMLElement) => {
      const target = Number(element.dataset.countTo);
      const delay = Number(element.dataset.countDelay) * 1000;
      const timer = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / countDuration, 1);
          const eased = 1 - (1 - progress) ** 3;
          element.textContent = String(Math.round(target * eased));
          if (progress < 1) frames.add(requestAnimationFrame(tick));
        };
        frames.add(requestAnimationFrame(tick));
      }, delay);
      timers.add(timer);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (entry.target instanceof HTMLElement) countUp(entry.target);
        }
      },
      { threshold: 0.25 },
    );

    for (const element of list.querySelectorAll<HTMLElement>(
      "[data-count-to]",
    )) {
      element.textContent = "0";
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      for (const timer of timers) clearTimeout(timer);
      for (const frame of frames) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <dl
      ref={listRef}
      className="relative z-10 mx-auto grid w-full max-w-[920px] shrink-0 grid-cols-4 gap-x-4 gap-y-5 max-nav:grid-cols-2"
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="flex animate-reveal flex-col items-center gap-1.5 text-center motion-reduce:animate-none"
          style={{ animationDelay: `${revealDelay(index)}s` }}
        >
          <dt className="order-2 text-[clamp(11px,1.2vw,12.5px)] text-stat-label">
            {stat.label}
          </dt>
          <dd className="flex items-baseline gap-1 text-white">
            {stat.prefix && <StatGlyph>{stat.prefix}</StatGlyph>}
            <span
              data-count-to={stat.value}
              data-count-delay={revealDelay(index)}
              className="text-[clamp(18px,2.2vw,26px)] font-medium tracking-[-0.025em] tabular-nums"
            >
              {stat.value}
            </span>
            {stat.suffix && <StatGlyph>{stat.suffix}</StatGlyph>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StatGlyph({ children }: { children: string }) {
  return (
    <span className="font-display text-[clamp(22px,3vw,33px)] leading-none">
      {children}
    </span>
  );
}
