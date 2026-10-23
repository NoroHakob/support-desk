"use client";

import { AGENT_AVATAR_MAX_BYTES, imageFileTypes } from "@marshaldesk/shared";
import { LoaderCircle } from "lucide-react";

import { Dropzone } from "@/components/dashboard/dropzone";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/widget/widget-panel";

export function AgentAvatarField({
  avatarUrl,
  agentName,
  custom,
  uploading,
  busy,
  error,
  onUpload,
  onRemove,
}: {
  avatarUrl: string;
  agentName: string;
  custom: boolean;
  uploading: boolean;
  busy: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <AgentAvatar src={avatarUrl} name={agentName} size="lg" />
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <LoaderCircle className="size-4 animate-spin" />
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Dropzone
          compact
          disabled={busy}
          accept={imageFileTypes}
          typeLabel="PNG, JPEG, GIF or WebP"
          maxBytes={AGENT_AVATAR_MAX_BYTES}
          title={uploading ? "Uploading…" : "Upload an avatar"}
          description="PNG, JPEG, GIF or WebP, up to 2 MB."
          onFiles={([file]) => {
            if (file) onUpload(file);
          }}
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {custom ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            disabled={busy}
            onClick={onRemove}
          >
            Use the generated avatar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
