// Lets the browser upload to and read from the profile-images bucket.
//
//   pnpm --filter @marshaldesk/web storage:cors [extra origins...]
//
// Allows NEXT_PUBLIC_APP_URL plus any origins passed as arguments. Idempotent:
// it replaces the bucket's CORS rules, so run it once per branch's storage and
// again whenever the app's origin changes.

import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const BUCKET = "profile-images";

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

const s3 = new S3Client({
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["content-type", "cache-control"],
          ExposeHeaders: ["etag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log(`CORS on ${BUCKET} now allows ${origins.join(", ")}.`);
