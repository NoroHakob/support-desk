"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { client, orpc } from "@/lib/orpc";
import { upsertSource } from "@/lib/sources";

/**
 * Uploads files straight to storage with presigned URLs (PRD Flow A). The
 * storage trigger processes each file once it lands.
 */
export function useSourceUploads() {
  const queryClient = useQueryClient();
  const [uploadingIds, setUploadingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [errors, setErrors] = useState<string[]>([]);

  function setUploading(id: string, uploading: boolean) {
    setUploadingIds((current) => {
      const next = new Set(current);
      if (uploading) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function uploadOne(file: File) {
    const upload = await client.knowledge.createUpload({
      name: file.name,
      size: file.size,
    });
    queryClient.setQueryData(orpc.knowledge.sources.queryKey(), (list) =>
      upsertSource(list, upload.source),
    );
    setUploading(upload.source.id, true);
    try {
      const response = await fetch(upload.url, {
        method: "PUT",
        headers: upload.headers,
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}.`);
      }
    } finally {
      setUploading(upload.source.id, false);
    }
  }

  return {
    uploadingIds,
    errors,
    upload: (files: File[]) => {
      setErrors([]);
      for (const file of files) {
        uploadOne(file).catch((error: unknown) => {
          console.error(error);
          setErrors((current) => [
            ...current,
            `${file.name} didn't upload. Try again.`,
          ]);
        });
      }
    },
  };
}
