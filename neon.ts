import { defineConfig } from "@neon/config/v1";

// Deployed with `pnpm functions:deploy:dev` (env values from
// apps/web/.env.local) or `pnpm functions:deploy:prod` (from apps/web/.env.prod)
// (TECH-STACK section 9, docs/MY-CHANGES.md section 10).
export default defineConfig({
  functions: {
    jobs: {
      name: "SupportDesk jobs",
      source: "apps/functions/src/index.ts",
      env: {
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env["GOOGLE_GENERATIVE_AI_API_KEY"]!,
        FUNCTIONS_SECRET: process.env["FUNCTIONS_SECRET"]!,
        REALTIME_URL: process.env["REALTIME_URL"]!,
        REALTIME_PUBLISH_SECRET: process.env["REALTIME_PUBLISH_SECRET"]!,
      },
    },
  },
  // knowledge-files is declared so Neon injects the AWS_* variables into the
  // function; source files live there, not in the `uploads` bucket.
  // profile-images holds agent avatars, served straight from their public URL.
  buckets: {
    "knowledge-files": { access: "private" },
    "profile-images": { access: "public_read" },
  },
  triggers: {
    "source-uploaded": {
      type: "storage_object_created",
      function: "jobs",
      bucket: "knowledge-files",
      prefix: "workspaces/",
      functionPath: "/triggers/source-uploaded",
    },
    "auto-close": {
      type: "schedule",
      function: "jobs",
      cron: "*/15 * * * *",
      functionPath: "/triggers/auto-close",
    },
  },
});
