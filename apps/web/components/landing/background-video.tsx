import { backgroundVideoUrl } from "@/components/landing/content";

export function BackgroundVideo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <video
        className="size-full object-cover"
        src={backgroundVideoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}
