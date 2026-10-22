import { backgroundVideoUrl } from "@/components/landing/content";
import { MediaQueryGate } from "@/components/media-query-gate";

export function BackgroundVideo({ media }: { media?: string }) {
  const video = (
    <video
      className="size-full object-cover"
      src={backgroundVideoUrl}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    />
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {media ? <MediaQueryGate query={media}>{video}</MediaQueryGate> : video}
    </div>
  );
}
