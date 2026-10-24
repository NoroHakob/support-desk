import { defineConfig } from "@neon/config/v1";

// Deployed with `pnpm functions:deploy:dev`, which reads the env values below
// from apps/web/.env.local (TECH-STACK section 9).
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
  // Declared so Neon injects the AWS_* variables into the function. Source
  // files live here, not in the `uploads` bucket inherited from production.
  buckets: {
    "knowledge-files": { access: "private" },
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
