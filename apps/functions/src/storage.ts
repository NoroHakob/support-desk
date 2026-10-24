import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

export const KNOWLEDGE_FILES_BUCKET = "knowledge-files";

// Credentials, endpoint and region come from the AWS_* variables Neon injects
// for the buckets declared in neon.ts.
const s3 = new S3Client({
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

function isNotFound(error: unknown) {
  return (
    error instanceof NotFound ||
    (error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 404)
  );
}

/** Returns null when the object doesn't exist. */
export async function headKnowledgeFile(key: string) {
  try {
    const object = await s3.send(
      new HeadObjectCommand({ Bucket: KNOWLEDGE_FILES_BUCKET, Key: key }),
    );
    return { size: object.ContentLength ?? 0, etag: object.ETag ?? null };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function readKnowledgeFile(key: string) {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: KNOWLEDGE_FILES_BUCKET, Key: key }),
  );
  if (!object.Body) {
    throw new Error(`The file ${key} has no body.`);
  }
  return object.Body.transformToByteArray();
}

export async function deleteKnowledgeFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: KNOWLEDGE_FILES_BUCKET, Key: key }),
  );
}
