import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marshaldesk/shared", "@marshaldesk/db"],
  async headers() {
    return [
      // A stable filename on customers' sites, so keep the cache short.
      {
        source: "/embed.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=300" }],
      },
      // Nothing but the widget may be framed; proxy.ts sets the widget's own
      // policy from the workspace's allowed domains.
      {
        source: "/:path((?!widget/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
