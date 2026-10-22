import { BackgroundVideo } from "@/components/landing/background-video";
import { Hero } from "@/components/landing/hero";
import { SiteHeader } from "@/components/landing/site-header";
import { Stats } from "@/components/landing/stats";

export default function HomePage() {
  return (
    <main className="dark relative flex h-dvh flex-col overflow-hidden bg-black px-[clamp(14px,3vw,32px)] py-[clamp(16px,2.4vh,28px)] text-white">
      <BackgroundVideo />
      <SiteHeader />
      <Hero />
      <Stats />
    </main>
  );
}
