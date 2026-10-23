"use client";

import {
  imageFileTypes,
  imageMimeSchema,
  type WidgetSettings,
} from "@marshaldesk/shared";
import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client, orpc } from "@/lib/orpc";

class AvatarUploadError extends Error {}

function fileMime(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const fromName = imageFileTypes.find(
    (type) => type.extension === extension,
  )?.mime;
  const parsed = imageMimeSchema.safeParse(file.type || fromName);
  if (!parsed.success) {
    throw new AvatarUploadError("Use a PNG, JPEG, GIF or WebP image.");
  }
  return parsed.data;
}

async function uploadAvatar(file: File) {
  const upload = await client.widgetSettings.createAvatarUpload({
    mime: fileMime(file),
    size: file.size,
  });
  const response = await fetch(upload.url, {
    method: "PUT",
    headers: upload.headers,
    body: file,
  });
  if (!response.ok) {
    throw new AvatarUploadError("The upload didn't go through. Try again.");
  }
  return client.widgetSettings.confirmAvatarUpload({ key: upload.key });
}

function errorMessage(error: unknown) {
  if (error instanceof AvatarUploadError || isDefinedError(error)) {
    return error.message;
  }
  return "Couldn't update the avatar. Try again.";
}

export function useAgentAvatar() {
  const queryClient = useQueryClient();
  const saveSettings = (settings: WidgetSettings) =>
    queryClient.setQueryData(orpc.widgetSettings.get.queryKey(), settings);

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: saveSettings,
  });
  const remove = useMutation(
    orpc.widgetSettings.removeAvatar.mutationOptions({
      onSuccess: saveSettings,
    }),
  );
  const failed = upload.error ?? remove.error;

  return {
    upload: (file: File) => {
      remove.reset();
      upload.mutate(file);
    },
    remove: () => {
      upload.reset();
      remove.mutate();
    },
    busy: upload.isPending || remove.isPending,
    uploading: upload.isPending,
    error: failed ? errorMessage(failed) : null,
  };
}
