"use client";

import { AGENT_AVATAR_MAX_BYTES, imageFileTypes } from "@marshaldesk/shared";

import { Dropzone } from "@/components/dashboard/dropzone";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/widget/widget-panel";

export function AgentAvatarField({
  avatarUrl,
  agentName,
  custom,
  onUpload,
  onRemove,
}: {
  avatarUrl: string;
  agentName: string;
  custom: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <AgentAvatar src={avatarUrl} name={agentName} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Dropzone
          compact
          accept={imageFileTypes}
          typeLabel="PNG, JPEG, GIF or WebP"
          maxBytes={AGENT_AVATAR_MAX_BYTES}
          title="Upload an avatar"
          description="PNG, JPEG, GIF or WebP, up to 10 MB."
          onFiles={([file]) => {
            if (file) onUpload(file);
          }}
        />
        {custom ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={onRemove}
          >
            Use the generated avatar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
