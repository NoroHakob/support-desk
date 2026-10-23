import {
  DeleteObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { requireEnv } from "@/lib/env";

export const PROFILE_IMAGES_BUCKET = "profile-images";

// Credentials, endpoint and region come from the AWS_* variables that
// `neon env pull` writes. Without WHEN_REQUIRED the presigner signs a checksum
// of an empty body and every browser PUT fails.
const s3 = new S3Client({
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export function profileImageUrl(key: string) {
  return `${requireEnv("STORAGE_PUBLIC_BASE_URL")}/${PROFILE_IMAGES_BUCKET}/${key}`;
}

export async function presignProfileImagePut({
  key,
  contentType,
  cacheControl,
  expiresIn,
}: {
  key: string;
  contentType: string;
  cacheControl: string;
  expiresIn: number;
}) {
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: PROFILE_IMAGES_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
    { expiresIn, signableHeaders: new Set(["content-type", "cache-control"]) },
  );
  return {
    url,
    headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
  };
}

/** Returns null when the object doesn't exist. */
export async function headProfileImage(key: string) {
  try {
    const object = await s3.send(
      new HeadObjectCommand({ Bucket: PROFILE_IMAGES_BUCKET, Key: key }),
    );
    return {
      size: object.ContentLength ?? 0,
      contentType: object.ContentType ?? null,
    };
  } catch (error) {
    if (
      error instanceof NotFound ||
      (error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404)
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteProfileImage(key: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: PROFILE_IMAGES_BUCKET, Key: key }),
  );
}
