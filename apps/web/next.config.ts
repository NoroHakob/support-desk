import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marshaldesk/shared", "@marshaldesk/db"],
  // A stable filename on customers' sites, so keep the cache short.
  async headers() {
    return [
      {
        source: "/embed.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=300" }],
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
