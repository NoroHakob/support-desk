// Lets the browser upload to the profile-images and knowledge-files buckets.
//
//   pnpm --filter @marshaldesk/web storage:cors [extra origins...]
//
// Allows NEXT_PUBLIC_APP_URL plus any origins passed as arguments. Idempotent:
// it replaces each bucket's CORS rules, so run it once per branch's storage
// and again whenever the app's origin changes.

import {
  PutBucketCorsCommand,
  S3Client,
  type CORSRule,
} from "@aws-sdk/client-s3";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const appUrl = process.env["NEXT_PUBLIC_APP_URL"];
if (!appUrl) {
  throw new Error("Set NEXT_PUBLIC_APP_URL in apps/web/.env.local first.");
}
const origins = [
  ...new Set(
    [appUrl, ...process.argv.slice(2)].map((url) => new URL(url).origin),
  ),
];

const rules: Record<string, CORSRule> = {
  "profile-images": {
    AllowedOrigins: origins,
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["content-type", "cache-control"],
    ExposeHeaders: ["etag"],
    MaxAgeSeconds: 3600,
  },
  // Private: the browser only uploads. The jobs function reads with its own
  // credentials.
  "knowledge-files": {
    AllowedOrigins: origins,
    AllowedMethods: ["PUT"],
    AllowedHeaders: ["content-type"],
    ExposeHeaders: ["etag"],
    MaxAgeSeconds: 3600,
  },
};

const s3 = new S3Client({
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

for (const [bucket, rule] of Object.entries(rules)) {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: [rule] },
    }),
  );
  console.log(`CORS on ${bucket} now allows ${origins.join(", ")}.`);
}
